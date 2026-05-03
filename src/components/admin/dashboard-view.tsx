"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, ShoppingCart, DollarSign, Users, TrendingUp, ArrowUpRight,
  ArrowDownRight, Clock, RefreshCcw, AlertCircle, Package, Truck, UserCheck,
  ChefHat, BarChart3, CalendarCheck,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime, formatRelativeTime, formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { DashboardKPISkeleton, TableSkeleton } from "@/components/ui/loading-patterns";
import { StatusBadge } from "@/components/kfm-ui/status-badge";
import {
  mapOrderStatusFromDB,
  mapPaymentStatusFromDB,
  orderStatusStyles,
  orderStatusLabels,
} from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  allRevenue: number;
  avgTicket: number;
  deliveryRate: number;
  activeCustomers: number;
  todayReservations: number;
  weeklyRevenue: Array<{ day: string; revenue: number; orders: number }>;
  ordersByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    total: number;
    orderType: string;
    createdAt: string;
    items: Array<{ id: string; itemName: string; quantity: number }>;
  }>;
  lowStockIngredients: Array<{ id: string; name: string; quantity: number; lowStockThreshold: number }>;
  activeDrivers: Array<{ id: string; firstName: string; lastName: string; status: string; activeDeliveryCount: number }>;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
}

