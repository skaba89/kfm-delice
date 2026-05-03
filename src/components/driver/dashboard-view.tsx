"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  DollarSign,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Power,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authHeaders } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { SkeletonStatCard } from "@/components/kfm-ui/skeletons";
import { StatusBadge } from "@/components/kfm-ui/status-badge";

/* ──────────────── Types ──────────────── */
interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  isAvailable: boolean;
}

interface DeliveryItem {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  deliveryFee: number;
  driverEarning: number;
  estimatedTime: number | null;
  assignedAt: string | null;
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
  } | null;
}

const deliveryStatusMap: Record<string, string> = {
  DRIVER_ASSIGNED: "Assignee",
  DRIVER_ARRIVED_PICKUP: "Au restaurant",
  PICKED_UP: "En cours",
  DRIVER_ARRIVED_DROPOFF: "Arrive au client",
  DELIVERED: "Livre",
};

const deliveryStatusColorMap: Record<string, string> = {
  DRIVER_ASSIGNED: "bg-kfm-info/10 text-kfm-info border-kfm-info/20",
  DRIVER_ARRIVED_PICKUP: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
  PICKED_UP: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20",
  DRIVER_ARRIVED_DROPOFF: "bg-kfm-accent/10 text-kfm-accent border-kfm-accent/20",
  DELIVERED: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
};

function getNextAction(status: string): { label: string; nextStatus: string } | null {
  const map: Record<string, { label: string; nextStatus: string }> = {
    DRIVER_ASSIGNED: { label: "Arrive au restaurant", nextStatus: "DRIVER_ARRIVED_PICKUP" },
    DRIVER_ARRIVED_PICKUP: { label: "Confirmer la prise", nextStatus: "PICKED_UP" },
    PICKED_UP: { label: "Arrive au client", nextStatus: "DRIVER_ARRIVED_DROPOFF" },
    DRIVER_ARRIVED_DROPOFF: { label: "Confirmer la livraison", nextStatus: "DELIVERED" },
  };
  return map[status] || null;
}

/* ──────────────── Component ──────────────── */
export function DashboardView() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [profileRes, deliveriesRes] = await Promise.all([
          fetch("/api/driver/profile", { headers: authHeaders() }),
          fetch("/api/driver/deliveries?status=active", { headers: authHeaders() }),
        ]);
        const profileData = await profileRes.json();
        const deliveriesData = await deliveriesRes.json();
        if (cancelled) return;
        if (profileData.success) setProfile(profileData.data);
        if (deliveriesData.success) setDeliveries(deliveriesData.data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // Auto-refresh active deliveries every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/driver/deliveries?status=active", {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (json.success) {
          setDeliveries(json.data || []);
        }
      } catch {
        // Silent
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [profileRes, deliveriesRes] = await Promise.all([
        fetch("/api/driver/profile", { headers: authHeaders() }),
        fetch("/api/driver/deliveries?status=active", { headers: authHeaders() }),
      ]);
      const profileData = await profileRes.json();
      const deliveriesData = await deliveriesRes.json();
      if (profileData.success) setProfile(profileData.data);
      if (deliveriesData.success) setDeliveries(deliveriesData.data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (deliveryId: string, nextStatus: string) => {
    setUpdatingId(deliveryId);
    try {
      const res = await fetch(`/api/driver/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const newAvailability = !profile.isAvailable;
      const res = await fetch("/api/driver/availability", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isAvailable: newAvailability }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Silently fail
    }
  };

  const todayDelivered = deliveries.filter((d) => d.status === "DELIVERED").length;
  const activeDeliveries = deliveries.filter((d) => d.status !== "DELIVERED").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-kfm-border bg-surface">
              <CardContent className="p-4">
                <div className="kfm-skeleton h-5 w-3/4" />
                <div className="kfm-skeleton mt-3 h-4 w-1/2" />
                <div className="kfm-skeleton mt-3 h-10 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Livraisons en cours"
          value={String(activeDeliveries)}
          icon={Truck}
          change={activeDeliveries > 0 ? `${activeDeliveries} commande(s)` : undefined}
        />
        <StatCard
          label="Livrees aujourd'hui"
          value={String(todayDelivered)}
          icon={CheckCircle2}
          change={todayDelivered > 0 ? "Aujourd'hui" : undefined}
        />
        <StatCard
          label="Revenus du jour"
          value={profile ? formatCurrency(profile.totalEarnings) : "0 FG"}
          icon={DollarSign}
        />
        <StatCard
          label="Note moyenne"
          value={profile ? `${profile.rating.toFixed(1)} / 5` : "—"}
          icon={Star}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleToggleAvailability}
          variant={profile?.isAvailable ? "outline" : "default"}
          className={
            profile?.isAvailable
              ? "border-kfm-danger text-kfm-danger hover:bg-kfm-danger/10"
              : "bg-kfm-success hover:bg-kfm-success/90 text-white"
          }
        >
          <Power className="mr-2 h-4 w-4" />
          {profile?.isAvailable ? "Se mettre hors ligne" : "Se mettre en ligne"}
        </Button>
        <Link href="/driver/deliveries">
          <Button variant="outline" className="border-kfm-border text-text hover:bg-surface-2">
            <Package className="mr-2 h-4 w-4" />
            Voir toutes les livraisons
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Active deliveries */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">
          Livraisons actives
        </h2>
        {deliveries.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Aucune livraison active"
            description={
              profile?.isAvailable
                ? "Vous etes en ligne. De nouvelles livraisons vous seront assignees automatiquement."
                : "Mettez-vous en ligne pour recevoir des livraisons."
            }
          />
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => {
              const nextAction = getNextAction(d.status);
              return (
                <Card
                  key={d.id}
                  className="border-kfm-border bg-surface transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-text">
                            {d.order?.orderNumber || "N/A"}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              deliveryStatusColorMap[d.status] ||
                              "bg-kfm-surface-2 text-text-2 border-kfm-border"
                            }`}
                          >
                            {deliveryStatusMap[d.status] || d.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-2">
                          Client :{" "}
                          <span className="font-medium text-text">
                            {d.order?.customerName || "N/A"}
                          </span>
                        </p>
                        <div className="flex flex-col gap-1 text-sm text-text-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-kfm-success" />
                            <span>Recup : {d.pickupAddress}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-kfm-danger" />
                            <span>Livraison : {d.dropoffAddress}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-3">
                          {d.estimatedTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ~{d.estimatedTime} min
                            </span>
                          )}
                          <span className="text-kfm-success font-medium">
                            + {formatCurrency(d.driverEarning)}
                          </span>
                        </div>
                      </div>
                      {nextAction && (
                        <Button
                          size="sm"
                          className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white flex-shrink-0"
                          disabled={updatingId === d.id}
                          onClick={() =>
                            handleStatusUpdate(d.id, nextAction.nextStatus)
                          }
                        >
                          {updatingId === d.id ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            nextAction.label
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
