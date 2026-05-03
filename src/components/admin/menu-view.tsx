"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen, Search, RefreshCcw, X, AlertCircle, Eye,
  ChevronDown, ChevronRight, MoreVertical, Loader2,
  UtensilsCrossed, GlassWater, Cake, Salad, Tag, Star,
} from "lucide-react";
import { authHeaders, formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────

interface CategoryItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: number;
  discountPrice: number | null;
  costPrice: number | null;
  calories: number | null;
  prepTime: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  itemType: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  sortOrder: number;
  orderCount: number;
  rating: number;
}

interface CategoryWithItems {
  id: string;
  menuId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  menu: { id: string; name: string; menuType: string };
  items: CategoryItem[];
}

interface RestaurantInfo {
  id: string;
  name: string;
  city: string;
  isOpen: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const ITEM_TYPE_CONFIG: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  food: { label: "Plat", className: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20", Icon: UtensilsCrossed },
  drink: { label: "Boisson", className: "bg-kfm-info/10 text-kfm-info border-kfm-info/20", Icon: GlassWater },
  dessert: { label: "Dessert", className: "bg-kfm-accent/10 text-kfm-accent border-kfm-accent/20", Icon: Cake },
  side: { label: "Accomp.", className: "bg-kfm-success/10 text-kfm-success border-kfm-success/20", Icon: Salad },
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminMenuView() {
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/menu?includeInactive=true", {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setRestaurant(data?.restaurant || null);
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
    fetchMenu();
  }, [fetchMenu]);

