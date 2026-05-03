import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/analytics?period=today|7d|30d|90d|all
// Returns comprehensive analytics data
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "7d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate = new Date(0);
    }

    // Fetch all orders within the period
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        items: true,
        payments: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── KPI Summary ──────────────────────────────────────────────────────────
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED");
    const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

    // Unique customers (by customerName)
    const customerSet = new Set(orders.map((o) => o.customerName));
    const uniqueCustomers = customerSet.size;

    // New vs returning (simple: first order = new)
    const customerOrderCounts = new Map<string, number>();
    orders.forEach((o) => {
      customerOrderCounts.set(o.customerName, (customerOrderCounts.get(o.customerName) || 0) + 1);
    });
    const newCustomers = Array.from(customerOrderCounts.values()).filter((c) => c === 1).length;
    const returningCustomers = uniqueCustomers - newCustomers;

    // Average preparation time (estimated from created → ready/completed)
    const preparedOrders = orders.filter(
      (o) => o.readyAt && o.createdAt && o.preparingAt
    );
    const avgPrepTime =
      preparedOrders.length > 0
        ? Math.round(
            preparedOrders.reduce(
              (s, o) =>
                s +
                ((o.readyAt?.getTime() || o.completedAt?.getTime() || 0) -
                  (o.preparingAt?.getTime() || o.createdAt.getTime())) /
                  60000,
              0
            ) / preparedOrders.length
          )
        : 0;

    // ── Revenue over time ─────────────────────────────────────────────────────
    const revenueByPeriod = new Map<string, number>();
    const orderCountByPeriod = new Map<string, number>();

    completedOrders.forEach((o) => {
      const key = period === "today"
        ? `${o.createdAt.getHours().toString().padStart(2, "0")}:00`
        : o.createdAt.toISOString().split("T")[0];
      revenueByPeriod.set(key, (revenueByPeriod.get(key) || 0) + o.total);
      orderCountByPeriod.set(key, (orderCountByPeriod.get(key) || 0) + 1);
    });

    const revenueTrend = Array.from(revenueByPeriod.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
        orders: orderCountByPeriod.get(date) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Top selling items ─────────────────────────────────────────────────────
    const itemMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    completedOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const existing = itemMap.get(item.itemName);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
        } else {
          itemMap.set(item.itemName, {
            name: item.itemName,
            quantity: item.quantity,
            revenue: item.totalPrice,
          });
        }
      });
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // ── Orders by type ────────────────────────────────────────────────────────
    const ordersByType: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByType[o.orderType] = (ordersByType[o.orderType] || 0) + 1;
    });

    // ── Orders by hour (peak hours heatmap) ──────────────────────────────────
    const ordersByHour = new Array(24).fill(0) as number[];
    orders.forEach((o) => {
      const hour = o.createdAt.getHours();
      ordersByHour[hour]++;
    });

    const peakHours = ordersByHour
      .map((count, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        hourNum: hour,
        orders: count,
      }))
      .filter((h) => h.orders > 0);

    // ── Payment method distribution ───────────────────────────────────────────
    const payments = await db.payment.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const paymentMethods: Record<string, number> = {};
    payments.forEach((p) => {
      paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount;
    });

    // ── Reservation statistics ────────────────────────────────────────────────
    const reservations = await db.reservation.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const reservationStats = {
      total: reservations.length,
      confirmed: reservations.filter((r) => r.status === "CONFIRMED" || r.status === "SEATED" || r.status === "COMPLETED").length,
      cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
      noShow: reservations.filter((r) => r.status === "NO_SHOW").length,
      totalGuests: reservations.reduce((s, r) => s + r.partySize, 0),
      avgPartySize:
        reservations.length > 0
          ? Math.round(
              (reservations.reduce((s, r) => s + r.partySize, 0) /
                reservations.length) *
                10
            ) / 10
          : 0,
    };

    return success({
      period,
      startDate: startDate.toISOString(),
      kpis: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        completionRate,
        uniqueCustomers,
        newCustomers,
        returningCustomers,
        avgPrepTime,
      },
      revenueTrend,
      topItems,
      ordersByType,
      peakHours,
      paymentMethods,
      reservationStats,
    });
  } catch (err) {
    console.error("[ANALYTICS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
