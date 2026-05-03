import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/kitchen/stats — Kitchen statistics
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

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    );

    // Parallel queries for all stats
    const [
      ordersInQueue,
      ordersPreparing,
      ordersReady,
      ordersCompletedToday,
      todayItems,
    ] = await Promise.all([
      // Orders in queue (PENDING)
      db.order.count({ where: { status: "PENDING" } }),
      // Orders being prepared (CONFIRMED + PREPARING)
      db.order.count({
        where: { status: { in: ["CONFIRMED", "PREPARING"] } },
      }),
      // Orders ready (READY)
      db.order.count({ where: { status: "READY" } }),
      // Orders completed today
      db.order.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startOfDay },
        },
      }),
      // Items completed today (ready or served items)
      db.orderItem.findMany({
        where: {
          completedAt: { gte: startOfDay },
          status: { in: ["ready", "served"] },
        },
        select: { startedAt: true, completedAt: true },
      }),
    ]);

    // Average prep time (in minutes)
    const itemsWithBothTimes = todayItems.filter(
      (i) => i.startedAt && i.completedAt
    );
    let avgPrepTime = 0;
    if (itemsWithBothTimes.length > 0) {
      const totalPrepMs = itemsWithBothTimes.reduce((acc, i) => {
        return (
          acc +
          (new Date(i.completedAt!).getTime() -
            new Date(i.startedAt!).getTime())
        );
      }, 0);
      avgPrepTime = Math.round(
        totalPrepMs / itemsWithBothTimes.length / 60000
      );
    }

    const itemsCompletedToday = todayItems.length;

    // Busiest hour today
    const todayOrders = await db.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
      },
      select: { createdAt: true },
    });

    const hourCounts: Record<number, number> = {};
    for (const o of todayOrders) {
      const h = o.createdAt.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }

    let busiestHour: number | null = null;
    let busiestHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > busiestHourCount) {
        busiestHourCount = count;
        busiestHour = parseInt(hour);
      }
    }

    // Orders by hour for chart
    const ordersByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, "0")}:00`,
      count: hourCounts[i] || 0,
    }));

    return success({
      ordersInQueue,
      ordersPreparing,
      ordersReady,
      ordersCompletedToday,
      avgPrepTime,
      itemsCompletedToday,
      busiestHour,
      busiestHourCount,
      ordersByHour,
    });
  } catch (err) {
    console.error("[KITCHEN STATS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
