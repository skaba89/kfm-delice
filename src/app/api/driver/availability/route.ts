import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/driver/availability — Toggle online/offline
// ============================================
export async function PATCH(req: NextRequest) {
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
    });

    if (!driver) {
      return error("Profil livreur introuvable", 404);
    }

    const body = await req.json();
    const { isAvailable } = body;

    if (typeof isAvailable !== "boolean") {
      return error("isAvailable doit etre un booleen");
    }

    // Don't allow going offline if driver has active deliveries
    if (!isAvailable) {
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

      if (activeDeliveries > 0) {
        return error(
          "Impossible de se mettre hors ligne : vous avez des livraisons en cours",
          400
        );
      }
    }

    const updated = await db.driver.update({
      where: { id: driver.id },
      data: {
        isAvailable,
        status: isAvailable ? "online" : "offline",
      },
    });

    return success({
      id: updated.id,
      isAvailable: updated.isAvailable,
      status: updated.status,
    });
  } catch (err) {
    console.error("[DRIVER AVAILABILITY PATCH]", err);
    return error("Erreur interne du serveur", 500);
  }
}
