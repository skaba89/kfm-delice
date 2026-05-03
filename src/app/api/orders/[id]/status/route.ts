import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";

// ============================================
// PATCH /api/orders/[id]/status — Update order status
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return error("Status is required");
    }

    const VALID_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"];
    if (!VALID_STATUSES.includes(status)) {
      return error("Statut invalide", 400);
    }

    const order = await db.order.findUnique({
      where: { id },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status,
        // Set timestamp fields based on status
        ...(status === "CONFIRMED" && { confirmedAt: new Date() }),
        ...(status === "PREPARING" && { preparingAt: new Date() }),
        ...(status === "READY" && { readyAt: new Date() }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        ...(status === "CANCELLED" && { cancelledAt: new Date() }),
      },
    });

    // Create status history entry
    await db.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        notes: body.notes || null,
      },
    });

    // Notify customer about status update
    if (order.customerId) {
      const statusLabels: Record<string, string> = {
        CONFIRMED: "confirmée",
        PREPARING: "en cours de préparation",
        READY: "prête",
        OUT_FOR_DELIVERY: "en livraison",
        DELIVERED: "livrée",
        COMPLETED: "terminée",
        CANCELLED: "annulée",
      };

      await createNotification({
        userId: order.customerId,
        restaurantId: order.restaurantId,
        title: "Mise à jour de commande",
        message: `Votre commande ${order.orderNumber} est ${statusLabels[status] || status}`,
        type: "ORDER_UPDATE",
        data: { orderId: order.id, status },
      });
    }

    return success(updatedOrder);
  } catch (err) {
    console.error("[ORDER STATUS PATCH]", err);
    return error("Internal server error", 500);
  }
}