  // ── Filtered ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [categories, search]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allItems = categories.flatMap((c) => c.items);
    const totalItems = allItems.length;
    const availableItems = allItems.filter((i) => i.isAvailable).length;
    const activeCategories = categories.filter((c) => c.isActive).length;
    return { totalItems, availableItems, activeCategories };
  }, [categories]);

  // ── Toggle expand ──────────────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Toggle item availability ───────────────────────────────────────────
  const handleToggleItemAvailability = async (item: CategoryItem) => {
    try {
      setTogglingId(item.id);
      const res = await fetch("/api/menu-items", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((i) =>
              i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
            ),
          }))
        );
      }
    } catch {
      /* silent */
    } finally {
      setTogglingId(null);
    }
  };

  // ── Toggle item featured ────────────────────────────────────────────────
  const handleToggleItemFeatured = async (item: CategoryItem) => {
    try {
      setTogglingFeaturedId(item.id);
      const res = await fetch("/api/menu-items", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id: item.id, isFeatured: !item.isFeatured }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((i) =>
              i.id === item.id ? { ...i, isFeatured: !i.isFeatured } : i
            ),
          }))
        );
      }
    } catch {
      /* silent */
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Menus</h2>
          <p className="mt-1 text-sm text-text-2">Gestion globale des menus</p>
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
  if (error && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Menus</h2>
            <p className="mt-1 text-sm text-text-2">Gestion globale des menus</p>
          </div>
          <button
            onClick={fetchMenu}
            className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Menus</h2>
          <p className="mt-1 text-sm text-text-2">
            {categories.length} categorie{categories.length !== 1 ? "s" : ""} · {stats.totalItems} produit{stats.totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchMenu}
          className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
        >
          <RefreshCcw className="h-4 w-4" /> Rafraichir
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Categories" value={String(categories.length)} icon={BookOpen} />
        <StatCard label="Produits actifs" value={String(stats.availableItems)} icon={Tag} changeType="positive" />
        <StatCard label="Total produits" value={String(stats.totalItems)} icon={BookOpen} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher une categorie ou un produit..."
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10"
          >
            <X className="h-3 w-3" /> Reinitialiser
          </button>
        )}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Aucune categorie trouvee"
          description={search ? "Aucun resultat pour votre recherche." : "Aucune categorie n'a encore ete creee."}
          action={
            search ? (
              <button
                onClick={() => setSearch("")}
                className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
              >
                <RefreshCcw className="h-4 w-4" /> Reinitialiser
              </button>
            ) : undefined
          }
        />
      )}

      {/* ── Category List ────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Categorie</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Menu</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Produits</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
          </div>

          {filtered.map((category, index) => {
            const isExpanded = expandedIds.has(category.id);
            const availableCount = category.items.filter((i) => i.isAvailable).length;

            return (
              <div key={category.id} className="border-b border-kfm-border last:border-0">
                {/* Category row */}
                <div
                  className={cn(
                    "grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.5fr] gap-2 items-center px-5 py-3.5 transition-colors hover:bg-surface-2/40",
                    index % 2 === 1 && !isExpanded && "bg-bg/40"
                  )}
                >
                  {/* Name */}
                  <button
                    onClick={() => toggleExpand(category.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-text-3 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-text-3 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-text-3 truncate">{category.description}</p>
                      )}
                    </div>
                  </button>

                  {/* Menu name */}
                  <span className="text-sm text-text-2 truncate">
                    {category.menu?.name || "—"}
                  </span>

                  {/* Items count */}
                  <span className="text-sm text-text-2">
                    {availableCount}/{category.items.length} disponible{availableCount !== 1 ? "s" : ""}
                  </span>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold w-fit",
                      category.isActive
                        ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                        : "bg-kfm-text-3/10 text-text-3 border-kfm-text-3/20"
                    )}
                  >
                    {category.isActive ? "Actif" : "Inactif"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCategory(category);
                            setDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" /> Voir les details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && category.items.length > 0 && (
                  <div className="border-t border-kfm-border bg-bg/40">
                    {/* Item sub-header */}
                    <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-2 px-8 py-2 border-b border-kfm-border/50">
                      <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Produit</span>
                      <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Type</span>
                      <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Prix</span>
                      <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Disponibilite</span>
                      <span className="text-[10px] font-semibold text-text-3 uppercase tracking-wide text-right">Action</span>
                    </div>

                    {category.items.map((item) => {
                      const isToggling = togglingId === item.id;
                      const typeCfg = ITEM_TYPE_CONFIG[item.itemType] || ITEM_TYPE_CONFIG.food;
                      const TypeIcon = typeCfg.Icon;

                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-2 items-center px-8 py-2.5 hover:bg-surface-2/30 transition-colors"
                        >
                          {/* Item name */}
                          <div className="flex items-center gap-2 min-w-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-7 w-7 flex-shrink-0 rounded-kfm-sm object-cover border border-kfm-border"
                              />
                            ) : (
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-kfm-sm bg-surface-2 border border-kfm-border">
                                <TypeIcon className="h-3 w-3 text-text-3" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-text truncate">{item.name}</p>
                                {item.isNew && (
                                  <span className="inline-flex items-center rounded-full bg-kfm-info/10 px-1.5 py-0.5 text-[9px] font-semibold text-kfm-info">
                                    Nouveau
                                  </span>
                                )}
                                {item.isFeatured && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-kfm-accent/10 px-1.5 py-0.5 text-[9px] font-semibold text-kfm-accent">
                                    <Star className="h-2.5 w-2.5" /> Vedette
                                  </span>
                                )}
                                {item.isPopular && (
                                  <span className="inline-flex items-center rounded-full bg-kfm-warning/10 px-1.5 py-0.5 text-[9px] font-semibold text-kfm-warning">
                                    Populaire
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Type badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold w-fit",
                              typeCfg.className
                            )}
                          >
                            <TypeIcon className="h-2.5 w-2.5" />
                            {typeCfg.label}
                          </span>

                          {/* Price */}
                          <div className="text-sm text-text">
                            {item.discountPrice && item.discountPrice < item.price ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-kfm-success">
                                  {formatCurrency(item.discountPrice)}
                                </span>
                                <span className="text-[10px] text-text-3 line-through">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium">{formatCurrency(item.price)}</span>
                            )}
                          </div>

                          {/* Availability toggle */}
                          <button
                            onClick={() => handleToggleItemAvailability(item)}
                            disabled={isToggling}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold w-fit transition",
                              item.isAvailable
                                ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20 hover:bg-kfm-success/20"
                                : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20 hover:bg-kfm-danger/20"
                            )}
                          >
                            {isToggling ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  item.isAvailable ? "bg-kfm-success" : "bg-kfm-danger"
                                )}
                              />
                            )}
                            {item.isAvailable ? "Disponible" : "Indisponible"}
                          </button>

                          {/* Detail action */}
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="rounded-lg p-1 text-text-3 hover:bg-surface-2 hover:text-text">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleToggleItemFeatured(item)} disabled={togglingFeaturedId === item.id}>
                                  {togglingFeaturedId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Star className="h-3.5 w-3.5 mr-2" />}
                                  {item.isFeatured ? "Retirer des vedettes" : "Ajouter aux vedettes"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleItemAvailability(item)}>
                                  {item.isAvailable ? "Rendre indisponible" : "Rendre disponible"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expanded but no items */}
                {isExpanded && category.items.length === 0 && (
                  <div className="border-t border-kfm-border bg-bg/40 px-5 py-4 text-center">
                    <p className="text-xs text-text-3">Aucun produit dans cette categorie</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedCategory && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{selectedCategory.name}</DialogTitle>
                <DialogDescription className="text-text-2">@{selectedCategory.slug}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Menu parent</p>
                    <p className="mt-1 text-sm font-medium text-text">{selectedCategory.menu?.name || "—"}</p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <p
                      className={cn(
                        "mt-1 text-sm font-medium",
                        selectedCategory.isActive ? "text-kfm-success" : "text-kfm-danger"
                      )}
                    >
                      {selectedCategory.isActive ? "Actif" : "Inactif"}
                    </p>
                  </div>
                </div>

                {selectedCategory.description && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3 mb-1">Description</p>
                    <p className="text-sm text-text-2">{selectedCategory.description}</p>
                  </div>
                )}

                {/* Items list */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                  <p className="text-xs text-text-3 mb-3">
                    Produits ({selectedCategory.items.length})
                  </p>
                  {selectedCategory.items.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedCategory.items.map((item) => {
                        const typeCfg = ITEM_TYPE_CONFIG[item.itemType] || ITEM_TYPE_CONFIG.food;
                        const TypeIcon = typeCfg.Icon;
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center gap-3 rounded-kfm-sm border border-kfm-border bg-surface p-2.5",
                              !item.isAvailable && "opacity-60"
                            )}
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                              <TypeIcon className="h-4 w-4 text-kfm-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-text truncate">{item.name}</p>
                                {item.isNew && (
                                  <span className="inline-flex items-center rounded-full bg-kfm-info/10 px-1 py-0 text-[9px] font-semibold text-kfm-info">
                                    N
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn("inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[9px] font-semibold", typeCfg.className)}>
                                  {typeCfg.label}
                                </span>
                                <span className="text-[10px] text-text-3">
                                  {item.discountPrice && item.discountPrice < item.price
                                    ? `${formatCurrency(item.discountPrice)} (↓ ${formatCurrency(item.price)})`
                                    : formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold flex-shrink-0",
                                item.isAvailable
                                  ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                                  : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  item.isAvailable ? "bg-kfm-success" : "bg-kfm-danger"
                                )}
                              />
                              {item.isAvailable ? "Dispo" : "Indispo"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-3 text-center py-3">Aucun produit</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
