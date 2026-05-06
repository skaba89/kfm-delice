"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Apple, Search, RefreshCcw, AlertCircle, Flame, Leaf, Wheat,
  AlertTriangle, UtensilsCrossed, Info, X,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  calories: number | null;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  allergens: string | string[] | null;
  category?: { id: string; name: string } | null;
}

type DietFilter = "all" | "vegetarian" | "vegan" | "halal" | "gluten-free" | "no-allergens";

const DIETARY_FLAGS: Record<string, { key: string; label: string; icon: React.ReactNode; color: string }> = {
  vegetarian: { key: "vegetarian", label: "Vegetarien", icon: <Leaf className="h-3 w-3" />, color: "bg-green-500/10 text-green-600" },
  vegan: { key: "vegan", label: "Vegan", icon: <Leaf className="h-3 w-3" />, color: "bg-emerald-500/10 text-emerald-600" },
  halal: { key: "halal", label: "Halal", icon: <Wheat className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-600" },
  "gluten-free": { key: "gluten-free", label: "Sans gluten", icon: <Wheat className="h-3 w-3" />, color: "bg-amber-500/10 text-amber-600" },
  spicy: { key: "spicy", label: "Piquant", icon: <Flame className="h-3 w-3" />, color: "bg-red-500/10 text-red-600" },
};

const FILTER_PILLS: { key: DietFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "vegetarian", label: "Vegetarien" },
  { key: "vegan", label: "Vegan" },
  { key: "halal", label: "Halal" },
  { key: "gluten-free", label: "Sans gluten" },
  { key: "no-allergens", label: "Sans allergenes" },
];

// ── Component ──────────────────────────────────────────────────────────────

