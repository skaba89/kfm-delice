import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { emitToRoom } from "@/lib/socket-server";

// ============================================
// GET /api/reservations — List reservations with date filter + capacity info
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    // date=YYYY-MM-DD filter: reservations for a specific date
    if (date) {
      const d = new Date(date + "T00:00:00.000Z");
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    } else if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const reservations = await db.reservation.findMany({
      where,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    // If date filter, also return capacity info
    let capacityInfo = null;
    if (date) {
      const restaurant = await db.restaurant.findFirst({
        where: { isActive: true },
        include: { hours: true },
      });

      if (restaurant) {
        const totalCapacity = restaurant.indoorCapacity
          ? restaurant.indoorCapacity + (restaurant.outdoorCapacity || 0)
          : 50;

        // Count existing reservations per time slot
        const timeSlotMap = new Map<string, number>();
        reservations.forEach((r) => {
          if (r.status !== "CANCELLED" && r.status !== "NO_SHOW") {
            timeSlotMap.set(r.time, (timeSlotMap.get(r.time) || 0) + r.partySize);
          }
        });

        capacityInfo = {
          totalCapacity,
          timeSlots: Array.from(timeSlotMap.entries()).map(([time, partySize]) => ({
            time,
            partySize,
            available: Math.max(0, totalCapacity - partySize),
          })),
          restaurantHours: restaurant.hours
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((h) => ({
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isClosed: h.isClosed,
              breakStart: h.breakStart,
              breakEnd: h.breakEnd,
              lastSeating: h.lastSeating,
            })),
        };
      }
    }

    return success({ reservations, capacityInfo });
  } catch (err) {
    console.error("[RESERVATIONS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/reservations — Create reservation with validation
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      guestName,
      guestPhone,
      guestEmail,
      partySize,
      date,
      time,
      duration,
      occasion,
      specialRequests,
    } = body;

    if (!restaurantId || !guestName || !guestPhone || !partySize || !date || !time) {
      return error("restaurantId, guestName, guestPhone, partySize, date, and time are required");
    }

    const partySizeNum = parseInt(partySize, 10);
    if (isNaN(partySizeNum) || partySizeNum < 1 || partySizeNum > 50) {
      return error("Le nombre de convives doit etre entre 1 et 50");
    }

    // Validate date is in the future
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      return error("La date de reservation doit etre dans le futur");
    }

    // Check restaurant operating hours
    const dayOfWeek = reservationDate.getUTCDay();
    // Convert: JS Sunday=0, Prisma Monday=0 → JS(0=Sun) → Prisma(Sun=6)
    const prismaDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const restaurantHour = await db.restaurantHour.findUnique({
      where: {
        restaurantId_dayOfWeek: { restaurantId, dayOfWeek: prismaDayOfWeek },
      },
    });

    if (!restaurantHour || restaurantHour.isClosed) {
      return error("Le restaurant est ferme ce jour. Veuillez choisir une autre date.");
    }

    if (restaurantHour.openTime && restaurantHour.closeTime) {
      if (time < restaurantHour.openTime || time >= restaurantHour.closeTime) {
        return error(
          `Le restaurant est ouvert de ${restaurantHour.openTime} a ${restaurantHour.closeTime} ce jour. Veuillez choisir un creneau horaire valide.`
        );
      }
    }

    // Check break time
    if (restaurantHour.breakStart && restaurantHour.breakEnd) {
      if (time >= restaurantHour.breakStart && time < restaurantHour.breakEnd) {
        return error(
          `Le restaurant est en pause de ${restaurantHour.breakStart} a ${restaurantHour.breakEnd}. Veuillez choisir un autre creneau.`
        );
      }
    }

    // Check last seating
    if (restaurantHour.lastSeating && time > restaurantHour.lastSeating) {
      return error(
        `La derniere prise de commande est a ${restaurantHour.lastSeating}. Veuillez choisir un creneau plus tot.`
      );
    }

    // Check capacity conflicts
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (restaurant) {
      const totalCapacity = restaurant.indoorCapacity
        ? restaurant.indoorCapacity + (restaurant.outdoorCapacity || 0)
        : 50;

      const dayStart = new Date(date + "T00:00:00.000Z");
      const dayEnd = new Date(date + "T00:00:00.000Z");
      dayEnd.setDate(dayEnd.getDate() + 1);

      const existingReservations = await db.reservation.findMany({
        where: {
          restaurantId,
          date: { gte: dayStart, lt: dayEnd },
          time,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
      });

      const currentOccupancy = existingReservations.reduce((sum, r) => sum + r.partySize, 0);
      const remainingCapacity = totalCapacity - currentOccupancy;

      if (remainingCapacity < partySizeNum) {
        return error(
          `Plus assez de place pour ${partySizeNum} personne(s) a ${time}. Capacite restante : ${Math.max(0, remainingCapacity)} personne(s).`
        );
      }
    }

    const reservation = await db.reservation.create({
      data: {
        restaurantId,
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        partySize: partySizeNum,
        date: new Date(date),
        time,
        duration: duration ? parseInt(duration) : 120,
        status: "PENDING",
        occasion: occasion || null,
        specialRequests: specialRequests || null,
      },
    });

    // Emit WebSocket event for real-time notifications
    try {
      emitToRoom("reservation-created", "admin", {
        reservationId: reservation.id,
        guestName: reservation.guestName,
        date: reservation.date.toISOString().split("T")[0],
        time: reservation.time,
        partySize: reservation.partySize,
      });
    } catch {
      // WebSocket not available — fallback to polling
    }

    return success(reservation, 201);
  } catch (err) {
    console.error("[RESERVATIONS POST]", err);
    return error("Internal server error", 500);
  }
}
