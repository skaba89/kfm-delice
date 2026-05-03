import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { verifyToken } from "@/lib/auth";

// ============================================
// GET /api/customer/orders/[id] — Get single order details
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
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

    const { id } = await params;

    // Find customer profile
    const profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile) {
      return error("Profil client introuvable", 404);
    }

    const order = await db.order.findFirst({
      where: {
        id,
        customerId: profile.id,
      },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return error("Commande introuvable", 404);
    }

    return success({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      orderType: order.orderType,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      serviceCharge: order.serviceCharge,
      deliveryFee: order.deliveryFee,
      tip: order.tip,
      total: order.total,
      currency: order.currency,
      deliveryAddress: order.deliveryAddress,
      deliveryCity: order.deliveryCity,
      deliveryDistrict: order.deliveryDistrict,
      deliveryNotes: order.deliveryNotes,
      notes: order.notes,
      tableNumber: order.tableNumber,
      loyaltyPointsEarned: order.loyaltyPointsEarned,
      confirmedAt: order.confirmedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      deliveredAt: order.deliveredAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        itemImage: item.itemImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        variantName: item.variantName,
        options: item.options,
        status: item.status,
        notes: item.notes,
      })),
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        notes: h.notes,
        changedBy: h.changedBy,
        createdAt: h.createdAt,
      })),
      payments: order.payments,
    });
  } catch (err) {
    console.error("[CUSTOMER ORDER DETAIL GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
