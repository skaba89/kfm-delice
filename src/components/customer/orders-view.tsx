"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthHeaders } from "@/lib/auth-context";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/kfm-ui/status-badge";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { OrderRowSkeleton } from "@/components/ui/loading-patterns";
import { cn } from "@/lib/utils";

/* ──────────────── Types ──────────────── */
interface OrderItem {
  id: string;
  itemName: string;
  itemImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderData {
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
  deliveryFee: number;
  total: number;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
  items: OrderItem[];
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

const orderTypeLabels: Record<string, string> = {
  DINE_IN: "Sur place",
  TAKEAWAY: "A emporter",
  DELIVERY: "Livraison",
  DRIVE_THRU: "Drive",
};

/* ──────────────── Component ──────────────── */
export function OrdersView() {
  const [activeTab, setActiveTab] = useState("active");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer/orders?status=${activeTab}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setOrders(data.data.orders || []);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

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
        <OrderRowSkeleton count={3} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={activeTab === "all" ? ShoppingBag : ShoppingCart}
          title={
            activeTab === "active"
              ? "Aucune commande en cours"
              : activeTab === "completed"
              ? "Aucune commande terminee"
              : "Aucune commande"
          }
          description={
            activeTab === "active"
              ? "Vos commandes actives apparaitront ici."
              : activeTab === "completed"
              ? "Vos commandes terminees apparaitront ici."
              : "Vous n'avez pas encore passe de commande."
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/customer/orders/${order.id}`}>
              <Card className="border-kfm-border bg-surface transition-shadow hover:shadow-md cursor-pointer mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-text">
                          {order.orderNumber}
                        </span>
                        <StatusBadge type="order" status={statusMap[order.status] || "pending"} />
                      </div>

                      {/* Details */}
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-text-2">
                          {order.itemCount} article{order.itemCount > 1 ? "s" : ""} ·{" "}
                          {orderTypeLabels[order.orderType] || order.orderType}
                          {order.deliveryAddress && ` · ${order.deliveryCity || "Livraison"}`}
                        </p>
                        <p className="text-xs text-text-3">
                          {formatDateTime(order.createdAt)}
                        </p>
                        {/* Items preview */}
                        <p className="text-xs text-text-3 truncate">
                          {order.items.slice(0, 3).map((i) => `${i.quantity}x ${i.itemName}`).join(" · ")}
                          {order.items.length > 3 && ` +${order.items.length - 3} autres`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-sm font-bold text-text">
                        {formatCurrency(order.total)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-text-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
