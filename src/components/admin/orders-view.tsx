"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ShoppingCart, Search, MoreVertical, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, PackageSearch, Filter, ChevronRight,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime, formatDate, formatRelativeTime, initials } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatusBadge } from "@/components/kfm-ui/status-badge";
import {
  mapOrderStatusFromDB,
  mapOrderStatusToDB,
  mapPaymentStatusFromDB,
  mapOrderTypeFromDB,
  getNextStatuses,
  orderStatusLabels,
} from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled";

type PaymentStatus = "paid" | "unpaid" | "failed" | "refunded";

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  orderType: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  items: OrderItem[];
  delivery: {
    id: string;
    driver: { id: string; firstName: string; lastName: string; phone: string } | null;
  } | null;
  payments: Array<{ id: string; method: string; status: string; amount: number }>;
  createdAt: string;
  updatedAt: string;
}

type FilterTab = "all" | OrderStatus;

// ── Constants ──────────────────────────────────────────────────────────────

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "confirmed", label: "Confirmee" },
  { key: "preparing", label: "En preparation" },
  { key: "ready", label: "Pret" },
  { key: "delivering", label: "En livraison" },
  { key: "completed", label: "Terminee" },
  { key: "cancelled", label: "Annulee" },
];

const PAGE_SIZE = 12;

const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
  pending: "Confirmer",
  confirmed: "En preparation",
  preparing: "Marquer prete",
  ready: "En livraison",
  delivering: "Terminer",
};

