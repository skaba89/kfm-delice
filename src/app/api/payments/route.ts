import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { verifyToken } from "@/lib/auth";

// ============================================
// GET /api/payments — List payments (admin/protected)
// ============================================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      db.payment.findMany({
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
      db.payment.count({ where }),
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
// POST /api/payments — Create payment (legacy, redirects to intent)
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Redirect to the new intent flow
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
