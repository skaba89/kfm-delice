"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { SkeletonStatCard } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";

/* ──────────────── Types ──────────────── */
interface EarningsData {
  totalEarnings: number;
  totalDeliveries: number;
  todayEarnings: number;
  todayDeliveries: number;
  thisWeekEarnings: number;
  thisWeekDeliveries: number;
  thisMonthEarnings: number;
  thisMonthDeliveries: number;
  dailyBreakdown: { date: string; earnings: number; count: number }[];
  recentDeliveries: {
    id: string;
    orderNumber: string;
    customerName: string;
    earning: number;
    deliveredAt: string | null;
  }[];
}

/* ──────────────── Component ──────────────── */
export function EarningsView() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/driver/earnings", {
          headers: authHeaders(),
        });
        const result = await res.json();
        if (cancelled) return;
        if (result.success) setData(result.data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Donnees indisponibles"
        description="Impossible de charger les donnees de revenus. Reessayez plus tard."
      />
    );
  }

  const maxDailyEarning = Math.max(
    ...data.dailyBreakdown.map((d) => d.earnings),
    1
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenus totaux"
          value={formatCurrency(data.totalEarnings)}
          icon={DollarSign}
          change={`${data.totalDeliveries} livraisons`}
        />
        <StatCard
          label="Aujourd'hui"
          value={formatCurrency(data.todayEarnings)}
          icon={Clock}
          change={`${data.todayDeliveries} livraison(s)`}
        />
        <StatCard
          label="Cette semaine"
          value={formatCurrency(data.thisWeekEarnings)}
          icon={Calendar}
          change={`${data.thisWeekDeliveries} livraison(s)`}
        />
        <StatCard
          label="Ce mois"
          value={formatCurrency(data.thisMonthEarnings)}
          icon={TrendingUp}
          change={`${data.thisMonthDeliveries} livraison(s)`}
        />
      </div>

      {/* Daily bar chart */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-5">
          <h3 className="mb-4 text-base font-semibold text-text">
            Revenus des 7 derniers jours
          </h3>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: "180px" }}>
            {data.dailyBreakdown.map((day, idx) => {
              const heightPercent = Math.max((day.earnings / maxDailyEarning) * 100, 4);
              const isToday = idx === data.dailyBreakdown.length - 1;
              return (
                <div
                  key={idx}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <span className="text-xs font-medium text-text-2">
                    {day.earnings > 0 ? formatCurrency(day.earnings) : ""}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isToday
                          ? "bg-kfm-secondary"
                          : day.earnings > 0
                          ? "bg-kfm-secondary/60"
                          : "bg-kfm-border"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs ${
                      isToday ? "font-bold text-text" : "text-text-3"
                    }`}
                  >
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent deliveries with earnings */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-5">
          <h3 className="mb-4 text-base font-semibold text-text">
            Livraisons recentes
          </h3>
          {data.recentDeliveries.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="Aucun revenu"
              description="Vos revenus apparaitront ici apres vos premieres livraisons."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.recentDeliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-kfm-sm border border-kfm-border p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-text">
                      {d.orderNumber}
                    </p>
                    <p className="text-xs text-text-3">
                      {d.customerName}
                      {d.deliveredAt && ` · ${formatDateTime(d.deliveredAt)}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-kfm-success">
                    + {formatCurrency(d.earning)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
