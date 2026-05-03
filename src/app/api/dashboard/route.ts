import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/dashboard — Aggregated stats
// ============================================
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ─── Today's stats ──────────────────────
    const todayOrders = await db.order.count({
      where: { createdAt: { gte: todayStart } },
    });

    const completedToday = await db.order.findMany({
      where: {
        createdAt: { gte: todayStart },
        status: "COMPLETED",
      },
      select: { total: true },
    });

    const todayRevenue = completedToday.reduce((sum, o) => sum + o.total, 0);

    // Also compute all-time revenue for avg ticket
    const allCompleted = await db.order.findMany({
      where: { status: "COMPLETED" },
      select: { total: true },
    });
    const allRevenue = allCompleted.reduce((sum, o) => sum + o.total, 0);
    const allOrders = await db.order.count();
    const avgTicket = allOrders > 0 ? Math.round(allRevenue / allOrders) : 0;

    // ─── Delivery rate ──────────────────────
    const totalOrders = await db.order.count();
    const deliveryOrders = await db.order.count({
      where: { orderType: "DELIVERY" },
    });
    const deliveryRate = totalOrders > 0 ? Math.round((deliveryOrders / totalOrders) * 100) : 0;

    // ─── Active customers (ordered in last 30 days) ──
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeCustomers = await db.order.groupBy({
      by: ["customerPhone"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        customerPhone: { not: "" },
      },
    });

    // ─── Today's reservations ───────────────
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const todayReservations = await db.reservation.count({
      where: {
        date: { gte: todayStart, lt: tomorrowStart },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    // ─── Weekly revenue (last 7 days) ───────
    const weeklyRevenue: Array<{ day: string; revenue: number; orders: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayCompleted = await db.order.findMany({
        where: {
          createdAt: { gte: d, lt: nextD },
          status: "COMPLETED",
        },
        select: { total: true },
      });

      const dayOrders = await db.order.count({
        where: { createdAt: { gte: d, lt: nextD } },
      });

      const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
      weeklyRevenue.push({
        day: dayLabel,
        revenue: dayCompleted.reduce((s, o) => s + o.total, 0),
        orders: dayOrders,
      });
    }

    // ─── Orders by status ───────────────────
    const ordersByStatusRaw = await db.order.groupBy({
      by: ["status"],
      _count: true,
    });

    const ordersByStatus: Record<string, number> = {};
    for (const row of ordersByStatusRaw) {
      ordersByStatus[row.status] = row._count;
    }

    // ─── Recent orders ──────────────────────
    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payments: {
          take: 1,
        },
      },
    });

    // ─── Low stock ingredients ──────────────
    const allIngredients = await db.ingredient.findMany();
    const lowStock = allIngredients.filter(
      (ing) => ing.quantity <= ing.lowStockThreshold
    );

    // ─── Active drivers ─────────────────────
    const activeDrivers = await db.driver.findMany({
      where: {
        isActive: true,
        status: { not: "offline" },
      },
      include: {
        deliveries: {
          where: {
            status: { in: ["PICKED_UP", "DRIVER_ARRIVED_DROPOFF"] },
          },
        },
      },
    });

    return success({
      todayOrders,
      todayRevenue,
      allRevenue,
      avgTicket,
      deliveryRate,
      activeCustomers: activeCustomers.length,
      todayReservations,
      weeklyRevenue,
      ordersByStatus,
      recentOrders,
      lowStockIngredients: lowStock,
      activeDrivers: activeDrivers.map((d) => ({
        ...d,
        activeDeliveryCount: d.deliveries.length,
        deliveries: undefined,
      })),
    });
  } catch (err) {
    console.error("[DASHBOARD GET]", err);
    return error("Internal server error", 500);
  }
}
