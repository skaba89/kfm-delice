"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UtensilsCrossed,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authHeaders } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { SkeletonStatCard } from "@/components/kfm-ui/skeletons";
import { cn } from "@/lib/utils";

/* ──────────────── Types ──────────────── */
interface OrderItemData {
  id: string;
  itemName: string;
  quantity: number;
  status: string;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  tableNumber?: string | null;
  createdAt: string;
  items: OrderItemData[];
  notes?: string | null;
  total: number;
}

type TabValue = "active" | "ready" | "all";

const orderTypeLabels: Record<string, string> = {
  DINE_IN: "Sur place",
  TAKEAWAY: "A emporter",
  DELIVERY: "Livraison",
  DRIVE_THRU: "Drive",
};

const orderTypeIcons: Record<string, React.ReactNode> = {
  DINE_IN: <UtensilsCrossed className="h-3 w-3" />,
  TAKEAWAY: <ShoppingBag className="h-3 w-3" />,
  DELIVERY: <Truck className="h-3 w-3" />,
  DRIVE_THRU: <ShoppingBag className="h-3 w-3" />,
};

const itemStatusColors: Record<string, string> = {
  pending: "bg-gray-300 dark:bg-gray-600",
  preparing: "bg-kfm-info",
  ready: "bg-kfm-success",
  served: "bg-kfm-success/60",
  cancelled: "bg-kfm-danger",
};

const itemStatusLabels: Record<string, string> = {
  pending: "En attente",
  preparing: "En preparation",
  ready: "Pret",
  served: "Servi",
  cancelled: "Annule",
};

/* ──────────────── Audio Alert ──────────────── */
function playNewOrderAlert() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported
  }
}

