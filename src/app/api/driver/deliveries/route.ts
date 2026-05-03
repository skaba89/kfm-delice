import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/driver/deliveries — Driver deliveries
// ?status=active | completed | all
// ============================================
export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";

    let whereStatuses: string[] = [];
    if (statusFilter === "active") {
      whereStatuses = [
        "DRIVER_ASSIGNED",
        "DRIVER_ARRIVED_PICKUP",
        "PICKED_UP",
        "DRIVER_ARRIVED_DROPOFF",
      ];
    } else if (statusFilter === "completed") {
      whereStatuses = ["DELIVERED"];
    } else {
      whereStatuses = [
        "DRIVER_ASSIGNED",
        "DRIVER_ARRIVED_PICKUP",
        "PICKED_UP",
        "DRIVER_ARRIVED_DROPOFF",
        "DELIVERED",
        "FAILED",
        "CANCELLED",
        "RETURNED",
      ];
    }

    const deliveries = await db.delivery.findMany({
      where: {
        driverId: driver.id,
        status: { in: whereStatuses as any },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            total: true,
            items: {
              select: {
                itemName: true,
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(deliveries);
  } catch (err) {
    console.error("[DRIVER DELIVERIES GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
