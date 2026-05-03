import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/driver/profile — Driver profile
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
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, phone: true },
        },
      },
    });

    if (!driver) {
      return error("Profil livreur introuvable", 404);
    }

    return success({
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      email: driver.email,
      avatar: driver.avatar,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate,
      isVerified: driver.isVerified,
      isActive: driver.isActive,
      isAvailable: driver.isAvailable,
      status: driver.status,
      totalDeliveries: driver.totalDeliveries,
      totalEarnings: driver.totalEarnings,
      rating: driver.rating,
      createdAt: driver.createdAt,
      restaurant: driver.restaurant,
    });
  } catch (err) {
    console.error("[DRIVER PROFILE GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
