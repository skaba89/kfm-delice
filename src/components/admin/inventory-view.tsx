"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Package, Plus, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, Pencil, Trash2, LayoutGrid, List,
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, RotateCcw, History,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPerUnit: number | null;
  lowStockThreshold: number;
  createdAt: string;
}

interface StockMovement {
  id: string;
  ingredientId: string;
  type: string;
  quantity: number;
  unit: string;
  previousQty: number;
  newQty: number;
  notes: string | null;
  createdAt: string;
  ingredient: { id: string; name: string; unit: string } | null;
}

interface FormData {
  name: string;
  unit: string;
  quantity: string;
  costPerUnit: string;
  lowStockThreshold: string;
}

interface MovementFormData {
  type: "in" | "out" | "adjustment" | "waste";
  quantity: string;
  notes: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const units = ["kg", "g", "L", "mL", "unite", "piece", "botte", "sachet", "litre", "douzaine"];

const movementTypes: { value: MovementFormData["type"]; label: string; icon: React.ElementType; color: string }[] = [
  { value: "in", label: "Entree (reception)", icon: ArrowDownCircle, color: "text-kfm-success" },
  { value: "out", label: "Sortie (utilisation)", icon: ArrowUpCircle, color: "text-kfm-warning" },
  { value: "waste", label: "Perte / Gasillage", icon: AlertTriangle, color: "text-kfm-danger" },
  { value: "adjustment", label: "Ajustement manuel", icon: RotateCcw, color: "text-kfm-info" },
];

const emptyForm = (): FormData => ({
  name: "", unit: "kg", quantity: "0", costPerUnit: "", lowStockThreshold: "5",
});

const emptyMovementForm = (): MovementFormData => ({
  type: "in", quantity: "", notes: "",
});

const PAGE_SIZE = 20;

// ── Component ──────────────────────────────────────────────────────────────

export function AdminInventoryView() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [view, setView] = useState<"grid" | "table">("table");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Stock movement state
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementForm, setMovementForm] = useState<MovementFormData>(emptyMovementForm());
  const [movementErrors, setMovementErrors] = useState<Record<string, string>>({});

  // Stock history state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMovements, setHistoryMovements] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ingredients", {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setIngredients(json.data || []);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const filtered = useMemo(() => {
    let data = [...ingredients];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (lowStockOnly) {
      data = data.filter((i) => i.quantity <= i.lowStockThreshold);
    }
    return data;
  }, [ingredients, search, lowStockOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Summary
  const totalIngredients = ingredients.length;
  const lowStockCount = ingredients.filter(i => i.quantity <= i.lowStockThreshold).length;
  const totalValue = useMemo(() =>
    ingredients.reduce((s, i) => s + (i.quantity * (i.costPerUnit || 0)), 0),
    [ingredients]
  );

  const resetFilters = () => {
    setSearch("");
    setLowStockOnly(false);
    setPage(1);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Requis";
    if (!form.unit.trim()) errors.unit = "Requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name,
          unit: form.unit,
          quantity: form.quantity,
          costPerUnit: form.costPerUnit || null,
          lowStockThreshold: form.lowStockThreshold,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setForm(emptyForm());
        setFormErrors({});
        fetchIngredients();
      } else {
        setFormErrors({ submit: json.error || "Erreur" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedIngredient || !validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name,
          unit: form.unit,
          quantity: form.quantity,
          costPerUnit: form.costPerUnit || null,
          lowStockThreshold: form.lowStockThreshold,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditOpen(false);
        setSelectedIngredient(null);
        setForm(emptyForm());
        setFormErrors({});
        fetchIngredients();
      } else {
        setFormErrors({ submit: json.error || "Erreur" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIngredient) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteOpen(false);
        setSelectedIngredient(null);
        fetchIngredients();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  // ── Stock Movement Handlers ──────────────────────────────────────────────
  const openMovementDialog = (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setMovementForm(emptyMovementForm());
    setMovementErrors({});
    setMovementOpen(true);
  };

  const handleStockMovement = async () => {
    const errors: Record<string, string> = {};
    const qty = parseFloat(movementForm.quantity);
    if (!movementForm.quantity || isNaN(qty) || qty <= 0) {
      errors.quantity = "Quantite invalide";
    }
    if (movementForm.type === "out" && selectedIngredient && qty > selectedIngredient.quantity) {
      errors.quantity = "Quantite insuffisante en stock";
    }
    setMovementErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ingredientId: selectedIngredient!.id,
          type: movementForm.type,
          quantity: movementForm.quantity,
          notes: movementForm.notes || null,
          referenceType: movementForm.type === "in" ? "purchase" : movementForm.type === "out" ? "order" : "adjustment",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMovementOpen(false);
        setSelectedIngredient(null);
        fetchIngredients();
      } else {
        setMovementErrors({ submit: json.error || "Erreur lors du mouvement" });
      }
    } catch {
      setMovementErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Stock History Handler ────────────────────────────────────────────────
  const openHistoryDialog = async (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const res = await fetch(`/api/stock-movements?ingredientId=${ing.id}&limit=30`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setHistoryMovements(json.data || []);
      }
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const getStockLevel = (ing: Ingredient) => {
    if (ing.quantity <= 0) return { label: "Rupture", color: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20", barColor: "bg-kfm-danger" };
    if (ing.quantity <= ing.lowStockThreshold) return { label: "Stock bas", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20", barColor: "bg-kfm-warning" };
    return { label: "En stock", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20", barColor: "bg-kfm-success" };
  };

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case "in": return { label: "Entree", color: "text-kfm-success", bg: "bg-kfm-success/10" };
      case "out": return { label: "Sortie", color: "text-kfm-warning", bg: "bg-kfm-warning/10" };
      case "waste": return { label: "Perte", color: "text-kfm-danger", bg: "bg-kfm-danger/10" };
      case "adjustment": return { label: "Ajustement", color: "text-kfm-info", bg: "bg-kfm-info/10" };
      default: return { label: type, color: "text-text-3", bg: "bg-surface-2" };
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Inventaire</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des ingredients et stocks</p>
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
  if (error && ingredients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Inventaire</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des ingredients et stocks</p>
          </div>
          <button onClick={fetchIngredients} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Inventaire</h2>
          <p className="mt-1 text-sm text-text-2">{totalIngredients} ingredient{totalIngredients !== 1 ? "s" : ""} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-kfm-sm border border-kfm-border overflow-hidden">
            <button onClick={() => setView("table")} className={cn("px-3 py-2 text-xs font-medium transition", view === "table" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("grid")} className={cn("px-3 py-2 text-xs font-medium transition", view === "grid" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Total ingredients</p>
          <p className="mt-1 text-xl font-bold text-text">{totalIngredients}</p>
        </div>
        <div className={cn("rounded-kfm-md border p-4 shadow-sm", lowStockCount > 0 ? "border-kfm-warning/30 bg-kfm-warning/5" : "border-kfm-border bg-surface")}>
          <p className="text-xs font-medium text-text-3 flex items-center gap-1">
            {lowStockCount > 0 && <AlertTriangle className="h-3 w-3 text-kfm-warning" />}
            Stock bas
          </p>
          <p className={cn("mt-1 text-xl font-bold", lowStockCount > 0 ? "text-kfm-warning" : "text-text")}>{lowStockCount}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Valeur totale</p>
          <p className="mt-1 text-xl font-bold text-text">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher un ingredient..."
          />
        </div>
        <button
          onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-kfm-sm border px-3 py-2.5 text-xs font-medium transition",
            lowStockOnly
              ? "border-kfm-warning/30 bg-kfm-warning/10 text-kfm-warning"
              : "border-kfm-border text-text-2 hover:bg-surface-2"
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Stock bas uniquement
        </button>
        {(search || lowStockOnly) && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <EmptyState
          icon={Package}
          title="Aucun ingredient trouve"
          description="Aucun ingredient ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser
            </button>
          }
        />
      )}

      {/* ── Table View ────────────────────────────────────────────────────── */}
      {filtered.length > 0 && view === "table" && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr_1fr_0.6fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Ingredient</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Quantite</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Cout unitaire</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Valeur</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Niveau de stock</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
          </div>

          {paginated.map((ing, index) => {
            const stock = getStockLevel(ing);
            const isLow = ing.quantity <= ing.lowStockThreshold;

            return (
              <div
                key={ing.id}
                className={cn(
                  "grid grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr_1fr_0.6fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                  index % 2 === 1 && "bg-bg/40",
                  isLow && "bg-kfm-warning/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-kfm-sm", isLow ? "bg-kfm-warning/10" : "bg-kfm-secondary/10")}>
                    <Package className={cn("h-4 w-4", isLow ? "text-kfm-warning" : "text-kfm-secondary")} />
                  </div>
                  <span className="text-sm font-medium text-text truncate">{ing.name}</span>
                </div>

                <div className="text-right">
                  <span className={cn("text-sm font-semibold", isLow ? "text-kfm-warning" : "text-text")}>
                    {ing.quantity}
                  </span>
                  <span className="text-xs text-text-3 ml-1">{ing.unit}</span>
                </div>

                <span className="text-sm text-text-2 text-right">{ing.costPerUnit ? formatCurrency(ing.costPerUnit) : "—"}</span>

                <span className="text-sm text-text-2 text-right">{ing.costPerUnit ? formatCurrency(ing.quantity * ing.costPerUnit) : "—"}</span>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", stock.barColor)}
                      style={{ width: `${Math.min(100, (ing.quantity / Math.max(ing.lowStockThreshold * 2, 1)) * 100)}%` }}
                    />
                  </div>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", stock.color)}>
                    {stock.label}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-0.5">
                  <button
                    onClick={() => openMovementDialog(ing)}
                    className="rounded-lg p-1.5 text-text-3 hover:bg-kfm-success/10 hover:text-kfm-success"
                    title="Mouvement de stock"
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openHistoryDialog(ing)}
                    className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text"
                    title="Historique"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIngredient(ing);
                      setForm({ name: ing.name, unit: ing.unit, quantity: String(ing.quantity), costPerUnit: String(ing.costPerUnit || ""), lowStockThreshold: String(ing.lowStockThreshold) });
                      setFormErrors({});
                      setEditOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedIngredient(ing); setDeleteOpen(true); }}
                    className="rounded-lg p-1.5 text-text-3 hover:bg-kfm-danger/10 hover:text-kfm-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
              <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>{p}</button>;
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Grid View ─────────────────────────────────────────────────────── */}
      {filtered.length > 0 && view === "grid" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((ing) => {
              const stock = getStockLevel(ing);
              const isLow = ing.quantity <= ing.lowStockThreshold;

              return (
                <div key={ing.id} className={cn("rounded-kfm-md border bg-surface p-4 shadow-sm transition-all hover:shadow-md", isLow ? "border-kfm-warning/30" : "border-kfm-border hover:border-kfm-secondary/30")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-kfm-sm", isLow ? "bg-kfm-warning/10" : "bg-kfm-secondary/10")}>
                        <Package className={cn("h-4 w-4", isLow ? "text-kfm-warning" : "text-kfm-secondary")} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{ing.name}</p>
                        <p className="text-xs text-text-3">{ing.unit}</p>
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", stock.color)}>
                      {stock.label}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-3">Quantite</span>
                      <span className={cn("font-semibold", isLow ? "text-kfm-warning" : "text-text")}>{ing.quantity} {ing.unit}</span>
                    </div>
                    {ing.costPerUnit && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-text-3">Cout unitaire</span>
                          <span className="text-text-2">{formatCurrency(ing.costPerUnit)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-3">Valeur</span>
                          <span className="font-semibold text-text">{formatCurrency(ing.quantity * ing.costPerUnit)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-kfm-border pt-3">
                    <button onClick={() => openMovementDialog(ing)} className="flex-1 rounded-kfm-sm border border-kfm-border px-3 py-1.5 text-xs font-medium text-text-2 hover:bg-surface-2">
                      Mouvement
                    </button>
                    <button onClick={() => openHistoryDialog(ing)} className="rounded-kfm-sm border border-kfm-border px-3 py-1.5 text-xs font-medium text-text-2 hover:bg-surface-2">
                      <History className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setSelectedIngredient(ing); setForm({ name: ing.name, unit: ing.unit, quantity: String(ing.quantity), costPerUnit: String(ing.costPerUnit || ""), lowStockThreshold: String(ing.lowStockThreshold) }); setFormErrors({}); setEditOpen(true); }} className="rounded-kfm-sm px-3 py-1.5 text-xs font-medium text-text-2 hover:bg-surface-2">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setSelectedIngredient(ing); setDeleteOpen(true); }} className="rounded-kfm-sm px-3 py-1.5 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-2 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>{p}</button>;
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-2 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button>
            </div>
          )}
        </>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter un ingredient</DialogTitle>
            <DialogDescription className="text-text-2">Informations de l&apos;ingredient.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formErrors.submit && <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Nom *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Ex: Tomates" />
              {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Unite *</label>
                <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none">
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Quantite</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Cout unitaire (GNF)</label>
                <input type="number" value={form.costPerUnit} onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="0" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Seuil alerte</label>
                <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleCreate} disabled={submitting} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Modifier l&apos;ingredient</DialogTitle>
            <DialogDescription className="text-text-2">Mettre a jour les informations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formErrors.submit && <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Nom *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" />
              {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Unite *</label>
                <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none">
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Quantite</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Cout unitaire (GNF)</label>
                <input type="number" value={form.costPerUnit} onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Seuil alerte</label>
                <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleEdit} disabled={submitting} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer l&apos;ingredient ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. <strong className="text-text">{selectedIngredient?.name}</strong> sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-kfm-danger text-white hover:bg-kfm-danger/90">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Stock Movement Dialog ─────────────────────────────────────────── */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Mouvement de stock</DialogTitle>
            <DialogDescription className="text-text-2">
              {selectedIngredient?.name} — Stock actuel: <strong className="text-text">{selectedIngredient?.quantity} {selectedIngredient?.unit}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {movementErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{movementErrors.submit}</div>
            )}

            {/* Movement Type Selection */}
            <div>
              <label className="mb-2 block text-xs font-medium text-text-2">Type de mouvement *</label>
              <div className="grid grid-cols-2 gap-2">
                {movementTypes.map((mt) => {
                  const Icon = mt.icon;
                  return (
                    <button
                      key={mt.value}
                      type="button"
                      onClick={() => setMovementForm((f) => ({ ...f, type: mt.value }))}
                      className={cn(
                        "flex items-center gap-2 rounded-kfm-sm border px-3 py-2.5 text-xs font-medium transition text-left",
                        movementForm.type === mt.value
                          ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                          : "border-kfm-border text-text-2 hover:bg-surface-2"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", movementForm.type === mt.value ? mt.color : "text-text-3")} />
                      {mt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">
                Quantite {movementForm.type === "adjustment" ? "(nouvelle valeur absolue)" : ""} *
              </label>
              <input
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder={movementForm.type === "adjustment" ? "Nouvelle quantite" : "Quantite a ajouter/retirer"}
              />
              {movementErrors.quantity && <p className="mt-1 text-xs text-kfm-danger">{movementErrors.quantity}</p>}
              {movementForm.quantity && movementForm.type !== "adjustment" && (
                <p className="mt-1.5 text-[10px] text-text-3">
                  Nouveau stock: {movementForm.type === "in"
                    ? `${selectedIngredient?.quantity || 0} + ${movementForm.quantity} = ${(selectedIngredient?.quantity || 0) + parseFloat(movementForm.quantity)}`
                    : `${selectedIngredient?.quantity || 0} - ${movementForm.quantity} = ${Math.max(0, (selectedIngredient?.quantity || 0) - parseFloat(movementForm.quantity))}`
                  } {selectedIngredient?.unit}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Notes (optionnel)</label>
              <input
                value={movementForm.notes}
                onChange={(e) => setMovementForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: Reception fournisseur, perte, inventaire..."
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setMovementOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleStockMovement} disabled={submitting} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock History Dialog ──────────────────────────────────────────── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text">Historique des mouvements</DialogTitle>
            <DialogDescription className="text-text-2">
              {selectedIngredient?.name} — Derniers mouvements
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-kfm-secondary" />
            </div>
          ) : historyMovements.length > 0 ? (
            <div className="space-y-2 py-2">
              {historyMovements.map((mov) => {
                const typeInfo = getMovementTypeInfo(mov.type);
                const diff = mov.newQty - mov.previousQty;
                return (
                  <div key={mov.id} className="flex items-center gap-3 rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-kfm-sm", typeInfo.bg)}>
                      <span className={cn("text-xs font-bold", typeInfo.color)}>
                        {mov.type === "in" ? "+" : mov.type === "out" || mov.type === "waste" ? "-" : "~"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", typeInfo.color)}>{typeInfo.label}</span>
                        <span className="text-[10px] text-text-3">{formatDateTime(mov.createdAt)}</span>
                      </div>
                      {mov.notes && <p className="text-xs text-text-3 mt-0.5 truncate">{mov.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text">{mov.previousQty} → {mov.newQty}</p>
                      <p className={cn("text-[10px] font-medium", diff >= 0 ? "text-kfm-success" : "text-kfm-danger")}>
                        {diff >= 0 ? "+" : ""}{diff} {mov.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <History className="h-8 w-8 text-text-3" />
              <p className="mt-2 text-sm text-text-3">Aucun mouvement enregistre</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
