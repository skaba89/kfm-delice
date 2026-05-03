import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/kitchen/orders/[id]/status
// Valid transitions: PENDING → CONFIRMED, CONFIRMED → PREPARING, PREPARING → READY
// ============================================
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY"],
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

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return error("Commande introuvable", 404);
    }

    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return error("Le statut est requis");
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return error(
        `Transition invalide : ${order.status} → ${newStatus}. Transitions autorisees : ${allowed.join(", ") || "aucune"}`
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    } else if (newStatus === "PREPARING") {
      updateData.preparingAt = new Date();
      // Also update all pending items to preparing
      updateData.items = {
        updateMany: {
          where: { status: "pending" },
          data: { status: "preparing", startedAt: new Date() },
        },
      };
    } else if (newStatus === "READY") {
      updateData.readyAt = new Date();
      // Also update all non-cancelled items to ready
      updateData.items = {
        updateMany: {
          where: { status: { in: ["pending", "preparing"] } },
          data: { status: "ready", completedAt: new Date() },
        },
      };
    }

    const updated = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    // Create status history entry
    await db.orderStatusHistory.create({
      data: {
        orderId: id,
        status: newStatus,
        changedBy: user.id,
        notes: `Statut change en ${newStatus} par la cuisine`,
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[KITCHEN ORDER STATUS PATCH]", err);
    return error("Erreur interne du serveur", 500);
  }
}
