import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// DELETE /api/customer/reservations/[id] — Cancel reservation
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

    if (reservation.status === "CANCELLED" || reservation.status === "COMPLETED" || reservation.status === "NO_SHOW") {
      return error("Cette reservation ne peut plus etre annulee");
    }

    const updated = await db.reservation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Annulee par le client",
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[RESERVATIONS DELETE]", err);
    return error("Erreur interne du serveur", 500);
  }
}
