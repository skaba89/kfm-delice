import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/driver/earnings — Earnings data
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
      select: { id: true },
    });

    if (!driver) {
      return error("Profil livreur introuvable", 404);
    }

    const deliveries = await db.delivery.findMany({
      where: {
        driverId: driver.id,
        status: "DELIVERED",
      },
      select: {
        id: true,
        driverEarning: true,
        tip: true,
        deliveredAt: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
            customerName: true,
          },
        },
      },
      orderBy: { deliveredAt: "desc" },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of week (Monday)
    const dayOfWeek = todayStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() + mondayOffset);

    // Start of month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarnings = 0;
    let todayEarnings = 0;
    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;
    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    // Daily breakdown for the last 7 days
    const dailyBreakdown: { date: string; earnings: number; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(todayStart);
      dayDate.setDate(todayStart.getDate() - i);
      const nextDay = new Date(dayDate);
      nextDay.setDate(dayDate.getDate() + 1);

      const dayDeliveries = deliveries.filter(
        (d) => d.deliveredAt && d.deliveredAt >= dayDate && d.deliveredAt < nextDay
      );

      const dayEarnings = dayDeliveries.reduce(
        (sum, d) => sum + d.driverEarning + (d.tip || 0),
        0
      );

      dailyBreakdown.push({
        date: dayDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        earnings: dayEarnings,
        count: dayDeliveries.length,
      });
    }

    for (const d of deliveries) {
      const earning = d.driverEarning + (d.tip || 0);
      const deliveredAt = d.deliveredAt;

      totalEarnings += earning;

      if (deliveredAt && deliveredAt >= todayStart) {
        todayEarnings += earning;
        todayCount++;
      }
      if (deliveredAt && deliveredAt >= weekStart) {
        thisWeekEarnings += earning;
        thisWeekCount++;
      }
      if (deliveredAt && deliveredAt >= monthStart) {
        thisMonthEarnings += earning;
        thisMonthCount++;
      }
    }

    const recentDeliveries = deliveries.slice(0, 20).map((d) => ({
      id: d.id,
      orderNumber: d.order?.orderNumber || "N/A",
      customerName: d.order?.customerName || "N/A",
      earning: d.driverEarning + (d.tip || 0),
      deliveredAt: d.deliveredAt,
    }));

    return success({
      totalEarnings,
      totalDeliveries: deliveries.length,
      todayEarnings,
      todayDeliveries: todayCount,
      thisWeekEarnings,
      thisWeekDeliveries: thisWeekCount,
      thisMonthEarnings,
      thisMonthDeliveries: thisMonthCount,
      dailyBreakdown,
      recentDeliveries,
    });
  } catch (err) {
    console.error("[DRIVER EARNINGS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
