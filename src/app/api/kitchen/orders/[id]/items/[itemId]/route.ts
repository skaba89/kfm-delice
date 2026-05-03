import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/kitchen/orders/[id]/items/[itemId]
// Valid transitions: pending → preparing → ready → served
// ============================================
const VALID_ITEM_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing"],
  preparing: ["ready"],
  ready: ["served"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
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

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      return error("Article introuvable dans cette commande", 404);
    }

    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return error("Le statut est requis");
    }

    const allowed = VALID_ITEM_TRANSITIONS[item.status] || [];
    if (!allowed.includes(newStatus)) {
      return error(
        `Transition invalide : ${item.status} → ${newStatus}. Transitions autorisees : ${allowed.join(", ") || "aucune"}`
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "preparing") {
      updateData.startedAt = new Date();
    } else if (newStatus === "ready") {
      updateData.completedAt = new Date();
    }

    const updatedItem = await db.orderItem.update({
      where: { id: itemId },
      data: updateData,
    });

    // Refresh order with all items to check auto-transitions
    const allItems = await db.orderItem.findMany({
      where: { orderId: id },
    });

    const pendingOrPreparing = allItems.filter(
      (i) => i.status === "pending" || i.status === "preparing"
    );
    const allReady = allItems.every(
      (i) => i.status === "ready" || i.status === "served" || i.status === "cancelled"
    );
    const allServed = allItems.every(
      (i) => i.status === "served" || i.status === "cancelled"
    );

    // Auto-update order status when ALL items are ready
    if (allReady && (order.status === "CONFIRMED" || order.status === "PREPARING")) {
      await db.order.update({
        where: { id },
        data: {
          status: "READY",
          readyAt: new Date(),
        },
      });

      await db.orderStatusHistory.create({
        data: {
          orderId: id,
          status: "READY",
          changedBy: user.id,
          notes: "Tous les articles sont prets",
        },
      });
    }

    // Auto-complete DINE_IN orders when all items are served
    if (allServed && order.orderType === "DINE_IN" && order.status === "READY") {
      await db.order.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await db.orderStatusHistory.create({
        data: {
          orderId: id,
          status: "COMPLETED",
          changedBy: user.id,
          notes: "Tous les articles servis (service sur place)",
        },
      });
    }

    // If still has pending items but order was CONFIRMED, move order to PREPARING
    if (
      newStatus === "preparing" &&
      order.status === "CONFIRMED" &&
      pendingOrPreparing.length > 0
    ) {
      await db.order.update({
        where: { id },
        data: {
          status: "PREPARING",
          preparingAt: new Date(),
        },
      });

      await db.orderStatusHistory.create({
        data: {
          orderId: id,
          status: "PREPARING",
          changedBy: user.id,
          notes: "Preparation demarree",
        },
      });
    }

    return success(updatedItem);
  } catch (err) {
    console.error("[KITCHEN ITEM STATUS PATCH]", err);
    return error("Erreur interne du serveur", 500);
  }
}
