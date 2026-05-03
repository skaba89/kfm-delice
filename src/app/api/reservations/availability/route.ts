import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/reservations/availability
// ?date=YYYY-MM-DD&partySize=N
// Returns available time slots based on restaurant hours, capacity, existing reservations
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const partySizeStr = searchParams.get("partySize");

    if (!dateStr) {
      return error("Le parametre date est requis (format YYYY-MM-DD)");
    }

    const partySize = partySizeStr ? parseInt(partySizeStr, 10) : null;
    if (partySizeStr && (isNaN(partySize as number) || (partySize as number) < 1)) {
      return error("Le nombre de convives doit etre un entier positif");
    }

    const reservationDate = new Date(dateStr + "T00:00:00.000Z");
    if (isNaN(reservationDate.getTime())) {
      return error("Format de date invalide. Utilisez YYYY-MM-DD");
    }

    // Get active restaurant with hours
    const restaurant = await db.restaurant.findFirst({
      where: { isActive: true },
      include: { hours: true, settings: true },
    });

    if (!restaurant) {
      return error("Aucun restaurant actif trouve", 404);
    }

    // Get the day of week for the requested date
    const dayOfWeek = reservationDate.getUTCDay();
    const prismaDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const hours = restaurant.hours.find((h) => h.dayOfWeek === prismaDayOfWeek);

    if (!hours || hours.isClosed) {
      return success({
        date: dateStr,
        isOpen: false,
        message: "Le restaurant est ferme ce jour.",
        availableSlots: [],
        restaurantName: restaurant.name,
      });
    }

    const openTime = hours.openTime || "11:00";
    const closeTime = hours.closeTime || "23:00";
    const breakStart = hours.breakStart;
    const breakEnd = hours.breakEnd;
    const lastSeating = hours.lastSeating || closeTime;
    const slotDuration = restaurant.settings?.tableTime || 120; // minutes per reservation

    // Total capacity
    const totalCapacity = restaurant.indoorCapacity
      ? restaurant.indoorCapacity + (restaurant.outdoorCapacity || 0)
      : 50;

    // Generate time slots (30-minute intervals)
    const slots: Array<{
      time: string;
      available: number;
      canBook: boolean;
    }> = [];

    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);
    const lastSeatingMinutes = timeToMinutes(lastSeating);
    const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : -1;
    const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : -1;

    // Get existing reservations for that date
    const dayStart = new Date(dateStr + "T00:00:00.000Z");
    const dayEnd = new Date(dateStr + "T00:00:00.000Z");
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingReservations = await db.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        date: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { time: true, partySize: true, duration: true },
    });

    // Build occupancy map: for each time slot, calculate how many seats are taken
    for (let minutes = openMinutes; minutes < lastSeatingMinutes; minutes += 30) {
      const timeStr = minutesToTime(minutes);

      // Skip if within break
      if (
        breakStartMinutes >= 0 &&
        breakEndMinutes >= 0 &&
        minutes >= breakStartMinutes &&
        minutes < breakEndMinutes
      ) {
        continue;
      }

      // Calculate occupancy: count all reservations that overlap with this slot
      let occupied = 0;
      for (const res of existingReservations) {
        const resStart = timeToMinutes(res.time);
        const resEnd = resStart + (res.duration || 120);

        // Check overlap: reservation covers this time slot
        if (resStart <= minutes && minutes < resEnd) {
          occupied += res.partySize;
        }
      }

      const available = Math.max(0, totalCapacity - occupied);
      const canBook = partySize ? available >= partySize : available > 0;

      slots.push({
        time: timeStr,
        available,
        canBook,
      });
    }

    return success({
      date: dateStr,
      isOpen: true,
      restaurantName: restaurant.name,
      totalCapacity,
      requestedPartySize: partySize,
      slotDurationMinutes: slotDuration,
      openTime,
      closeTime,
      lastSeating,
      breakTime: breakStart && breakEnd ? `${breakStart}-${breakEnd}` : null,
      availableSlots: slots,
    });
  } catch (err) {
    console.error("[RESERVATIONS AVAILABILITY GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// Helper: "HH:mm" → minutes since midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Helper: minutes since midnight → "HH:mm"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
