"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText, Plus, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, Calendar, Filter,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface CategoryRelation {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

interface Expense {
  id: string;
  title: string | null;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string | null;
  supplierName: string | null;
  notes: string | null;
  status: string;
  categoryRelation: CategoryRelation | null;
  createdAt: string;
}

interface CreateFormData {
  title: string;
  categoryId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  supplierName: string;
  notes: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const paymentMethods = [
  { value: "CASH", label: "Especes" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CARD", label: "Carte" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
  { value: "OTHER", label: "Autre" },
];

const expenseStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20" },
  approved: { label: "Approuvee", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20" },
  rejected: { label: "Rejetee", color: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20" },
  paid: { label: "Payee", color: "bg-kfm-info/10 text-kfm-info border-kfm-info/20" },
};

const emptyForm = (): CreateFormData => ({
  title: "", categoryId: "", amount: "", date: new Date().toISOString().split("T")[0],
  paymentMethod: "CASH", supplierName: "", notes: "",
});

const PAGE_SIZE = 12;

// ── Component ──────────────────────────────────────────────────────────────

export function AdminExpensesView() {
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await fetch(`/api/expenses?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        let data = json.data || [];
        setAllExpenses(data);
        // Apply search filter
        if (search) {
          const q = search.toLowerCase();
          data = data.filter((e: Expense) =>
            e.title?.toLowerCase().includes(q) ||
            e.categoryRelation?.name?.toLowerCase().includes(q) ||
            e.supplierName?.toLowerCase().includes(q) ||
            e.notes?.toLowerCase().includes(q)
          );
        }
        setExpenses(data);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return expenses.slice(start, start + PAGE_SIZE);
  }, [expenses, page]);

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setCategoryFilter("");
    setPage(1);
  };

  // Apply category filter
  useEffect(() => {
    if (!categoryFilter) {
      setExpenses(allExpenses);
    } else {
      setExpenses(allExpenses.filter(e => {
        const cat = e.categoryRelation?.name || e.category || "Autre";
        return cat === categoryFilter;
      }));
    }
    setPage(1);
  }, [categoryFilter, allExpenses]);

  // Summary
  const totalAmount = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthExpenses = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }), [expenses, thisMonth, thisYear]);
  const monthTotal = useMemo(() => monthExpenses.reduce((s, e) => s + (e.amount || 0), 0), [monthExpenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    allExpenses.forEach(e => {
      const cat = e.categoryRelation?.name || e.category || "Autre";
      map.set(cat, (map.get(cat) || 0) + (e.amount || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allExpenses]);

  // Available categories from loaded data
  const availableCategories = useMemo(() => {
 const cats = new Set<string>();
    allExpenses.forEach(e => {
      const cat = e.categoryRelation?.name || e.category || "Autre";
      cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [allExpenses]);

  // Create
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Requis";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) errors.amount = "Montant invalide";
    if (!form.date) errors.date = "Date requise";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title,
          categoryId: form.categoryId || null,
          amount: form.amount,
          date: form.date,
          paymentMethod: form.paymentMethod,
          supplierName: form.supplierName || null,
          notes: form.notes || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setForm(emptyForm());
        setFormErrors({});
        fetchExpenses();
      } else {
        setFormErrors({ submit: json.error || "Erreur lors de la creation" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Depenses</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des depenses</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />
          ))}
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Depenses</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des depenses</p>
          </div>
          <button onClick={fetchExpenses} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Depenses</h2>
          <p className="mt-1 text-sm text-text-2">
            {expenses.length} depense{expenses.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter une depense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Total ce mois</p>
          <p className="mt-1 text-xl font-bold text-text">{formatCurrency(monthTotal)}</p>
          <p className="mt-1 text-xs text-text-3">{monthExpenses.length} depense{monthExpenses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Total general</p>
          <p className="mt-1 text-xl font-bold text-text">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Moyenne</p>
          <p className="mt-1 text-xl font-bold text-text">{formatCurrency(avgAmount)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Par categorie</h3>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map(([cat, amount]) => (
              <span key={cat} className="inline-flex items-center gap-1.5 rounded-full border border-kfm-border bg-bg px-3 py-1.5 text-xs">
                <span className="font-medium text-text">{cat}</span>
                <span className="text-text-3">·</span>
                <span className="font-semibold text-text">{formatCurrency(amount)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher par titre, fournisseur..."
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="rounded-kfm-sm border border-kfm-border bg-surface pl-8 pr-3 py-2 text-xs text-text focus:border-kfm-secondary focus:outline-none"
              />
            </div>
            <span className="text-xs text-text-3">au</span>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="rounded-kfm-sm border border-kfm-border bg-surface pl-8 pr-3 py-2 text-xs text-text focus:border-kfm-secondary focus:outline-none"
              />
            </div>
          </div>
          {(search || fromDate || toDate || categoryFilter) && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
              <X className="h-3 w-3" /> Reinitialiser
            </button>
          )}
        </div>
        {/* Category filter */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-text-3" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); }}
              className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-xs text-text focus:border-kfm-secondary focus:outline-none"
            >
              <option value="">Toutes les categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && expenses.length > 0 && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty */}
      {expenses.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Aucune depense trouvee"
          description="Aucune depense ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser les filtres
            </button>
          }
        />
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      {expenses.length > 0 && (
        <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="grid grid-cols-[0.8fr_1fr_1fr_0.6fr_0.8fr_0.7fr_0.7fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Date</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Titre</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Categorie</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Montant</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Paiement</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Fournisseur</span>
          </div>

          {paginatedExpenses.map((expense, index) => {
            const statusCfg = expenseStatusConfig[expense.status] || { label: expense.status, color: "bg-surface-2 text-text-2 border-kfm-border" };
            const paymentLabel = paymentMethods.find(m => m.value === expense.paymentMethod)?.label || expense.paymentMethod || "—";
            const catName = expense.categoryRelation?.name || expense.category || "Autre";
            const catColor = expense.categoryRelation?.color;

            return (
              <div
                key={expense.id}
                className={cn(
                  "grid grid-cols-[0.8fr_1fr_1fr_0.6fr_0.8fr_0.7fr_0.7fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                  index % 2 === 1 && "bg-bg/40"
                )}
              >
                <span className="text-sm text-text-2 whitespace-nowrap">{formatDate(expense.date)}</span>
                <span className="text-sm text-text truncate">{expense.title || "—"}</span>
                <span className="flex items-center gap-1.5">
                  {catColor && (
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
                  )}
                  <span className="text-sm text-text-2 truncate">{catName}</span>
                </span>
                <span className="text-sm font-semibold text-text text-right">{formatCurrency(expense.amount)}</span>
                <span className="text-xs text-text-3">{paymentLabel}</span>
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusCfg.color)}>
                  {statusCfg.label}
                </span>
                <span className="text-xs text-text-3 truncate">{expense.supplierName || "—"}</span>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
              <span className="text-xs text-text-3">
                {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, expenses.length)} sur {expenses.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>
                      {p}
                    </button>
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

      {/* ── Mobile Cards ────────────────────────────────────────────────── */}
      {expenses.length > 0 && (
        <div className="md:hidden space-y-3">
          {paginatedExpenses.map((expense) => {
            const statusCfg = expenseStatusConfig[expense.status] || { label: expense.status, color: "bg-surface-2 text-text-2 border-kfm-border" };
            const catName = expense.categoryRelation?.name || expense.category || "Autre";

            return (
              <div key={expense.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text">{expense.title || "—"}</p>
                    <p className="text-xs text-text-3">{formatDate(expense.date)}</p>
                  </div>
                  <span className="text-sm font-bold text-text">{formatCurrency(expense.amount)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-3 bg-bg rounded-full px-2 py-0.5">{catName}</span>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusCfg.color)}>
                    {statusCfg.label}
                  </span>
                </div>
                {expense.supplierName && (
                  <p className="text-xs text-text-3 mt-2">Fournisseur: {expense.supplierName}</p>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, expenses.length)} sur {expenses.length}</span>
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
      )}

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter une depense</DialogTitle>
            <DialogDescription className="text-text-2">Remplissez les informations de la depense.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Titre *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: Achat ingredients"
              />
              {formErrors.title && <p className="mt-1 text-xs text-kfm-danger">{formErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Montant (FG) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="0"
                />
                {formErrors.amount && <p className="mt-1 text-xs text-kfm-danger">{formErrors.amount}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                />
                {formErrors.date && <p className="mt-1 text-xs text-kfm-danger">{formErrors.date}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Mode de paiement</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none"
              >
                {paymentMethods.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Fournisseur</label>
              <input
                value={form.supplierName}
                onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Nom du fournisseur"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none resize-none"
                placeholder="Notes supplementaires..."
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Creer la depense
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
