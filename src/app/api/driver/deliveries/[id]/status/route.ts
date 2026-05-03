import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { emitToRoom } from "@/lib/socket-server";

// ============================================
// PATCH /api/driver/deliveries/[id]/status
// ============================================
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRIVER_ASSIGNED: ["DRIVER_ARRIVED_PICKUP"],
  DRIVER_ARRIVED_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["DRIVER_ARRIVED_DROPOFF"],
  DRIVER_ARRIVED_DROPOFF: ["DELIVERED"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const { verifyToken } = await import("@/lib/auth");
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const driver = await db.driver.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    if (!driver) {
      return error("Profil livreur introuvable", 404);
    }

    const delivery = await db.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return error("Livraison introuvable", 404);
    }

    if (delivery.driverId !== driver.id) {
      return error("Cette livraison ne vous est pas assignee", 403);
    }

    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return error("Le statut est requis");
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[delivery.status] || [];
    if (!allowed.includes(newStatus)) {
      return error(
        `Transition invalide : ${delivery.status} → ${newStatus}. Transitions autorisees : ${allowed.join(", ") || "aucune"}`
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "DRIVER_ARRIVED_PICKUP") {
      updateData.driverArrivedAt = new Date();
    }
    if (newStatus === "PICKED_UP") {
      updateData.pickedUpAt = new Date();
    }
    if (newStatus === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    const updated = await db.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            status: true,
          },
        },
      },
    });

    // Update driver status based on delivery status
    if (newStatus === "DELIVERED") {
      // Check if driver has other active deliveries
      const activeDeliveries = await db.delivery.count({
        where: {
          driverId: driver.id,
          status: {
            in: [
              "DRIVER_ASSIGNED",
              "DRIVER_ARRIVED_PICKUP",
              "PICKED_UP",
              "DRIVER_ARRIVED_DROPOFF",
            ],
          },
        },
      });

      if (activeDeliveries === 0) {
        await db.driver.update({
          where: { id: driver.id },
          data: {
            status: "online",
            isAvailable: true,
          },
        });
      }

      // Update order status to DELIVERED
      await db.order.update({
        where: { id: delivery.orderId },
        data: { status: "DELIVERED" },
      });

      // Increment driver total deliveries and earnings
      const driverEarning = updated.driverEarning + (updated.tip || 0);
      await db.driver.update({
        where: { id: driver.id },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: driverEarning },
        },
      });
    } else if (
      ["PICKED_UP", "DRIVER_ARRIVED_PICKUP", "DRIVER_ARRIVED_DROPOFF"].includes(
        newStatus
      )
    ) {
      await db.driver.update({
        where: { id: driver.id },
        data: { status: "busy", isAvailable: false },
      });
    }

    // Emit WebSocket event for real-time notifications
    try {
      emitToRoom("delivery-update", "drivers", {
        deliveryId: updated.id,
        orderId: delivery.orderId,
        status: newStatus,
        driverName: `${driver?.id || ""}`,
      });
      emitToRoom("delivery-update", "admin", {
        deliveryId: updated.id,
        orderId: delivery.orderId,
        status: newStatus,
        driverName: "Livreur",
      });
    } catch {
      // WebSocket not available — fallback to polling
    }

    return success(updated);
  } catch (err) {
    console.error("[DRIVER DELIVERY STATUS PATCH]", err);
    return error("Erreur interne du serveur", 500);
  }
}
