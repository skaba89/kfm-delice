"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CreditCard, Search, RefreshCcw, ArrowLeft, ArrowRight,
  AlertCircle, Wallet, X, TrendingDown, Ban, CheckCircle, Clock, Eye,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { SkeletonStatCard, SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  orderId: string | null;
  amount: number;
  currency: string;
  method: string;
  provider: string | null;
  status: string;
  phoneNumber: string | null;
  createdAt: string;
  processedAt: string | null;
}

type StatusTab = "all" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
type MethodTab = "all" | "CASH" | "MOBILE_MONEY" | "CARD" | "WALLET" | "BANK_TRANSFER" | "GIFT_CARD";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "PENDING", label: "En attente" },
  { key: "PAID", label: "Payes" },
  { key: "FAILED", label: "Echoues" },
  { key: "REFUNDED", label: "Rembourses" },
];

const METHOD_TABS: { key: MethodTab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "CASH", label: "Especes" },
  { key: "MOBILE_MONEY", label: "Mobile Money" },
  { key: "CARD", label: "Carte" },
  { key: "WALLET", label: "Portefeuille" },
  { key: "BANK_TRANSFER", label: "Virement" },
  { key: "GIFT_CARD", label: "Carte cadeau" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paye", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20" },
  PENDING: { label: "En attente", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20" },
  FAILED: { label: "Echoue", color: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20" },
  REFUNDED: { label: "Rembourse", color: "bg-kfm-info/10 text-kfm-info border-kfm-info/20" },
};

const METHOD_CONFIG: Record<string, { label: string; color: string }> = {
  CASH: { label: "Especes", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  MOBILE_MONEY: { label: "Mobile Money", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  CARD: { label: "Carte", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  WALLET: { label: "Portefeuille", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  BANK_TRANSFER: { label: "Virement", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  GIFT_CARD: { label: "Carte cadeau", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
};

const PAGE_SIZE = 12;

// ── Component ──────────────────────────────────────────────────────────────

export function AdminPaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [methodTab, setMethodTab] = useState<MethodTab>("all");
  const [page, setPage] = useState(1);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/payments", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setPayments(json.data || []);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // ── Client-side filtering ────────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchStatus = statusTab === "all" || p.status === statusTab;
      const matchMethod = methodTab === "all" || p.method === methodTab;
      const matchSearch = !search ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (p.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.provider || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.phoneNumber || "").includes(search);
      return matchStatus && matchMethod && matchSearch;
    });
  }, [payments, statusTab, methodTab, search]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, page]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const paidCount = payments.filter((p) => p.status === "PAID").length;
    const pendingCount = payments.filter((p) => p.status === "PENDING").length;
    const failedCount = payments.filter((p) => p.status === "FAILED").length;
    return { total: payments.length, totalAmount, paidCount, pendingCount, failedCount };
  }, [payments]);

  const resetFilters = () => {
    setSearch("");
    setStatusTab("all");
    setMethodTab("all");
    setPage(1);
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Paiements</h2>
          <p className="mt-1 text-sm text-text-2">Historique des paiements</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-xs rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Paiements</h2>
            <p className="mt-1 text-sm text-text-2">Historique des paiements</p>
          </div>
          <button onClick={fetchPayments} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
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

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text">Paiements</h2>
        <p className="mt-1 text-sm text-text-2">
          {stats.total} paiement{stats.total !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total paiements" value={String(stats.total)} icon={CreditCard} />
        <StatCard label="Montant total" value={formatCurrency(stats.totalAmount)} icon={Wallet} className="border-l-4 border-l-kfm-success" />
        <StatCard label="Payes" value={String(stats.paidCount)} icon={CheckCircle} className="border-l-4 border-l-kfm-success" />
        <StatCard label="En attente" value={String(stats.pendingCount)} icon={Clock} className="border-l-4 border-l-kfm-warning" />
        <StatCard label="Echoues" value={String(stats.failedCount)} icon={Ban} className="border-l-4 border-l-kfm-danger" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher par ID, commande..."
            />
          </div>
          {(search || statusTab !== "all" || methodTab !== "all") && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
              <X className="h-3 w-3" /> Reinitialiser
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button key={tab.key} onClick={() => { setStatusTab(tab.key); setPage(1); }} className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition",
              statusTab === tab.key
                ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
            )}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Method select */}
        <div>
          <select
            value={methodTab} onChange={(e) => { setMethodTab(e.target.value as MethodTab); setPage(1); }}
            className="h-[36px] rounded-kfm-sm border border-kfm-border bg-surface px-3 text-sm text-text focus:border-kfm-secondary focus:outline-none"
          >
            {METHOD_TABS.map((tab) => (
              <option key={tab.key} value={tab.key}>{tab.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filteredPayments.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="Aucun paiement trouve"
          description="Aucun paiement ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser
            </button>
          }
        />
      )}

      {/* Desktop Table */}
      {paginated.length > 0 && (
        <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="grid grid-cols-[0.7fr_0.8fr_0.6fr_0.6fr_0.7fr_0.6fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">ID</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Montant</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Methode</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Date</span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {paginated.map((payment, index) => {
              const sCfg = STATUS_CONFIG[payment.status] || { label: payment.status, color: "bg-surface-2 text-text-2 border border-kfm-border" };
              const mCfg = METHOD_CONFIG[payment.method] || { label: payment.method, color: "bg-surface-2 text-text-2 border border-kfm-border" };

              return (
                <div
                  key={payment.id}
                  onClick={() => { setSelectedPayment(payment); setDetailOpen(true); }}
                  className={cn(
                    "grid grid-cols-[0.7fr_0.8fr_0.6fr_0.6fr_0.7fr_0.6fr] gap-2 items-center border-b border-kfm-border px-5 py-3 transition-colors hover:bg-surface-2/40 last:border-0 cursor-pointer",
                    index % 2 === 1 && "bg-bg/40"
                  )}
                >
                  {/* Truncated ID */}
                  <span className="text-xs font-mono text-text-2 truncate" title={payment.id}>
                    {payment.id.length > 12 ? `${payment.id.slice(0, 8)}...${payment.id.slice(-4)}` : payment.id}
                  </span>
                  {/* Amount */}
                  <span className="text-sm font-semibold text-text text-right">
                    {formatCurrency(payment.amount)}
                  </span>
                  {/* Method badge */}
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", mCfg.color)}>
                    {mCfg.label}
                  </span>
                  {/* Status badge */}
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", sCfg.color)}>
                    {sCfg.label}
                  </span>
                  {/* Phone */}
                  <span className="text-sm text-text-2 truncate">{payment.phoneNumber || "—"}</span>
                  {/* Date */}
                  <span className="text-xs text-text-3 whitespace-nowrap">{formatDateTime(payment.createdAt)}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
              <span className="text-xs text-text-3">
                {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredPayments.length)} sur {filteredPayments.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={cn(
                      "h-8 w-8 rounded-lg text-xs font-medium transition",
                      page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2"
                    )}>{p}</button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Cards */}
      {paginated.length > 0 && (
        <div className="md:hidden space-y-3">
          {paginated.map((payment) => {
            const sCfg = STATUS_CONFIG[payment.status] || { label: payment.status, color: "bg-surface-2 text-text-2 border border-kfm-border" };
            const mCfg = METHOD_CONFIG[payment.method] || { label: payment.method, color: "bg-surface-2 text-text-2 border border-kfm-border" };

            return (
              <div
                key={payment.id}
                onClick={() => { setSelectedPayment(payment); setDetailOpen(true); }}
                className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm cursor-pointer hover:border-kfm-secondary/30 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-text-3 truncate" title={payment.id}>
                      {payment.id.length > 16 ? `${payment.id.slice(0, 12)}...` : payment.id}
                    </p>
                    <p className="text-[10px] text-text-3 mt-0.5">{formatDateTime(payment.createdAt)}</p>
                  </div>
                  <span className="text-sm font-bold text-text ml-2">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", mCfg.color)}>{mCfg.label}</span>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", sCfg.color)}>{sCfg.label}</span>
                </div>
                {payment.phoneNumber && (
                  <div className="border-t border-kfm-border pt-2">
                    <span className="text-xs text-text-3">{payment.phoneNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">Details du paiement</DialogTitle>
                <DialogDescription className="text-text-2 font-mono text-xs">
                  {selectedPayment.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Status & Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <span className={cn(
                      "mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      (STATUS_CONFIG[selectedPayment.status] || {}).color || ""
                    )}>
                      {(STATUS_CONFIG[selectedPayment.status] || {}).label || selectedPayment.status}
                    </span>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Methode</p>
                    <span className={cn(
                      "mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      (METHOD_CONFIG[selectedPayment.method] || {}).color || ""
                    )}>
                      {(METHOD_CONFIG[selectedPayment.method] || {}).label || selectedPayment.method}
                    </span>
                  </div>
                </div>

                {/* All details */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Montant</span>
                    <span className="text-text font-semibold">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Devise</span>
                    <span className="text-text">{selectedPayment.currency || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Commande</span>
                    <span className="text-kfm-secondary font-mono text-xs">{selectedPayment.orderId || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Fournisseur</span>
                    <span className="text-text">{selectedPayment.provider || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Telephone</span>
                    <span className="text-text">{selectedPayment.phoneNumber || "—"}</span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Cree le</span>
                    <span className="text-text">{formatDateTime(selectedPayment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-3">Traite le</span>
                    <span className="text-text">{selectedPayment.processedAt ? formatDateTime(selectedPayment.processedAt) : "—"}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button onClick={() => setDetailOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                  Fermer
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
