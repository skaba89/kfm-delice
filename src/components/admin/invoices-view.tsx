"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Receipt, Search, RefreshCcw, X, AlertCircle, Calendar,
  ArrowLeft, ArrowRight, Eye, ChevronRight, DollarSign,
  CheckCircle2, Clock, Loader2,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/kfm-ui/status-badge";

// ── Types ──────────────────────────────────────────────────────────────────

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
  orderType: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  items: OrderItem[];
  payments: Array<{ id: string; method: string; status: string; amount: number }>;
  createdAt: string;
  updatedAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Especes",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
};

const dateToInput = (d: Date) => d.toISOString().split("T")[0];

// ── Component ──────────────────────────────────────────────────────────────

export function AdminInvoicesView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return dateToInput(d);
  });
  const [dateTo, setDateTo] = useState(() => dateToInput(new Date()));
  const [page, setPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("limit", String(500));
      if (search) params.set("search", search);

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders || []);
        setTotal(json.data.total || 0);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Client-side filter: only PAID or PARTIAL ──────────────────────────
  const invoices = useMemo(() => {
    let filtered = orders.filter(
      o => o.paymentStatus === "PAID" || o.paymentStatus === "PARTIAL"
    );

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter(o => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => new Date(o.createdAt) <= to);
    }

    // Search within client-side
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        o => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [orders, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return invoices.slice(start, start + PAGE_SIZE);
  }, [invoices, page]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const paid = invoices.filter(o => o.paymentStatus === "PAID");
    const totalAmount = invoices.reduce((s, o) => s + o.total, 0);
    const pending = invoices.filter(o => o.paymentStatus === "PARTIAL");
    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }, [invoices]);

  const resetFilters = () => {
    setSearch("");
    setPage(1);
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setDateFrom(dateToInput(d));
    setDateTo(dateToInput(new Date()));
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Factures</h2>
          <p className="mt-1 text-sm text-text-2">Factures et paiements</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />)}
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Factures</h2>
            <p className="mt-1 text-sm text-text-2">Factures et paiements</p>
          </div>
          <button onClick={fetchOrders} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text">Factures</h2>
        <p className="mt-1 text-sm text-text-2">{stats.totalInvoices} facture{stats.totalInvoices !== 1 ? "s" : ""} au total</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total factures" value={String(stats.totalInvoices)} icon={Receipt} />
        <StatCard label="Montant total" value={formatCurrency(stats.totalAmount)} icon={DollarSign} />
        <StatCard label="Payees" value={String(stats.paidCount)} icon={CheckCircle2} changeType="positive" />
        <StatCard label="En attente" value={String(stats.pendingCount)} icon={Clock} changeType="negative" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par numero, client..."
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-3" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none"
            />
          </div>
          <span className="text-text-3">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none"
          />
        </div>
        {(search || dateFrom || dateTo) && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Empty */}
      {invoices.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="Aucune facture trouvee"
          description={search ? "Aucune facture ne correspond a votre recherche." : "Aucune facture n'a encore ete generee."}
          action={
            search ? (
              <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                <RefreshCcw className="h-4 w-4" /> Reinitialiser
              </button>
            ) : undefined
          }
        />
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="grid grid-cols-[0.8fr_1fr_0.7fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">N° Facture</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Client</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Montant</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut paiement</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Methode</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Date</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
        </div>

        {paginated.map((order, index) => (
          <div
            key={order.id}
            className={cn(
              "grid grid-cols-[0.8fr_1fr_0.7fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
              index % 2 === 1 && "bg-bg/40"
            )}
          >
            <span className="text-sm font-semibold text-text truncate">{order.orderNumber}</span>

            <span className="text-sm text-text-2 truncate">{order.customerName}</span>

            <span className="text-sm font-semibold text-text text-right">{formatCurrency(order.total)}</span>

            <StatusBadge
              type="payment"
              status={order.paymentStatus === "PAID" ? "paid" : "unpaid"}
              label={order.paymentStatus === "PAID" ? "Payee" : "Partiel"}
            />

            <span className="text-sm text-text-2">
              {order.payments?.[0]
                ? PAYMENT_METHOD_LABELS[order.payments[0].method] || order.payments[0].method
                : "—"}
            </span>

            <span className="text-xs text-text-3 whitespace-nowrap">{formatDateTime(order.createdAt)}</span>

            <div className="flex items-center justify-end">
              <button
                onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, invoices.length)} sur {invoices.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>{p}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {paginated.map(order => (
          <div key={order.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text">{order.orderNumber}</p>
                <p className="text-xs text-text-2">{order.customerName}</p>
              </div>
              <StatusBadge
                type="payment"
                status={order.paymentStatus === "PAID" ? "paid" : "unpaid"}
                label={order.paymentStatus === "PAID" ? "Payee" : "Partiel"}
              />
            </div>
            <div className="flex items-center justify-between border-t border-kfm-border pt-3">
              <span className="text-sm font-bold text-text">{formatCurrency(order.total)}</span>
              <span className="text-xs text-text-3">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, invoices.length)} sur {invoices.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text flex items-center gap-2">
                  Facture {selectedOrder.orderNumber}
                  <StatusBadge
                    type="payment"
                    status={selectedOrder.paymentStatus === "PAID" ? "paid" : "unpaid"}
                    label={selectedOrder.paymentStatus === "PAID" ? "Payee" : "Partiel"}
                  />
                </DialogTitle>
                <DialogDescription className="text-text-2">{formatDateTime(selectedOrder.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Client info */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Client</h4>
                  <p className="text-sm font-medium text-text">{selectedOrder.customerName}</p>
                </div>

                {/* Items */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Articles</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map(item => (
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

                {/* Payments */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                    <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Paiements</h4>
                    <div className="space-y-2">
                      {selectedOrder.payments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-text">
                              {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                            </span>
                            <span className="text-xs text-text-3 ml-2">
                              ({payment.status})
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-text">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
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
