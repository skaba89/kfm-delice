import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/public/receipt — Get receipt for guest orders
// ?orderNumber=CMD-...&phone=+224...
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");
    const phone = searchParams.get("phone");

    if (!orderNumber || !phone) {
      return error("Numero de commande et telephone requis", 400);
    }

    const order = await db.order.findFirst({
      where: { orderNumber, customerPhone: phone },
      include: {
        items: { orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            provider: true,
            status: true,
            transactionId: true,
            processedAt: true,
            createdAt: true,
          },
        },
        restaurant: {
          select: {
            name: true,
            phone: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!order) {
      return error("Commande introuvable", 404);
    }

    // Verify phone matches
    const normalizedPhone = phone.replace(/[\s\-]/g, "").replace(/^0/, "+224");
    const normalizedOrderPhone = order.customerPhone?.replace(/[\s\-]/g, "").replace(/^0/, "+224") || "";

    if (normalizedPhone !== normalizedOrderPhone) {
      return error("Telephone ne correspond pas a cette commande", 403);
    }

    return success({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryFee,
      total: order.total,
      currency: order.currency || "XOF",
      deliveryAddress: order.deliveryAddress,
      deliveryCity: order.deliveryCity,
      deliveryDistrict: order.deliveryDistrict,
      notes: order.notes,
      tableNumber: order.tableNumber,
      loyaltyPointsEarned: order.loyaltyPointsEarned,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      items: order.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        variantName: item.variantName,
      })),
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        notes: h.notes,
        createdAt: h.createdAt,
      })),
      payments: order.payments,
      restaurant: order.restaurant,
    });
  } catch (err) {
    console.error("[PUBLIC RECEIPT GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
