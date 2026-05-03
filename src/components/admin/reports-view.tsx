"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart3, RefreshCcw, AlertCircle, Download, Calendar, ShoppingCart,
  Receipt, CalendarCheck, TrendingUp, ArrowLeft, ArrowRight, Loader2,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { SkeletonStatCard, SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";

// ── Types ──────────────────────────────────────────────────────────────────

type ReportType = "ventes" | "depenses" | "reservations";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  payments?: Array<{ method: string; amount: number }>;
}

interface Expense {
  id: string;
  title: string | null;
  category: string;
  amount: number;
  date: string;
  status: string;
  categoryRelation?: { name: string } | null;
}

interface Reservation {
  id: string;
  guestName: string;
  partySize: number;
  status: string;
  date: string;
  time?: string | null;
  customer?: { firstName: string; lastName: string; phone: string } | null;
}

const REPORT_TYPES: { key: ReportType; label: string; icon: React.ReactNode }[] = [
  { key: "ventes", label: "Ventes", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "depenses", label: "Depenses", icon: <Receipt className="h-4 w-4" /> },
  { key: "reservations", label: "Reservations", icon: <CalendarCheck className="h-4 w-4" /> },
];

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────────

function dateToInput(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return dateToInput(d);
}

function getDefaultTo(): string {
  return dateToInput(new Date());
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminReportsView() {
  const [reportType, setReportType] = useState<ReportType>("ventes");
  const [dateFrom, setDateFrom] = useState(getDefaultFrom());
  const [dateTo, setDateTo] = useState(getDefaultTo());
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataPage, setDataPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [oRes, eRes, rRes] = await Promise.allSettled([
        fetch("/api/orders?limit=1000", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/expenses", { headers: authHeaders() }).then((r) => r.json()),
        fetch("/api/reservations", { headers: authHeaders() }).then((r) => r.json()),
      ]);
      if (oRes.status === "fulfilled" && oRes.value.success) setOrders(oRes.value.data.orders || []);
      if (eRes.status === "fulfilled" && eRes.value.success) setExpenses(eRes.value.data || []);
      if (rRes.status === "fulfilled" && rRes.value.success) setReservations(rRes.value.data || []);
    } catch {
      setError("Erreur de chargement des donnees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when report type changes
  useEffect(() => { setDataPage(1); }, [reportType]);

  // ── Filter by date range ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= from && d <= to;
    });
  }, [orders, dateFrom, dateTo]);

  const filteredExpenses = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= from && d <= to;
    });
  }, [expenses, dateFrom, dateTo]);

  const filteredReservations = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return reservations.filter(r => {
      const d = new Date(r.date);
      return d >= from && d <= to;
    });
  }, [reservations, dateFrom, dateTo]);

  // ── Pagination for data tables ─────────────────────────────────────────
  const paginatedOrders = useMemo(() => {
    const start = (dataPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, dataPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (dataPage - 1) * PAGE_SIZE;
    return filteredExpenses.slice(start, start + PAGE_SIZE);
  }, [filteredExpenses, dataPage]);

  const paginatedReservations = useMemo(() => {
    const start = (dataPage - 1) * PAGE_SIZE;
    return filteredReservations.slice(start, start + PAGE_SIZE);
  }, [filteredReservations, dataPage]);

  const currentTotalPages = Math.max(1, Math.ceil(
    reportType === "ventes" ? filteredOrders.length / PAGE_SIZE
    : reportType === "depenses" ? filteredExpenses.length / PAGE_SIZE
    : filteredReservations.length / PAGE_SIZE
  ));

  // ── CSV Export ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    let csv = "";
    if (reportType === "ventes") {
      csv = "Commande,Client,Type,Statut,Paiement,Total,Date\n";
      filteredOrders.forEach(o => {
        csv += `"${o.orderNumber}","${o.customerName}","${o.orderType}","${o.status}","${o.paymentStatus}",${o.total},"${formatDate(o.createdAt)}"\n`;
      });
    } else if (reportType === "depenses") {
      csv = "Titre,Categorie,Montant,Statut,Date\n";
      filteredExpenses.forEach(e => {
        csv += `"${e.title || e.category}","${e.categoryRelation?.name || e.category}",${e.amount},"${e.status}","${formatDate(e.date)}"\n`;
      });
    } else if (reportType === "reservations") {
      csv = "Client,Personnes,Statut,Date\n";
      filteredReservations.forEach(r => {
        csv += `"${r.guestName}",${r.partySize},"${r.status}","${formatDate(r.date)}"\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${reportType}-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Rapports</h2>
          <p className="mt-1 text-sm text-text-2">Rapports et analyses detailles</p>
        </div>
        <div className="flex gap-3"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Rapports</h2>
            <p className="mt-1 text-sm text-text-2">Rapports et analyses</p>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
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

  // ── Ventes Report ──────────────────────────────────────────────────────
  const renderVentesReport = () => {
    const total = filteredOrders.length;
    const revenue = filteredOrders.reduce((s, o) => s + o.total, 0);
    const avg = total > 0 ? revenue / total : 0;
    const byStatus: Record<string, number> = {};
    const byPayment: Record<string, number> = {};
    filteredOrders.forEach(o => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      (o.payments || []).forEach(p => { byPayment[p.method] = (byPayment[p.method] || 0) + p.amount; });
    });

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total commandes" value={formatNumber(total)} icon={ShoppingCart} />
          <StatCard label="Revenu total" value={formatCurrency(revenue)} icon={TrendingUp} />
          <StatCard label="Panier moyen" value={formatCurrency(Math.round(avg))} icon={BarChart3} />
          <StatCard label="En attente" value={String(byStatus["PENDING"] || 0)} icon={AlertCircle} changeType="negative" />
        </div>

        {/* Data table */}
        <div className="rounded-kfm-md border border-kfm-border bg-bg overflow-hidden">
          <div className="grid grid-cols-[0.8fr_1fr_0.6fr_0.7fr_0.6fr_0.7fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-4 py-2.5">
            <span className="text-[10px] font-semibold text-text-3 uppercase">N°</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Client</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Type</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Statut</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase text-right">Montant</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Date</span>
          </div>
          {paginatedOrders.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-text-3">Aucune commande pour cette periode</p>
            </div>
          )}
          {paginatedOrders.map((o, i) => (
            <div key={o.id} className={cn("grid grid-cols-[0.8fr_1fr_0.6fr_0.7fr_0.6fr_0.7fr] gap-2 items-center px-4 py-2.5 border-b border-kfm-border last:border-0", i % 2 === 1 && "bg-surface/30")}>
              <span className="text-xs font-semibold text-text truncate">{o.orderNumber}</span>
              <span className="text-xs text-text-2 truncate">{o.customerName}</span>
              <span className="text-xs text-text-2">{o.orderType}</span>
              <span className="text-xs text-text-2">{o.status}</span>
              <span className="text-xs font-semibold text-text text-right">{formatCurrency(o.total)}</span>
              <span className="text-xs text-text-3">{formatDate(o.createdAt)}</span>
            </div>
          ))}
          {currentTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-4 py-2">
              <span className="text-[10px] text-text-3">{(dataPage - 1) * PAGE_SIZE + 1}-{Math.min(dataPage * PAGE_SIZE, filteredOrders.length)} sur {filteredOrders.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setDataPage(p => Math.max(1, p - 1))} disabled={dataPage <= 1} className="rounded p-1 text-text-3 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3 w-3" /></button>
                <button onClick={() => setDataPage(p => Math.min(currentTotalPages, p + 1))} disabled={dataPage >= currentTotalPages} className="rounded p-1 text-text-3 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Depenses Report ────────────────────────────────────────────────────
  const renderDepensesReport = () => {
    const total = filteredExpenses.length;
    const amount = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const byCat: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const cat = e.categoryRelation?.name || e.category || "Autre";
      byCat[cat] = (byCat[cat] || 0) + e.amount;
    });

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total depenses" value={formatNumber(total)} icon={Receipt} />
          <StatCard label="Montant total" value={formatCurrency(Math.round(amount))} icon={TrendingUp} />
          <StatCard label="Categories" value={String(Object.keys(byCat).length)} icon={BarChart3} />
        </div>

        {/* Data table */}
        <div className="rounded-kfm-md border border-kfm-border bg-bg overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.8fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-4 py-2.5">
            <span className="text-[10px] font-semibold text-text-3 uppercase">Titre</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Categorie</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase text-right">Montant</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Statut</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Date</span>
          </div>
          {paginatedExpenses.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-text-3">Aucune depense pour cette periode</p>
            </div>
          )}
          {paginatedExpenses.map((e, i) => (
            <div key={e.id} className={cn("grid grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.8fr] gap-2 items-center px-4 py-2.5 border-b border-kfm-border last:border-0", i % 2 === 1 && "bg-surface/30")}>
              <span className="text-xs text-text truncate">{e.title || "—"}</span>
              <span className="text-xs text-text-2 truncate">{e.categoryRelation?.name || e.category || "Autre"}</span>
              <span className="text-xs font-semibold text-text text-right">{formatCurrency(e.amount)}</span>
              <span className="text-xs text-text-2">{e.status}</span>
              <span className="text-xs text-text-3">{formatDate(e.date)}</span>
            </div>
          ))}
          {currentTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-4 py-2">
              <span className="text-[10px] text-text-3">{(dataPage - 1) * PAGE_SIZE + 1}-{Math.min(dataPage * PAGE_SIZE, filteredExpenses.length)} sur {filteredExpenses.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setDataPage(p => Math.max(1, p - 1))} disabled={dataPage <= 1} className="rounded p-1 text-text-3 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3 w-3" /></button>
                <button onClick={() => setDataPage(p => Math.min(currentTotalPages, p + 1))} disabled={dataPage >= currentTotalPages} className="rounded p-1 text-text-3 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Reservations Report ────────────────────────────────────────────────
  const renderReservationsReport = () => {
    const total = filteredReservations.length;
    const byStatus: Record<string, number> = {};
    filteredReservations.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    const totalGuests = filteredReservations.reduce((s, r) => s + r.partySize, 0);

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total reservations" value={formatNumber(total)} icon={CalendarCheck} />
          <StatCard label="Personnes totales" value={formatNumber(totalGuests)} icon={CalendarCheck} />
          <StatCard label="Confirmees" value={String(byStatus["CONFIRMED"] || 0)} icon={CalendarCheck} changeType="positive" />
          <StatCard label="Annulees" value={String(byStatus["CANCELLED"] || 0)} icon={AlertCircle} changeType="negative" />
        </div>

        {/* Data table */}
        <div className="rounded-kfm-md border border-kfm-border bg-bg overflow-hidden">
          <div className="grid grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-4 py-2.5">
            <span className="text-[10px] font-semibold text-text-3 uppercase">Client</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Personnes</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Statut</span>
            <span className="text-[10px] font-semibold text-text-3 uppercase">Date</span>
          </div>
          {paginatedReservations.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-text-3">Aucune reservation pour cette periode</p>
            </div>
          )}
          {paginatedReservations.map((r, i) => (
            <div key={r.id} className={cn("grid grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr] gap-2 items-center px-4 py-2.5 border-b border-kfm-border last:border-0", i % 2 === 1 && "bg-surface/30")}>
              <span className="text-xs text-text truncate">{r.guestName}</span>
              <span className="text-xs text-text-2">{r.partySize}</span>
              <span className="text-xs text-text-2">{r.status}</span>
              <span className="text-xs text-text-3">{formatDate(r.date)}{r.time ? ` ${r.time}` : ""}</span>
            </div>
          ))}
          {currentTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-4 py-2">
              <span className="text-[10px] text-text-3">{(dataPage - 1) * PAGE_SIZE + 1}-{Math.min(dataPage * PAGE_SIZE, filteredReservations.length)} sur {filteredReservations.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setDataPage(p => Math.max(1, p - 1))} disabled={dataPage <= 1} className="rounded p-1 text-text-3 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3 w-3" /></button>
                <button onClick={() => setDataPage(p => Math.min(currentTotalPages, p + 1))} disabled={dataPage >= currentTotalPages} className="rounded p-1 text-text-3 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case "ventes": return renderVentesReport();
      case "depenses": return renderDepensesReport();
      case "reservations": return renderReservationsReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Rapports</h2>
          <p className="mt-1 text-sm text-text-2">Rapports et analyses detailles</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
          <RefreshCcw className="h-4 w-4" /> Rafraichir
        </button>
      </div>

      {/* Report type selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.key}
            onClick={() => setReportType(rt.key)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
              reportType === rt.key
                ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
            )}
          >
            {rt.icon} {rt.label}
          </button>
        ))}
      </div>

      {/* Date range + Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-3" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
          </div>
          <span className="text-text-3">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Download className="h-4 w-4" /> Exporter CSV
        </button>
      </div>

      {/* Report content */}
      <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
        {renderReport()}
      </div>
    </div>
  );
}
