"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authHeaders } from "@/lib/constants";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/kfm-ui/empty-state";

/* ──────────────── Types ──────────────── */
interface DeliveryItem {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  deliveryFee: number;
  driverEarning: number;
  tip: number;
  estimatedTime: number | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    items: { itemName: string; quantity: number }[];
  } | null;
}

const deliveryStatusLabels: Record<string, string> = {
  DRIVER_ASSIGNED: "Assignee",
  DRIVER_ARRIVED_PICKUP: "Au restaurant",
  PICKED_UP: "En cours de livraison",
  DRIVER_ARRIVED_DROPOFF: "Arrive au client",
  DELIVERED: "Livre",
  FAILED: "Echouee",
  CANCELLED: "Annulee",
  RETURNED: "Retournee",
};

const deliveryStatusColors: Record<string, string> = {
  DRIVER_ASSIGNED: "bg-kfm-info/10 text-kfm-info border-kfm-info/20",
  DRIVER_ARRIVED_PICKUP: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
  PICKED_UP: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20",
  DRIVER_ARRIVED_DROPOFF: "bg-kfm-accent/10 text-kfm-accent border-kfm-accent/20",
  DELIVERED: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  FAILED: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20",
  CANCELLED: "bg-kfm-text-3/10 text-kfm-text-3 border-kfm-text-3/20",
  RETURNED: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
};

const statusSteps = [
  "DRIVER_ASSIGNED",
  "DRIVER_ARRIVED_PICKUP",
  "PICKED_UP",
  "DRIVER_ARRIVED_DROPOFF",
  "DELIVERED",
];

function getNextAction(status: string): { label: string; nextStatus: string } | null {
  const map: Record<string, { label: string; nextStatus: string }> = {
    DRIVER_ASSIGNED: { label: "Arrive au restaurant", nextStatus: "DRIVER_ARRIVED_PICKUP" },
    DRIVER_ARRIVED_PICKUP: { label: "Confirmer la prise", nextStatus: "PICKED_UP" },
    PICKED_UP: { label: "Arrive au client", nextStatus: "DRIVER_ARRIVED_DROPOFF" },
    DRIVER_ARRIVED_DROPOFF: { label: "Confirmer la livraison", nextStatus: "DELIVERED" },
  };
  return map[status] || null;
}

function StatusProgress({ status }: { status: string }) {
  const currentIndex = statusSteps.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, idx) => (
        <div key={step} className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${
              idx <= currentIndex ? "bg-kfm-secondary" : "bg-kfm-border"
            }`}
          />
          {idx < statusSteps.length - 1 && (
            <div
              className={`h-0.5 w-4 sm:w-6 ${
                idx < currentIndex ? "bg-kfm-secondary" : "bg-kfm-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────── Component ──────────────── */
export function DeliveriesView() {
  const [activeTab, setActiveTab] = useState("active");
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/driver/deliveries?status=${activeTab}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setDeliveries(data.data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  async function refetchDeliveries(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/driver/deliveries?status=${status}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setDeliveries(data.data);
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
        await refetchDeliveries(activeTab);
      }
    } catch {
      // Silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredDeliveries = deliveries;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-2 border border-kfm-border">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-kfm-secondary data-[state=active]:text-white"
          >
            En cours
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-kfm-success data-[state=active]:text-white"
          >
            Terminees
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-kfm-secondary data-[state=active]:text-white"
          >
            Toutes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading */}
      {loading ? (
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
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={
            activeTab === "active"
              ? "Aucune livraison en cours"
              : activeTab === "completed"
              ? "Aucune livraison terminee"
              : "Aucune livraison"
          }
          description={
            activeTab === "active"
              ? "Vous n'avez aucune livraison active pour le moment."
              : "Les livraisons completees apparaitront ici."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredDeliveries.map((d) => {
            const nextAction = getNextAction(d.status);
            const isActive =
              d.status !== "DELIVERED" &&
              d.status !== "FAILED" &&
              d.status !== "CANCELLED" &&
              d.status !== "RETURNED";

            return (
              <Card
                key={d.id}
                className="border-kfm-border bg-surface transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2.5">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text">
                          {d.order?.orderNumber || "N/A"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            deliveryStatusColors[d.status] ||
                            "bg-kfm-surface-2 text-text-2 border-kfm-border"
                          }`}
                        >
                          {deliveryStatusLabels[d.status] || d.status}
                        </span>
                      </div>

                      {/* Status progress for active */}
                      {isActive && <StatusProgress status={d.status} />}

                      {/* Client & order info */}
                      <div className="space-y-1 text-sm">
                        <p className="text-text-2">
                          Client :{" "}
                          <span className="font-medium text-text">
                            {d.order?.customerName || "N/A"}
                          </span>
                          {d.order?.customerPhone && (
                            <span className="text-text-3 ml-2">
                              {d.order.customerPhone}
                            </span>
                          )}
                        </p>
                        <p className="text-text-3">
                          Commande : {formatCurrency(d.order?.total || 0)}
                        </p>
                        {d.order?.items && d.order.items.length > 0 && (
                          <p className="text-xs text-text-3">
                            {d.order.items
                              .map((it) => `${it.quantity}x ${it.itemName}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      {/* Addresses */}
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

                      {/* Footer info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-text-3">
                        {d.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{d.estimatedTime} min
                          </span>
                        )}
                        <span className="text-kfm-success font-medium">
                          + {formatCurrency(d.driverEarning)}
                          {d.tip > 0 && ` + ${formatCurrency(d.tip)} pourboire`}
                        </span>
                        {d.deliveredAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-kfm-success" />
                            {formatRelativeTime(d.deliveredAt)}
                          </span>
                        )}
                        {d.assignedAt && !d.deliveredAt && (
                          <span>Assignee {formatRelativeTime(d.assignedAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0 sm:ml-3">
                      {nextAction ? (
                        <Button
                          size="sm"
                          className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
                          disabled={updatingId === d.id}
                          onClick={() =>
                            handleStatusUpdate(d.id, nextAction.nextStatus)
                          }
                        >
                          {updatingId === d.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="mr-1 h-4 w-4" />
                          )}
                          {nextAction.label}
                        </Button>
                      ) : d.status === "DELIVERED" ? (
                        <div className="flex items-center gap-1 text-kfm-success text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Livree
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
