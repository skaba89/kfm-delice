import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { verifyToken } from "@/lib/auth";

// ============================================
// GET /api/customer/reservations — Get customer reservations
// ============================================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Find customer profile by userId
    const profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile) {
      // No customer profile yet — return empty
      return success([]);
    }

    const whereClause: Record<string, unknown> = {
      customerId: profile.id,
    };

    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter;
    }

    const reservations = await db.reservation.findMany({
      where: whereClause,
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });

    return success(
      reservations.map((r) => ({
        id: r.id,
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        guestEmail: r.guestEmail,
        partySize: r.partySize,
        date: r.date,
        time: r.time,
        duration: r.duration,
        status: r.status,
        occasion: r.occasion,
        specialRequests: r.specialRequests,
        confirmedAt: r.confirmedAt,
        seatedAt: r.seatedAt,
        completedAt: r.completedAt,
        cancelledAt: r.cancelledAt,
        createdAt: r.createdAt,
      }))
    );
  } catch (err) {
    console.error("[CUSTOMER RESERVATIONS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// POST /api/customer/reservations — Create reservation
// ============================================
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const body = await req.json();
    const { guestName, guestPhone, guestEmail, partySize, date, time, duration, occasion, specialRequests } = body;

    if (!guestName || !guestPhone || !partySize || !date || !time) {
      return error("Veuillez remplir tous les champs obligatoires", 400);
    }

    if (partySize < 1 || partySize > 50) {
      return error("Le nombre de convives doit etre entre 1 et 50", 400);
    }

    // Find or create customer profile
    let profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile) {
      // Auto-create customer profile
      const restaurant = await db.restaurant.findFirst({
        where: { isActive: true },
      });
      if (!restaurant) {
        return error("Aucun restaurant configure", 500);
      }
      profile = await db.customerProfile.create({
        data: {
          userId: payload.userId,
          restaurantId: restaurant.id,
          firstName: guestName.split(" ")[0] || "",
          lastName: guestName.split(" ").slice(1).join(" ") || "",
          phone: guestPhone,
          email: guestEmail || null,
          totalOrders: 0,
          totalSpent: 0,
        },
      });
    }

    const reservation = await db.reservation.create({
      data: {
        restaurantId: profile.restaurantId,
        customerId: profile.id,
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        partySize,
        date: new Date(date),
        time,
        duration: duration || 120,
        status: "PENDING",
        occasion: occasion || null,
        specialRequests: specialRequests || null,
      },
    });

    return success({
      id: reservation.id,
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      partySize: reservation.partySize,
      date: reservation.date,
      time: reservation.time,
      status: reservation.status,
    }, 201);
  } catch (err) {
    console.error("[CUSTOMER RESERVATIONS POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}
