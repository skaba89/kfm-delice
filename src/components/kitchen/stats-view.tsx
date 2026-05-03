"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Timer,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { authHeaders } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { SkeletonStatCard, SkeletonChart } from "@/components/kfm-ui/skeletons";

/* ──────────────── Types ──────────────── */
interface KitchenStats {
  ordersInQueue: number;
  ordersPreparing: number;
  ordersReady: number;
  ordersCompletedToday: number;
  avgPrepTime: number;
  itemsCompletedToday: number;
  busiestHour: number | null;
  busiestHourCount: number;
  ordersByHour: {
    hour: number;
    label: string;
    count: number;
  }[];
}

/* ──────────────── Component ──────────────── */
export function StatsView() {
  const [stats, setStats] = useState<KitchenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/kitchen/stats", {
          headers: authHeaders(),
        });
        const result = await res.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
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
        <SkeletonChart />
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Impossible de charger les statistiques"
        description="Une erreur est survenue lors du chargement des donnees. Reessayez plus tard."
      />
    );
  }

  const maxChartCount = Math.max(...stats.ordersByHour.map((h) => h.count), 1);

  const formatHour = (h: number | null): string => {
    if (h === null) return "—";
    return `${String(h).padStart(2, "0")}:00`;
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="En attente"
          value={String(stats.ordersInQueue)}
          icon={Clock}
          change="A confirmer"
          changeType="neutral"
        />
        <StatCard
          label="En preparation"
          value={String(stats.ordersPreparing)}
          icon={ChefHat}
          change="En cours"
          changeType="neutral"
        />
        <StatCard
          label="Prets"
          value={String(stats.ordersReady)}
          icon={CheckCircle2}
          change="A servir"
          changeType="neutral"
        />
        <StatCard
          label="Terminees aujourd'hui"
          value={String(stats.ordersCompletedToday)}
          icon={TrendingUp}
          change={`${stats.itemsCompletedToday} article(s)`}
          changeType="positive"
        />
      </div>

      {/* Second row: avg prep time + busiest hour */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-kfm-sm bg-kfm-secondary/10 p-2.5 text-kfm-secondary">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-2">
                  Temps de preparation moyen
                </p>
                <p className="mt-1 text-2xl font-bold text-text">
                  {stats.avgPrepTime > 0
                    ? `${formatNumber(stats.avgPrepTime)} min`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-text-3">
                  Base sur les articles termines aujourd&apos;hui
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-kfm-sm bg-kfm-danger/10 p-2.5 text-kfm-danger">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-2">
                  Heure la plus chargee
                </p>
                <p className="mt-1 text-2xl font-bold text-text">
                  {formatHour(stats.busiestHour)}
                </p>
                {stats.busiestHourCount > 0 && (
                  <p className="mt-1 text-xs text-text-3">
                    {formatNumber(stats.busiestHourCount)} commande(s) traitees
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by hour chart */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-text">
            Commandes par heure aujourd&apos;hui
          </h3>
          <div className="flex items-end gap-1.5 h-48">
            {stats.ordersByHour
              .filter((h) => h.count > 0 || (h.hour >= 8 && h.hour <= 23))
              .map((hourData) => {
                const heightPercent =
                  maxChartCount > 0
                    ? (hourData.count / maxChartCount) * 100
                    : 0;
                return (
                  <div
                    key={hourData.hour}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    {hourData.count > 0 && (
                      <span className="text-[10px] font-medium text-text-2">
                        {hourData.count}
                      </span>
                    )}
                    <div
                      className="w-full rounded-t-sm bg-kfm-accent/80 transition-all duration-500 min-h-[4px]"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                    <span className="text-[9px] text-text-3 mt-auto">
                      {hourData.label.slice(0, 2)}
                    </span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