export function AdminNutritionView() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/menu-items?limit=500", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const parseAllergens = (allergens: string | string[] | null): string[] => {
    if (!allergens) return [];
    if (Array.isArray(allergens)) return allergens;
    if (typeof allergens !== 'string') return [];
    try {
      const parsed = JSON.parse(allergens);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return allergens.split(",").map((s) => s.trim()).filter(Boolean);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      let matchDiet = true;
      switch (dietFilter) {
        case "vegetarian": matchDiet = item.isVegetarian; break;
        case "vegan": matchDiet = item.isVegan; break;
        case "halal": matchDiet = item.isHalal; break;
        case "gluten-free": matchDiet = item.isGlutenFree; break;
        case "no-allergens": matchDiet = parseAllergens(item.allergens).length === 0; break;
      }
      return matchSearch && matchDiet;
    });
  }, [items, search, dietFilter]);

  const stats = useMemo(() => {
    const vegetarian = items.filter((i) => i.isVegetarian).length;
    const withCalories = items.filter((i) => i.calories && i.calories > 0);
    const avgCalories = withCalories.length > 0
      ? Math.round(withCalories.reduce((s, i) => s + (i.calories || 0), 0) / withCalories.length)
      : 0;
    return { total: items.length, vegetarian, avgCalories };
  }, [items]);

  const getItemFlags = (item: MenuItem) => {
    return Object.values(DIETARY_FLAGS).filter((f) => {
      if (f.key === "vegetarian") return item.isVegetarian;
      if (f.key === "vegan") return item.isVegan;
      if (f.key === "halal") return item.isHalal;
      if (f.key === "gluten-free") return item.isGlutenFree;
      if (f.key === "spicy") return item.isSpicy;
      return false;
    });
  };

  const getCalorieColor = (cal: number | null) => {
    if (!cal) return "";
    if (cal > 800) return "bg-kfm-danger/10 text-kfm-danger";
    if (cal > 500) return "bg-kfm-warning/10 text-kfm-warning";
    return "bg-kfm-success/10 text-kfm-success";
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold tracking-tight text-text">Nutrition</h2><p className="mt-1 text-sm text-text-2">Informations nutritionnelles</p></div>
        <div className="grid gap-4 sm:grid-cols-3"><SkeletonTable /><SkeletonTable /><SkeletonTable /></div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold tracking-tight text-text">Nutrition</h2><p className="mt-1 text-sm text-text-2">Informations nutritionnelles</p></div>
          <button onClick={fetchItems} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"><RefreshCcw className="h-4 w-4" /> Reessayer</button>
        </div>
        <div className="rounded-kfm-md border border-kfm-danger/30 bg-kfm-danger/5 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-kfm-danger" />
          <p className="mt-3 text-sm font-medium text-kfm-danger">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Nutrition</h2>
          <p className="mt-1 text-sm text-text-2">Informations nutritionnelles des plats</p>
        </div>
        <button onClick={fetchItems} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
          <RefreshCcw className="h-4 w-4" /> Rafraichir
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total items" value={formatNumber(stats.total)} icon={UtensilsCrossed} />
        <StatCard label="Vegetarien" value={formatNumber(stats.vegetarian)} icon={Leaf} className="border-l-4 border-l-green-500" />
        <StatCard label="Calories moyennes" value={`${formatNumber(stats.avgCalories)} kcal`} icon={Apple} className="border-l-4 border-l-orange-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher un article..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {FILTER_PILLS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDietFilter(f.key)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", dietFilter === f.key ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Table */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Apple}
          title="Aucun article trouve"
          description="Aucun article ne correspond a vos criteres."
          action={<button onClick={() => { setSearch(""); setDietFilter("all"); }} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Reinitialiser</button>}
        />
      ) : (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          {/* Desktop header */}
          <div className="hidden lg:grid grid-cols-[1.2fr_0.6fr_0.5fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.8fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase">Nom</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Calories</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Vegetarien</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Vegan</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Halal</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Sans gluten</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Piquant</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Allergenes</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredItems.map((item) => {
              const flags = getItemFlags(item);
              const allergens = parseAllergens(item.allergens);
              return (
                <button
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  className="w-full text-left lg:grid lg:grid-cols-[1.2fr_0.6fr_0.5fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr_0.8fr] gap-2 items-center border-b border-kfm-border px-5 py-3 hover:bg-surface-2/40 last:border-0 transition-colors"
                >
                  {/* Name */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary">{item.name.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{item.name}</p>
                      <p className="lg:hidden text-xs text-text-3">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  {/* Calories */}
                  <div className="text-center hidden lg:block">
                    {item.calories ? (
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", getCalorieColor(item.calories))}>
                        <Apple className="h-3 w-3" />{formatNumber(item.calories)}
                      </span>
                    ) : <span className="text-xs text-text-3">\u2014</span>}
                  </div>
                  {/* Dietary flags */}
                  <div className="text-center hidden lg:block">
                    {item.isVegetarian ? <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-600"><Leaf className="h-3 w-3" />Oui</span> : <span className="text-xs text-text-3">Non</span>}
                  </div>
                  <div className="text-center hidden lg:block">
                    {item.isVegan ? <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600"><Leaf className="h-3 w-3" />Oui</span> : <span className="text-xs text-text-3">Non</span>}
                  </div>
                  <div className="text-center hidden lg:block">
                    {item.isHalal ? <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600"><Wheat className="h-3 w-3" />Oui</span> : <span className="text-xs text-text-3">Non</span>}
                  </div>
                  <div className="text-center hidden lg:block">
                    {item.isGlutenFree ? <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600"><Wheat className="h-3 w-3" />Oui</span> : <span className="text-xs text-text-3">Non</span>}
                  </div>
                  <div className="text-center hidden lg:block">
                    {item.isSpicy ? <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-600"><Flame className="h-3 w-3" />Oui</span> : <span className="text-xs text-text-3">Non</span>}
                  </div>
                  {/* Allergens */}
                  <div className="hidden lg:flex flex-wrap items-center gap-1">
                    {allergens.length > 0 ? allergens.slice(0, 2).map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-0.5 rounded-full bg-kfm-danger/10 px-2 py-0.5 text-[10px] font-medium text-kfm-danger">
                        <AlertTriangle className="h-3 w-3" />{a}
                      </span>
                    )) : <span className="text-xs text-text-3">Aucun</span>}
                    {allergens.length > 2 && <span className="text-[10px] text-text-3">+{allergens.length - 2}</span>}
                  </div>
                  {/* Mobile row */}
                  <div className="lg:hidden flex items-center justify-between mt-2">
                    <div className="flex flex-wrap gap-1">
                      {flags.map((f) => (
                        <span key={f.key} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", f.color)}>{f.icon}{f.label}</span>
                      ))}
                    </div>
                    {item.calories ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", getCalorieColor(item.calories))}>{formatNumber(item.calories)} kcal</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{detailItem.name}</DialogTitle>
                <DialogDescription className="text-text-2">{detailItem.category?.name || "Sans categorie"} &middot; {formatCurrency(detailItem.price)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {detailItem.description && (
                  <p className="text-sm text-text-2">{detailItem.description}</p>
                )}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-3">Calories</span>
                    {detailItem.calories ? (
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", getCalorieColor(detailItem.calories))}>{formatNumber(detailItem.calories)} kcal</span>
                    ) : <span className="text-text-3">\u2014</span>}
                  </div>
                  <div className="border-t border-kfm-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-text-3 uppercase mb-2">Regimes alimentaires</p>
                    <div className="flex flex-wrap gap-2">
                      {getItemFlags(detailItem).map((f) => (
                        <span key={f.key} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", f.color)}>{f.icon}{f.label}</span>
                      ))}
                      {getItemFlags(detailItem).length === 0 && <span className="text-xs text-text-3">Aucun regime particulier</span>}
                    </div>
                  </div>
                  <div className="border-t border-kfm-border pt-3">
                    <p className="text-xs font-semibold text-text-3 uppercase mb-2">Allergenes</p>
                    {parseAllergens(detailItem.allergens).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {parseAllergens(detailItem.allergens).map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-kfm-danger/10 px-2.5 py-1 text-xs font-medium text-kfm-danger">
                            <AlertTriangle className="h-3 w-3" />{a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-kfm-success font-medium">Aucun allergene declare</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Read-only notice */}
      <div className="rounded-kfm-md border border-kfm-info/30 bg-kfm-info/5 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-kfm-info flex-shrink-0 mt-0.5" />
        <p className="text-sm text-kfm-info">Les informations nutritionnelles sont gerees depuis le module Menu. Modifiez-y les articles pour mettre a jour ces donnees.</p>
      </div>
    </div>
  );
}