/* ──────────────── Component ──────────────── */
export function OrdersView() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("active");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kitchen/orders?status=${activeTab}`, {
        headers: authHeaders(),
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const newOrders = result.data as OrderData[];
        const newOrderIds = new Set(newOrders.map((o) => o.id));

        // Detect new orders and play alert
        for (const id of newOrderIds) {
          if (!prevOrderIdsRef.current.has(id)) {
            playNewOrderAlert();
            break;
          }
        }

        prevOrderIdsRef.current = newOrderIds;
        setOrders(newOrders);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update clock every minute for relative time
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Update order status
  const handleOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch {
      // Silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  // Update item status
  const handleItemStatus = async (orderId: string, itemId: string, newStatus: string) => {
    setUpdatingId(`${orderId}-${itemId}`);
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch {
      // Silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  // Column definitions for kanban
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const preparingOrders = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "PREPARING"
  );
  const readyOrders = orders.filter((o) => o.status === "READY");

  const columns = [
    {
      key: "pending" as const,
      title: "A confirmer",
      icon: AlertCircle,
      color: "border-kfm-warning/30 bg-kfm-warning/5",
      headerColor: "text-kfm-warning",
      orders: pendingOrders,
    },
    {
      key: "preparing" as const,
      title: "En preparation",
      icon: Clock,
      color: "border-kfm-info/30 bg-kfm-info/5",
      headerColor: "text-kfm-info",
      orders: preparingOrders,
    },
    {
      key: "ready" as const,
      title: "Prets",
      icon: CheckCircle2,
      color: "border-kfm-success/30 bg-kfm-success/5",
      headerColor: "text-kfm-success",
      orders: readyOrders,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-kfm-border bg-surface">
              <CardContent className="p-4">
                <div className="kfm-skeleton h-6 w-32" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="rounded-kfm-sm border border-kfm-border p-3">
                      <div className="kfm-skeleton h-5 w-24" />
                      <div className="kfm-skeleton mt-2 h-4 w-16" />
                      <div className="kfm-skeleton mt-3 h-9 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs + refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {[
            { key: "active" as TabValue, label: "Actives" },
            { key: "ready" as TabValue, label: "Pretes" },
            { key: "all" as TabValue, label: "Toutes" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              className={
                activeTab === tab.key
                  ? "bg-kfm-accent text-white hover:bg-kfm-accent/90"
                  : "border-kfm-border text-text-2 hover:bg-surface-2"
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-kfm-border text-text-2 hover:bg-surface-2"
          onClick={fetchOrders}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Actualiser
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge
          variant="outline"
          className="border-kfm-warning/30 bg-kfm-warning/10 text-kfm-warning"
        >
          {pendingOrders.length} A confirmer
        </Badge>
        <Badge
          variant="outline"
          className="border-kfm-info/30 bg-kfm-info/10 text-kfm-info"
        >
          {preparingOrders.length} En preparation
        </Badge>
        <Badge
          variant="outline"
          className="border-kfm-success/30 bg-kfm-success/10 text-kfm-success"
        >
          {readyOrders.length} Prets
        </Badge>
      </div>

      {/* Kanban Board */}
      {orders.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Aucune commande active"
          description="Toutes les commandes ont ete traitees. Les nouvelles commandes apparaitront ici automatiquement."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:gap-5">
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "rounded-kfm-md border p-3",
                col.color
              )}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <col.icon className={cn("h-4 w-4", col.headerColor)} />
                <h2 className={cn("text-sm font-semibold", col.headerColor)}>
                  {col.title}
                </h2>
                <span className="ml-auto text-xs font-bold text-text-3 rounded-full bg-bg/60 px-2 py-0.5">
                  {col.orders.length}
                </span>
              </div>

              {/* Column cards */}
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {col.orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-text-3">
                    <CheckCircle2 className="h-6 w-6 mb-2 opacity-40" />
                    <p className="text-xs">Aucune commande</p>
                  </div>
                ) : (
                  col.orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      column={col.key}
                      updatingId={updatingId}
                      onOrderStatus={handleOrderStatus}
                      onItemStatus={handleItemStatus}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────── Urgency Badge ──────────────── */
function UrgencyBadge({ createdAt }: { createdAt: string }) {
  const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  const colorClass =
    minutes < 5 ? "text-kfm-success" : minutes < 10 ? "text-kfm-warning" : "text-kfm-danger";

  return (
    <span className={cn("text-[10px] font-semibold tabular-nums", colorClass)}>
      {minutes} min
    </span>
  );
}

/* ──────────────── Order Card ──────────────── */
function OrderCard({
  order,
  column,
  updatingId,
  onOrderStatus,
  onItemStatus,
}: {
  order: OrderData;
  column: "pending" | "preparing" | "ready";
  updatingId: string | null;
  onOrderStatus: (orderId: string, newStatus: string) => void;
  onItemStatus: (orderId: string, itemId: string, newStatus: string) => void;
}) {
  return (
    <Card className="border-kfm-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text">
              #{order.orderNumber.replace("CMD-", "")}
            </span>
            <UrgencyBadge createdAt={order.createdAt} />
          </div>
          <div className="flex items-center gap-1.5">
            {/* Order type badge */}
            <Badge
              variant="outline"
              className="gap-1 border-kfm-border text-text-2 text-[10px] px-1.5 py-0"
            >
              {orderTypeIcons[order.orderType]}
              {orderTypeLabels[order.orderType] || order.orderType}
            </Badge>
          </div>
        </div>

        {/* Customer + time */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text truncate">
            {order.customerName}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-3 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(order.createdAt)}
          </span>
        </div>

        {/* Table number (DINE_IN) */}
        {order.tableNumber && (
          <div className="flex items-center gap-1.5 text-xs text-text-2">
            <UtensilsCrossed className="h-3 w-3 text-kfm-accent" />
            Table {order.tableNumber}
          </div>
        )}

        {/* Items list */}
        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-kfm-sm bg-bg/50 px-2 py-1.5"
            >
              {/* Status dot */}
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full flex-shrink-0",
                  itemStatusColors[item.status] || "bg-gray-300"
                )}
                title={itemStatusLabels[item.status] || item.status}
              />
              <span className="flex-1 text-xs text-text truncate">
                <span className="font-medium">{item.quantity}x</span> {item.itemName}
              </span>
              {/* Item action for preparing column */}
              {column === "preparing" && item.status === "preparing" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-kfm-success hover:bg-kfm-success/10 hover:text-kfm-success"
                  disabled={updatingId === `${order.id}-${item.id}`}
                  onClick={() => onItemStatus(order.id, item.id, "ready")}
                >
                  {updatingId === `${order.id}-${item.id}` ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-kfm-success border-t-transparent" />
                  ) : (
                    "Pret"
                  )}
                </Button>
              )}
              {column === "preparing" && item.status === "ready" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-kfm-success/60"
                  disabled
                >
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <p className="text-[10px] text-text-3 italic truncate">
            {order.notes}
          </p>
        )}

        {/* Action button */}
        <div className="pt-1">
          {column === "pending" && (
            <Button
              size="sm"
              className="w-full bg-kfm-info hover:bg-kfm-info/90 text-white text-sm font-medium"
              disabled={updatingId === order.id}
              onClick={() => onOrderStatus(order.id, "CONFIRMED")}
            >
              {updatingId === order.id ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          )}
          {column === "preparing" && order.status === "CONFIRMED" && (
            <Button
              size="sm"
              className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white text-sm font-medium"
              disabled={updatingId === order.id}
              onClick={() => onOrderStatus(order.id, "PREPARING")}
            >
              {updatingId === order.id ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Commencer preparation
                </>
              )}
            </Button>
          )}
          {column === "ready" && order.orderType === "DINE_IN" && (
            <Button
              size="sm"
              className="w-full bg-kfm-success hover:bg-kfm-success/90 text-white text-sm font-medium"
              disabled={updatingId === order.id}
              onClick={() => {
                // Mark all items as served
                order.items.forEach((item) => {
                  if (item.status === "ready") {
                    onItemStatus(order.id, item.id, "served");
                  }
                });
              }}
            >
              {updatingId?.startsWith(order.id) ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marquer comme servi
                </>
              )}
            </Button>
          )}
          {column === "ready" && order.orderType !== "DINE_IN" && (
            <div className="text-center text-xs text-kfm-success font-medium">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
              Pret pour retrait / livraison
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
