import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/kitchen/orders — Kitchen orders
// ?status=active | ready | all
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

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return error("Utilisateur invalide", 401);
    }

    if (user.role !== "KITCHEN") {
      return error("Acces non autorise", 403);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "active";

    let whereStatuses: string[] = [];
    if (statusFilter === "active") {
      whereStatuses = ["PENDING", "CONFIRMED", "PREPARING"];
    } else if (statusFilter === "ready") {
      whereStatuses = ["READY"];
    } else {
      whereStatuses = [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
      ];
    }

    const orders = await db.order.findMany({
      where: {
        status: { in: whereStatuses as any },
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return success(orders);
  } catch (err) {
    console.error("[KITCHEN ORDERS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
