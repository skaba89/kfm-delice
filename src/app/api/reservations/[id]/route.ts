import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PUT /api/reservations/[id] — Update reservation status
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, internalNotes } = body;

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return error("Reservation non trouvee", 404);
    }

    const validStatuses = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", "SEATED"];
    if (!status || !validStatuses.includes(status)) {
      return error(`Statut invalide. Valeurs autorisees : ${validStatuses.join(", ")}`);
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["SEATED", "CANCELLED", "NO_SHOW"],
      SEATED: ["COMPLETED", "NO_SHOW"],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    const allowed = validTransitions[reservation.status] || [];
    if (!allowed.includes(status)) {
      return error(
        `Transition invalide : ${reservation.status} → ${status}. Transitions autorisees : ${allowed.join(", ") || "aucune"}`
      );
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    } else if (status === "SEATED") {
      updateData.seatedAt = new Date();
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = internalNotes || "Annulee par l'admin";
    } else if (status === "NO_SHOW") {
      updateData.noShowAt = new Date();
    }

    if (internalNotes) {
      updateData.internalNotes = internalNotes;
    }

    const updated = await db.reservation.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[RESERVATIONS PUT]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// DELETE /api/reservations/[id] — Cancel reservation
// ============================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return error("Reservation non trouvee", 404);
    }

    if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(reservation.status)) {
      return error("Cette reservation ne peut plus etre annulee");
    }

    const updated = await db.reservation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Annulee par l'admin",
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[RESERVATIONS DELETE]", err);
    return error("Erreur interne du serveur", 500);
  }
}
