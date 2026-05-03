import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { checkAnyPermission } from "@/lib/rbac";
import { Permissions } from "@/lib/permissions";
import { withRLS, buildRLSUser } from "@/lib/prisma-extensions";

// ============================================
// GET /api/payments — List payments (RBAC + RLS)
// ============================================
export async function GET(req: NextRequest) {
  try {
    // Roles that can read payments/invoices
    const userOrError = await checkAnyPermission(req, [
      Permissions.INVOICES_READ,
      Permissions.INVOICES_MANAGE,
      Permissions.REPORTS_VIEW,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    // Apply RLS — scope to user's restaurant
    const rlsUser = await buildRLSUser(userOrError.id, userOrError.role);
    const secureDb = withRLS(db, rlsUser);

    const [payments, total] = await Promise.all([
      secureDb.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      secureDb.payment.count({ where }),
    ]);

    return success({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[PAYMENTS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// POST /api/payments — Create payment (RBAC)
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Roles that can create payments
    const userOrError = await checkAnyPermission(req, [
      Permissions.INVOICES_CREATE,
      Permissions.INVOICES_MANAGE,
      Permissions.POS_ACCESS,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const body = await req.json();
    const { orderId, method, amount, provider, phoneNumber } = body;

    if (!orderId || !method || amount === undefined) {
      return error("orderId, method, et amount sont requis");
    }

    // Dynamic import to avoid circular deps
    const { createPaymentIntent } = await import("@/lib/payments/service");
    const result = await createPaymentIntent({
      orderId,
      amount: parseFloat(amount),
      method,
      provider: provider || null,
      phoneNumber: phoneNumber || null,
    });

    if (!result.success) {
      return error(result.error || "Erreur lors de la creation du paiement", 400);
    }

    return success(result.data, 201);
  } catch (err) {
    console.error("[PAYMENTS POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}