const nextStatusValue: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivering",
  delivering: "completed",
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminOrdersView() {
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Fetch orders ──────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTab !== "all") {
        params.set("status", mapOrderStatusToDB(activeTab));
      }
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders || []);
        setTotal(json.data.total || 0);
      } else {
        setError(json.error || "Failed to fetch orders");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setPage(1);
  };

  // ── Status update ──────────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(orderId);
      const dbStatus = mapOrderStatusToDB(newStatus);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: dbStatus }),
      });
      const json = await res.json();
      if (json.success) {
        // Update locally
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: dbStatus } : o))
        );
      }
    } catch { /* silent */ }
    finally { setUpdatingStatus(null); }
  };

  const handleCancel = async (orderId: string) => {
    await handleStatusUpdate(orderId, "cancelled");
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Commandes</h2>
          <p className="mt-1 text-sm text-text-2">Commandes globales</p>
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="kfm-skeleton h-8 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Commandes</h2>
          <p className="mt-1 text-sm text-text-2">Commandes globales</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher une commande..."
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <EmptyState
          icon={PackageSearch}
          title="Aucune commande trouvee"
          description="Aucune commande ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser les filtres
            </button>
          }
        />
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text">Commandes</h2>
        <p className="mt-1 text-sm text-text-2">
          {total} commande{total !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher par client, numero..."
            />
          </div>
          {(search || activeTab !== "all") && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
              <X className="h-3 w-3" /> Reinitialiser
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[0.8fr_1fr_0.6fr_0.5fr_0.9fr_0.8fr_0.8fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">#Commande</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Client</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-center">Articles</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Montant</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Type</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Date</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
        </div>

        {/* Table rows */}
        {orders.map((order, index) => {
          const uiStatus = mapOrderStatusFromDB(order.status);
          const orderType = mapOrderTypeFromDB(order.orderType);
          const isUpdating = updatingStatus === order.id;
          const next = nextStatusValue[uiStatus];

          return (
            <div
              key={order.id}
              className={cn(
                "grid grid-cols-[0.8fr_1fr_0.6fr_0.5fr_0.9fr_0.8fr_0.8fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                index % 2 === 1 && "bg-bg/40"
              )}
            >
              <span className="text-sm font-semibold text-text truncate">{order.orderNumber}</span>

              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-[10px] font-bold text-kfm-secondary">
                  {initials(order.customerName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{order.customerName}</p>
                  <p className="text-xs text-text-3 truncate">{order.customerPhone}</p>
                </div>
              </div>

              <span className="text-sm text-text text-center">{order.items?.length || 0}</span>

              <span className="text-sm font-semibold text-text text-right">{formatCurrency(order.total)}</span>

              <StatusBadge type="order" status={uiStatus} />

              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                orderType === "livraison"
                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                  : orderType === "a emporter"
                  ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
              )}>
                {orderType}
              </span>

              <span className="text-xs text-text-3 whitespace-nowrap">{formatRelativeTime(order.createdAt)}</span>

              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                  className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text"
                  title="Details"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text disabled:opacity-40"
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {next && (
                      <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, next)}>
                        <RefreshCcw className="h-4 w-4" />
                        {nextStatusLabel[uiStatus]}
                      </DropdownMenuItem>
                    )}
                    {getNextStatuses(uiStatus).filter((s) => s !== next).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => handleStatusUpdate(order.id, s)}>
                        <RefreshCcw className="h-4 w-4" />
                        {orderStatusLabels[s]}
                      </DropdownMenuItem>
                    ))}
                    {uiStatus !== "cancelled" && uiStatus !== "completed" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-kfm-danger focus:text-kfm-danger"
                          onClick={() => handleCancel(order.id)}
                        >
                          Annuler la commande
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
            <span className="text-xs text-text-3">
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} sur {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-0.5 mx-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => {
          const uiStatus = mapOrderStatusFromDB(order.status);
          const orderType = mapOrderTypeFromDB(order.orderType);
          const isUpdating = updatingStatus === order.id;
          const next = nextStatusValue[uiStatus];

          return (
            <div key={order.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary">
                    {initials(order.customerName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{order.orderNumber}</p>
                    <p className="text-xs text-text-2">{order.customerName}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2" disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {next && (
                      <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, next)}>
                        <RefreshCcw className="h-4 w-4" />
                        {nextStatusLabel[uiStatus]}
                      </DropdownMenuItem>
                    )}
                    {uiStatus !== "cancelled" && uiStatus !== "completed" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-kfm-danger" onClick={() => handleCancel(order.id)}>
                          Annuler
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <StatusBadge type="order" status={uiStatus} />
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  orderType === "livraison" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                )}>
                  {orderType}
                </span>
              </div>

              {/* Items preview */}
              <div className="text-xs text-text-3 mb-3">
                {order.items?.map((item) => `${item.quantity}x ${item.itemName}`).join(" · ") || "—"}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-kfm-border pt-3">
                <span className="text-sm font-bold text-text">{formatCurrency(order.total)}</span>
                <span className="text-xs text-text-3">{formatRelativeTime(order.createdAt)}</span>
              </div>
            </div>
          );
        })}

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} sur {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Order Detail Dialog ───────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text flex items-center gap-2">
                  {selectedOrder.orderNumber}
                  <StatusBadge type="order" status={mapOrderStatusFromDB(selectedOrder.status)} />
                </DialogTitle>
                <DialogDescription className="text-text-2">
                  {formatDateTime(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Customer info */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Client</h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-text">{selectedOrder.customerName}</p>
                    <p className="text-xs text-text-2">{selectedOrder.customerPhone}</p>
                    {selectedOrder.customerEmail && (
                      <p className="text-xs text-text-2">{selectedOrder.customerEmail}</p>
                    )}
                  </div>
                </div>

                {/* Delivery info */}
                {(selectedOrder.orderType === "DELIVERY" && selectedOrder.deliveryAddress) && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                    <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Livraison</h4>
                    <p className="text-sm text-text">{selectedOrder.deliveryAddress}</p>
                    {selectedOrder.deliveryCity && (
                      <p className="text-xs text-text-2">{selectedOrder.deliveryCity}</p>
                    )}
                    {selectedOrder.delivery?.driver && (
                      <p className="text-xs text-kfm-secondary mt-1">
                        Livreur: {selectedOrder.delivery.driver.firstName} {selectedOrder.delivery.driver.lastName}
                      </p>
                    )}
                  </div>
                )}

                {/* Order items */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Articles</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-text">{item.itemName}</p>
                          <p className="text-xs text-text-3">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <span className="text-sm font-medium text-text">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Total</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-2">Sous-total</span>
                      <span className="text-text">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-2">Frais de livraison</span>
                        <span className="text-text">{formatCurrency(selectedOrder.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-base font-bold border-t border-kfm-border pt-2">
                      <span className="text-text">Total</span>
                      <span className="text-kfm-secondary">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment info */}
                {selectedOrder.payments?.[0] && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                    <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Paiement</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <StatusBadge type="payment" status={mapPaymentStatusFromDB(selectedOrder.payments[0].status)} />
                        <p className="text-xs text-text-3 mt-1">{selectedOrder.payments[0].method}</p>
                      </div>
                      <span className="text-sm font-semibold text-text">{formatCurrency(selectedOrder.payments[0].amount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
