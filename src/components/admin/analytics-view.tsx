"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, ShoppingCart, DollarSign, Users, RefreshCcw, AlertCircle,
  CalendarDays, BarChart3, Flame, CheckCircle2, UtensilsCrossed, Clock,
  Download, ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { SkeletonStatCard, SkeletonChart } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { KPICard, KPIRow } from "@/components/charts/kpi-cards";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { OrdersPieChart } from "@/components/charts/orders-pie-chart";
import { TopItemsChart } from "@/components/charts/top-items-chart";
import { PeakHoursChart } from "@/components/charts/peak-hours-chart";

// ── Types ──────────────────────────────────────────────────────────────────

interface AnalyticsData {
  period: string;
  startDate: string;
  kpis: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    completionRate: number;
    uniqueCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    avgPrepTime: number;
  };
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  ordersByType: Record<string, number>;
  peakHours: Array<{ hour: string; hourNum: number; orders: number }>;
  paymentMethods: Record<string, number>;
  reservationStats: {
    total: number;
    confirmed: number;
    cancelled: number;
    noShow: number;
    totalGuests: number;
    avgPartySize: number;
  };
}

type Period = "today" | "7d" | "30d" | "90d" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 jours" },
  { key: "all", label: "Tout" },
];

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Especes",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte",
  WALLET: "Portefeuille",
  BANK_TRANSFER: "Virement",
  GIFT_CARD: "Carte cadeau",
};

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#22c55e",
  MOBILE_MONEY: "#F97316",
  CARD: "#3b82f6",
  WALLET: "#8b5cf6",
  BANK_TRANSFER: "#06b6d4",
  GIFT_CARD: "#ec4899",
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminAnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/analytics?period=${period}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type: string) => {
    try {
      const res = await fetch(`/api/analytics/export?format=csv&period=${period}&type=${type}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Export echoue");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kfm_${type}_${period}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Export telecharge avec succes");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Analytique</h2>
          <p className="mt-1 text-sm text-text-2">Statistiques globales de la plateforme</p>
        </div>
        <KPIRow>
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </KPIRow>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonChart /><SkeletonChart />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Analytique</h2>
            <p className="mt-1 text-sm text-text-2">Statistiques globales</p>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
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

  if (!data) return null;

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Analytique</h2>
          <p className="mt-1 text-sm text-text-2">Statistiques globales de la plateforme</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex rounded-kfm-sm border border-kfm-border overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3 py-2 text-xs font-medium transition",
                  period === p.key
                    ? "bg-kfm-secondary text-white"
                    : "text-text-2 hover:bg-surface-2"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPIRow>
        <KPICard
          label="Revenu total"
          value={formatCurrency(data.kpis.totalRevenue)}
          icon={DollarSign}
          className="border-l-4 border-l-kfm-success"
        />
        <KPICard
          label="Commandes totales"
          value={formatNumber(data.kpis.totalOrders)}
          icon={ShoppingCart}
          className="border-l-4 border-l-kfm-secondary"
        />
        <KPICard
          label="Panier moyen"
          value={formatCurrency(data.kpis.avgOrderValue)}
          icon={TrendingUp}
          className="border-l-4 border-l-kfm-info"
        />
        <KPICard
          label="Taux de completion"
          value={`${data.kpis.completionRate}%`}
          icon={CheckCircle2}
          className="border-l-4 border-l-purple-500"
        />
      </KPIRow>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-3 shadow-sm">
          <p className="text-[10px] font-medium text-text-3 uppercase">Clients uniques</p>
          <p className="mt-1 text-lg font-bold text-text">{formatNumber(data.kpis.uniqueCustomers)}</p>
          <p className="text-[10px] text-text-3">
            {data.kpis.newCustomers} nouveaux · {data.kpis.returningCustomers} recurrents
          </p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-3 shadow-sm">
          <p className="text-[10px] font-medium text-text-3 uppercase">Temps prep. moyen</p>
          <p className="mt-1 text-lg font-bold text-text">{data.kpis.avgPrepTime} min</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-3 shadow-sm">
          <p className="text-[10px] font-medium text-text-3 uppercase">Reservations</p>
          <p className="mt-1 text-lg font-bold text-text">{data.reservationStats.total}</p>
          <p className="text-[10px] text-text-3">
            {data.reservationStats.totalGuests} convives · Moy. {data.reservationStats.avgPartySize} pers.
          </p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-3 shadow-sm">
          <p className="text-[10px] font-medium text-text-3 uppercase flex items-center gap-2">
            <Download className="h-3 w-3" /> Export
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <button onClick={() => handleExport("orders")} className="rounded bg-surface-2 px-2 py-1 text-[10px] font-medium text-text-2 hover:bg-kfm-border transition-colors">
              Commandes
            </button>
            <button onClick={() => handleExport("revenue")} className="rounded bg-surface-2 px-2 py-1 text-[10px] font-medium text-text-2 hover:bg-kfm-border transition-colors">
              Revenus
            </button>
            <button onClick={() => handleExport("reservations")} className="rounded bg-surface-2 px-2 py-1 text-[10px] font-medium text-text-2 hover:bg-kfm-border transition-colors">
              Reservations
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Revenue Trend + Orders by Type */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-kfm-secondary" /> Tendance du chiffre d&apos;affaires
          </h3>
          {data.revenueTrend.length > 0 ? (
            <RevenueChart data={data.revenueTrend} showOrders />
          ) : (
            <EmptyState icon={BarChart3} title="Aucune donnee" description="Aucun revenu pour cette periode" />
          )}
        </div>

        {/* Orders by Type - Pie Chart */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-kfm-secondary" /> Commandes par type
          </h3>
          {Object.keys(data.ordersByType).length > 0 ? (
            <OrdersPieChart data={data.ordersByType} />
          ) : (
            <EmptyState icon={ShoppingCart} title="Aucune donnee" description="Aucune commande pour cette periode" />
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Items + Peak Hours */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Items */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" /> Top articles les plus vendus
          </h3>
          {data.topItems.length > 0 ? (
            <TopItemsChart data={data.topItems.slice(0, 8)} />
          ) : (
            <EmptyState icon={UtensilsCrossed} title="Aucun article" description="Aucune vente d&apos;article enregistree" />
          )}
        </div>

        {/* Peak Hours */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-kfm-secondary" /> Heures de pointe
          </h3>
          {data.peakHours.length > 0 ? (
            <PeakHoursChart data={data.peakHours} />
          ) : (
            <EmptyState icon={BarChart3} title="Aucune donnee" description="Aucune commande pour cette periode" />
          )}
        </div>
      </div>

      {/* Charts Row 3: Payment Methods + Reservations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-kfm-success" /> Revenus par methode de paiement
          </h3>
          {Object.keys(data.paymentMethods).length > 0 ? (
            <OrdersPieChart
              data={Object.fromEntries(
                Object.entries(data.paymentMethods).map(([k, v]) => [k, Math.round(v)])
              )}
              colors={PAYMENT_COLORS}
              height={250}
            />
          ) : (
            <EmptyState icon={DollarSign} title="Aucun paiement" description="Aucun paiement enregistre pour cette periode" />
          )}
          {/* Payment labels legend */}
          {Object.keys(data.paymentMethods).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 border-t border-kfm-border pt-3">
              {Object.entries(data.paymentMethods).map(([method, amount]) => (
                <div key={method} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[method] || "#94a3b8" }} />
                  <span className="text-text-2">{PAYMENT_LABELS[method] || method}</span>
                  <span className="font-semibold text-text">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reservation Stats */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-kfm-info" /> Statistiques des reservations
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-kfm-sm bg-surface-2 p-3 text-center">
                <p className="text-lg font-bold text-text">{data.reservationStats.total}</p>
                <p className="text-[10px] text-text-3">Total</p>
              </div>
              <div className="rounded-kfm-sm bg-kfm-success/10 p-3 text-center">
                <p className="text-lg font-bold text-kfm-success">{data.reservationStats.confirmed}</p>
                <p className="text-[10px] text-text-3">Confirmees</p>
              </div>
              <div className="rounded-kfm-sm bg-kfm-danger/10 p-3 text-center">
                <p className="text-lg font-bold text-kfm-danger">{data.reservationStats.cancelled}</p>
                <p className="text-[10px] text-text-3">Annulees</p>
              </div>
              <div className="rounded-kfm-sm bg-kfm-text-3/10 p-3 text-center">
                <p className="text-lg font-bold text-text-3">{data.reservationStats.noShow}</p>
                <p className="text-[10px] text-text-3">Absents (No-show)</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-3">Total convives</span>
                <span className="font-semibold text-text">{formatNumber(data.reservationStats.totalGuests)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-3">Taille moyenne du groupe</span>
                <span className="font-semibold text-text">{data.reservationStats.avgPartySize} personnes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-3">Taux de confirmation</span>
                <span className="font-semibold text-text">
                  {data.reservationStats.total > 0
                    ? Math.round((data.reservationStats.confirmed / data.reservationStats.total) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
