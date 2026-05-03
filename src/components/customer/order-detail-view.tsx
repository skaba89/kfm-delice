"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/auth-context";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/kfm-ui/status-badge";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/* ──────────────── Types ──────────────── */
interface OrderItemData {
  id: string;
  menuItemId: string | null;
  itemName: string;
  itemImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName: string | null;
  options: string | null;
  status: string;
}

interface StatusHistoryEntry {
  status: string;
  notes: string | null;
  changedBy: string | null;
  createdAt: string;
}

interface OrderDetailData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  deliveryFee: number;
  tip: number;
  total: number;
  currency: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryDistrict: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  tableNumber: string | null;
  loyaltyPointsEarned: number;
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  items: OrderItemData[];
  statusHistory: StatusHistoryEntry[];
}

/* ──────────────── Status mapping ──────────────── */
const statusMap: Record<string, string> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "delivering",
  DELIVERED: "completed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "cancelled",
};

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmee",
  PREPARING: "En preparation",
  READY: "Pret",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livre",
  COMPLETED: "Terminee",
  CANCELLED: "Annulee",
  REFUNDED: "Remboursee",
};

const orderTypeLabels: Record<string, string> = {
  DINE_IN: "Sur place",
  TAKEAWAY: "A emporter",
  DELIVERY: "Livraison",
  DRIVE_THRU: "Drive",
};

const statusSteps = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

/* ──────────────── Component ──────────────── */
export function OrderDetailView() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    async function loadOrder() {
      try {
        const res = await fetch(`/api/customer/orders/${orderId}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          const o = data.data;
          setOrder(o);

          // Auto-refresh for active orders
          const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
          if (activeStatuses.includes(o.status) && !interval) {
            interval = setInterval(loadOrder, 10000);
          } else if (!activeStatuses.includes(o.status) && interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [orderId]);

  const handleReorder = () => {
    if (!order) return;
    order.items.forEach((item) => {
      addToCart({
        menuItemId: item.menuItemId || item.id,
        name: item.itemName,
        price: item.unitPrice,
        image: item.itemImage || undefined,
        quantity: item.quantity,
      });
    });
    router.push("/customer/cart");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="kfm-skeleton h-5 w-40" />
        <div className="kfm-skeleton h-32 w-full rounded-xl" />
        <div className="kfm-skeleton h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center py-12">
        <Package className="h-12 w-12 text-text-3" />
        <p className="mt-3 text-sm text-text-2">Commande introuvable</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/customer/orders")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commandes
        </Button>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.push("/customer/orders")}
        className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux commandes
      </button>

      {/* Order header */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">{order.orderNumber}</h2>
                <StatusBadge type="order" status={statusMap[order.status] || "pending"} />
              </div>
              <p className="mt-1 text-xs text-text-3">
                {formatDateTime(order.createdAt)} · {orderTypeLabels[order.orderType] || order.orderType}
              </p>
            </div>
            <span className="text-lg font-bold text-text">{formatCurrency(order.total)}</span>
          </div>

          {/* Status progress */}
          {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-initial">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                            isActive
                              ? "bg-kfm-secondary text-white"
                              : "bg-surface-2 text-text-3"
                          )}
                        >
                          {isActive ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={cn(
                            "mt-1 text-[10px] font-medium text-center max-w-16",
                            isActive ? "text-kfm-secondary" : "text-text-3"
                          )}
                        >
                          {statusLabels[step] || step}
                        </span>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            "mx-1 h-0.5 flex-1 rounded-full mt-[-14px]",
                            idx < currentStepIndex ? "bg-kfm-secondary" : "bg-surface-2"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text">Articles commandes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-kfm-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-kfm-sm bg-surface-2 text-xs font-bold text-text-2">
                    {item.quantity}x
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.itemName}</p>
                    {item.variantName && (
                      <p className="text-xs text-text-3">{item.variantName}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-text flex-shrink-0 ml-3">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-2">Sous-total</span>
            <span className="text-text">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Remise</span>
              <span className="text-kfm-success">-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Frais de livraison</span>
              <span className="text-text">{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-2">Taxe (TVA 18%)</span>
            <span className="text-text">{formatCurrency(order.tax)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-text">Total</span>
            <span className="text-text">{formatCurrency(order.total)}</span>
          </div>
          {order.loyaltyPointsEarned > 0 && (
            <p className="text-xs text-kfm-info">
              +{order.loyaltyPointsEarned} points de fidelite gagnes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delivery address */}
      {order.orderType === "DELIVERY" && order.deliveryAddress && (
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-kfm-danger flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Adresse de livraison</p>
                <p className="text-xs text-text-2 mt-0.5">
                  {order.deliveryAddress}
                  {order.deliveryCity && `, ${order.deliveryCity}`}
                  {order.deliveryDistrict && ` — ${order.deliveryDistrict}`}
                </p>
                {order.deliveryNotes && (
                  <p className="text-xs text-text-3 mt-1">Notes : {order.deliveryNotes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {order.notes && (
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-text-2">Notes client</p>
            <p className="text-sm text-text mt-1">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status history */}
      {order.statusHistory && order.statusHistory.length > 1 && (
        <Card className="border-kfm-border bg-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-text">Historique du statut</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {order.statusHistory.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                      idx === order.statusHistory.length - 1
                        ? "bg-kfm-secondary"
                        : "bg-kfm-border"
                    )}
                  />
                  <div>
                    <p className="text-xs font-medium text-text">
                      {statusLabels[entry.status] || entry.status}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-text-3">{entry.notes}</p>
                    )}
                    <p className="text-[10px] text-text-3">{formatDateTime(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reorder + Receipt buttons */}
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
          onClick={handleReorder}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Commander a nouveau
        </Button>
        <Button
          variant="outline"
          className="flex-shrink-0"
          onClick={() =>
            router.push(
              `/receipt?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.customerPhone)}`
            )
          }
        >
          <Receipt className="mr-1.5 h-4 w-4" />
          Recu
        </Button>
      </div>
    </div>
  );
}