// ── Chart tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-2">{label}</p>
      <p className="text-sm font-bold text-kfm-secondary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminDashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsRes = await fetch("/api/dashboard", { headers: authHeaders() }).then((r) => r.json());

      if (statsRes.status === "fulfilled" && (statsRes as { value?: { success?: boolean } }).value?.success) {
        setStats((statsRes as unknown as { value: { data: DashboardStats } }).value.data);
      } else if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch {
      setError("Erreur de chargement du dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Dashboard Admin</h2>
          <p className="mt-1 text-sm text-text-2">Vue globale de la plateforme KFM</p>
        </div>
        {/* KPI cards */}
        <DashboardKPISkeleton count={4} />
        {/* Charts + tables placeholder */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TableSkeleton columns={4} rows={5} />
          <TableSkeleton columns={3} rows={5} />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Dashboard Admin</h2>
            <p className="mt-1 text-sm text-text-2">Vue globale de la plateforme KFM</p>
          </div>
          <button onClick={fetchDashboard} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <RefreshCcw className="h-4 w-4" /> Reessayer
          </button>
        </div>
        <div className="rounded-kfm-md border border-kfm-danger/30 bg-kfm-danger/5 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-kfm-danger" />
          <p className="mt-3 text-sm font-medium text-kfm-danger">{error}</p>
        </div>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Dashboard Admin</h2>
          <p className="mt-1 text-sm text-text-2">Vue globale de la plateforme KFM</p>
        </div>
        <button onClick={fetchDashboard} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} /> Rafraichir
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires du jour"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={DollarSign}
          className="border-l-4 border-l-kfm-success"
        />
        <StatCard
          label="Commandes aujourd'hui"
          value={formatNumber(stats?.todayOrders || 0)}
          icon={ShoppingCart}
          className="border-l-4 border-l-kfm-secondary"
        />
        <StatCard
          label="Clients actifs"
          value={formatNumber(stats?.activeCustomers || 0)}
          icon={Users}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Taux de livraison"
          value={`${stats?.deliveryRate || 0}%`}
          icon={Truck}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      {/* ── Secondary Stats ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-kfm-sm bg-kfm-success/10">
              <TrendingUp className="h-5 w-5 text-kfm-success" />
            </div>
            <div>
              <p className="text-xs text-text-3">Revenu total</p>
              <p className="text-lg font-bold text-text">{formatCurrency(stats?.allRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-kfm-sm bg-kfm-warning/10">
              <BarChart3 className="h-5 w-5 text-kfm-warning" />
            </div>
            <div>
              <p className="text-xs text-text-3">Panier moyen</p>
              <p className="text-lg font-bold text-text">{formatCurrency(stats?.avgTicket || 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-kfm-sm bg-kfm-info/10">
              <CalendarCheck className="h-5 w-5 text-kfm-info" />
            </div>
            <div>
              <p className="text-xs text-text-3">Reservations aujourd&apos;hui</p>
              <p className="text-lg font-bold text-text">{stats?.todayReservations || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
              <ChefHat className="h-5 w-5 text-kfm-secondary" />
            </div>
            <div>
              <p className="text-xs text-text-3">Livreurs actifs</p>
              <p className="text-lg font-bold text-text">{stats?.activeDrivers?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Revenue Chart ───────────────────────────────────────────────────── */}
      <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-kfm-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text">Chiffre d&apos;affaires — 7 derniers jours</h3>
          <span className="rounded-full bg-kfm-success/10 px-2.5 py-0.5 text-xs font-semibold text-kfm-success">
            {formatCurrency((stats?.weeklyRevenue || []).reduce((s, d) => s + d.revenue, 0))}
          </span>
        </div>
        <div className="p-4 h-64">
          {stats?.weeklyRevenue && stats.weeklyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--kfm-border, #e5e5e5)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--kfm-text-3, #888)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--kfm-text-3, #888)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--kfm-surface-2, #f5f5f5)" }} />
                <Bar
                  dataKey="revenue"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {stats.weeklyRevenue.map((entry, index) => {
                    const maxRev = Math.max(...stats.weeklyRevenue.map((d) => d.revenue));
                    const isMax = entry.revenue === maxRev;
                    return (
                      <Cell
                        key={`bar-${index}`}
                        fill={isMax ? "var(--kfm-secondary, #f97316)" : "var(--kfm-secondary-light, #fed7aa)"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-3">Aucune donnee disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-kfm-border px-5 py-3">
            <h3 className="text-sm font-semibold text-text">Commandes recentes</h3>
            <span className="rounded-full bg-kfm-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-kfm-secondary">
              {(stats?.recentOrders?.length || 0)} dernieres
            </span>
          </div>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="divide-y divide-kfm-border max-h-96 overflow-y-auto">
              {stats.recentOrders.slice(0, 10).map((order) => {
                const status = mapOrderStatusFromDB(order.status);
                return (
                  <div key={order.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/40 transition-colors">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary">
                      {order.customerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{order.customerName}</p>
                      <p className="text-xs text-text-3 truncate">
                        {order.orderNumber} · {order.items?.map((i) => i.itemName).join(", ") || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text">{formatCurrency(order.total)}</p>
                      <div className="mt-0.5">
                        <StatusBadge type="order" status={status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <ShoppingCart className="mx-auto h-8 w-8 text-text-3" />
              <p className="mt-2 text-sm text-text-3">Aucune commande pour le moment</p>
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-kfm-border px-5 py-3">
            <h3 className="text-sm font-semibold text-text">Commandes par statut</h3>
          </div>
          {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
            <div className="p-5 space-y-3">
              {Object.entries(stats.ordersByStatus)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const uiStatus = mapOrderStatusFromDB(status);
                  const label = orderStatusLabels[uiStatus] || status;
                  const style = orderStatusStyles[uiStatus] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
                  const maxCount = Math.max(...Object.values(stats.ordersByStatus));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", style)}>
                          {label}
                        </span>
                        <span className="text-sm font-bold text-text">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            status === "COMPLETED" ? "bg-kfm-success" :
                            status === "PENDING" ? "bg-kfm-warning" :
                            status === "CANCELLED" ? "bg-kfm-danger" :
                            status === "PREPARING" ? "bg-kfm-secondary" :
                            "bg-blue-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-text-3" />
              <p className="mt-2 text-sm text-text-3">Aucune donnee disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-kfm-border px-5 py-3">
            <h3 className="text-sm font-semibold text-text">Alertes de stock</h3>
            <AlertCircle className={cn("h-4 w-4", stats?.lowStockIngredients && stats.lowStockIngredients.length > 0 ? "text-kfm-danger" : "text-kfm-success")} />
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {stats?.lowStockIngredients && stats.lowStockIngredients.length > 0 ? (
              stats.lowStockIngredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-start gap-2.5 rounded-kfm-sm border border-kfm-danger/20 bg-kfm-danger/5 p-3">
                  <Package className="h-4 w-4 mt-0.5 flex-shrink-0 text-kfm-danger" />
                  <div>
                    <p className="text-xs font-medium text-text">{ingredient.name}</p>
                    <p className="text-[10px] text-text-3">
                      Stock: {ingredient.quantity} (seuil: {ingredient.lowStockThreshold})
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kfm-success/10">
                  <UserCheck className="h-5 w-5 text-kfm-success" />
                </div>
                <p className="mt-2 text-sm font-medium text-kfm-success">Stock OK</p>
                <p className="text-xs text-text-3">Aucune alerte de stock</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Drivers + Reservations */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-kfm-border px-5 py-3">
            <h3 className="text-sm font-semibold text-text">Activite en direct</h3>
            <Clock className="h-4 w-4 text-text-3" />
          </div>
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {/* Today's Reservations */}
            <div className="rounded-kfm-sm border border-kfm-info/20 bg-kfm-info/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="h-4 w-4 text-kfm-info" />
                <p className="text-xs font-semibold text-text">{stats?.todayReservations || 0} reservation{(stats?.todayReservations || 0) !== 1 ? "s" : ""} aujourd&apos;hui</p>
              </div>
              {(stats?.todayReservations || 0) > 0 ? (
                <p className="text-[10px] text-text-3">Consultez la page reservations pour les details</p>
              ) : (
                <p className="text-[10px] text-text-3">Aucune reservation prevue pour aujourd&apos;hui</p>
              )}
            </div>

            {/* Active drivers */}
            {stats?.activeDrivers && stats.activeDrivers.length > 0 ? (
              <div className="rounded-kfm-sm border border-kfm-secondary/20 bg-kfm-secondary/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-kfm-secondary" />
                  <p className="text-xs font-semibold text-text">{stats.activeDrivers.length} livreurs actifs</p>
                </div>
                <div className="space-y-1.5">
                  {stats.activeDrivers.slice(0, 5).map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kfm-secondary/10 text-[10px] font-bold text-kfm-secondary">
                          {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                        </div>
                        <span className="text-xs text-text-2">{driver.firstName} {driver.lastName}</span>
                      </div>
                      <span className="text-[10px] text-text-3">{driver.activeDeliveryCount} livraison{driver.activeDeliveryCount !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
                  <UserCheck className="h-5 w-5 text-text-3" />
                </div>
                <p className="mt-2 text-sm font-medium text-text">Aucune activite en direct</p>
                <p className="text-xs text-text-3">Aucun livreur actif pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
