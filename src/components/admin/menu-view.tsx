"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen, Search, RefreshCcw, X, AlertCircle, Eye,
  ChevronDown, ChevronRight, MoreVertical, Loader2,
  UtensilsCrossed, GlassWater, Cake, Salad, Tag, Star,
  Plus, Pencil, Trash2, Save, FolderPlus,
} from "lucide-react";
import { authHeaders, formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { toast } from "@/hooks/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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

/** Shape used by the item create/edit form */
interface ItemFormData {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  costPrice: string;
  itemType: string;
  prepTime: string;
  calories: string;
  sortOrder: string;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
}

/** Shape used by the category create/edit form */
interface CategoryFormData {
  id?: string;
  menuId: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY_ITEM_FORM: ItemFormData = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  costPrice: "",
  itemType: "food",
  prepTime: "",
  calories: "",
  sortOrder: "0",
  image: "",
  isAvailable: true,
  isFeatured: false,
  isPopular: false,
  isNew: false,
};

const EMPTY_CATEGORY_FORM: CategoryFormData = {
  menuId: "",
  name: "",
  description: "",
  isActive: true,
};

// ── Constants ──────────────────────────────────────────────────────────────

const ITEM_TYPE_CONFIG: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  food: { label: "Plat", className: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20", Icon: UtensilsCrossed },
  drink: { label: "Boisson", className: "bg-kfm-info/10 text-kfm-info border-kfm-info/20", Icon: GlassWater },
  dessert: { label: "Dessert", className: "bg-kfm-accent/10 text-kfm-accent border-kfm-accent/20", Icon: Cake },
  side: { label: "Accomp.", className: "bg-kfm-success/10 text-kfm-success border-kfm-success/20", Icon: Salad },
};

const ITEM_TYPE_OPTIONS = [
  { value: "food", label: "Plat" },
  { value: "drink", label: "Boisson" },
  { value: "dessert", label: "Dessert" },
  { value: "side", label: "Accompagnement" },
];

// ── Component ──────────────────────────────────────────────────────────────

export function AdminMenuView() {
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Detail dialog (existing)
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);

  // Toggling states (existing)
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  // ── Item form dialog ─────────────────────────────────────────────────────
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormData>(EMPTY_ITEM_FORM);
  const [itemSaving, setItemSaving] = useState(false);

  // ── Delete item dialog ───────────────────────────────────────────────────
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [deleteItemTarget, setDeleteItemTarget] = useState<CategoryItem | null>(null);
  const [deleteItemSaving, setDeleteItemSaving] = useState(false);

  // ── Category form dialog ─────────────────────────────────────────────────
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(EMPTY_CATEGORY_FORM);
  const [categorySaving, setCategorySaving] = useState(false);

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

  // ── Helpers: open item dialog for create / edit ────────────────────────
  const openCreateItemDialog = (categoryId?: string) => {
    setItemForm({ ...EMPTY_ITEM_FORM, categoryId: categoryId || "" });
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (item: CategoryItem) => {
    setItemForm({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      discountPrice: item.discountPrice != null ? String(item.discountPrice) : "",
      costPrice: item.costPrice != null ? String(item.costPrice) : "",
      itemType: item.itemType,
      prepTime: item.prepTime != null ? String(item.prepTime) : "",
      calories: item.calories != null ? String(item.calories) : "",
      sortOrder: String(item.sortOrder),
      image: item.image || "",
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      isPopular: item.isPopular,
      isNew: item.isNew,
    });
    setItemDialogOpen(true);
  };

  // ── Save item (create or update) ───────────────────────────────────────
  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      toast({ title: "Champ requis", description: "Le nom du produit est obligatoire.", variant: "destructive" });
      return;
    }
    if (!itemForm.price || Number(itemForm.price) <= 0) {
      toast({ title: "Champ requis", description: "Le prix doit etre superieur a 0.", variant: "destructive" });
      return;
    }
    if (!itemForm.categoryId) {
      toast({ title: "Champ requis", description: "Veuillez selectionner une categorie.", variant: "destructive" });
      return;
    }

    try {
      setItemSaving(true);
      const isEditing = !!itemForm.id;
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        categoryId: itemForm.categoryId,
        name: itemForm.name.trim(),
        price: Number(itemForm.price),
        description: itemForm.description.trim() || null,
        discountPrice: itemForm.discountPrice ? Number(itemForm.discountPrice) : null,
        costPrice: itemForm.costPrice ? Number(itemForm.costPrice) : null,
        itemType: itemForm.itemType,
        prepTime: itemForm.prepTime ? Number(itemForm.prepTime) : null,
        calories: itemForm.calories ? Number(itemForm.calories) : null,
        sortOrder: Number(itemForm.sortOrder) || 0,
        image: itemForm.image.trim() || null,
        isAvailable: itemForm.isAvailable,
        isFeatured: itemForm.isFeatured,
        isPopular: itemForm.isPopular,
        isNew: itemForm.isNew,
      };
      if (isEditing) body.id = itemForm.id;

      const res = await fetch("/api/menu-items", {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        toast({
          title: isEditing ? "Produit modifie" : "Produit cree",
          description: `"${itemForm.name}" a ete ${isEditing ? "modifie" : "ajoute"} avec succes.`,
        });
        setItemDialogOpen(false);
        fetchMenu();
      } else {
        toast({
          title: "Erreur",
          description: json.error || `Impossible de ${isEditing ? "modifier" : "creer"} le produit.`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur reseau",
        description: "Une erreur est survenue. Veuillez reessayer.",
        variant: "destructive",
      });
    } finally {
      setItemSaving(false);
    }
  };

  // ── Delete item ────────────────────────────────────────────────────────
  const confirmDeleteItem = (item: CategoryItem) => {
    setDeleteItemTarget(item);
    setDeleteItemOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!deleteItemTarget) return;
    try {
      setDeleteItemSaving(true);
      const res = await fetch(`/api/menu-items?id=${deleteItemTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();

      if (json.success) {
        toast({
          title: "Produit supprime",
          description: `"${deleteItemTarget.name}" a ete supprime avec succes.`,
        });
        setDeleteItemOpen(false);
        setDeleteItemTarget(null);
        fetchMenu();
      } else {
        toast({
          title: "Erreur",
          description: json.error || "Impossible de supprimer le produit.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur reseau",
        description: "Une erreur est survenue. Veuillez reessayer.",
        variant: "destructive",
      });
    } finally {
      setDeleteItemSaving(false);
    }
  };

  // ── Helpers: open category dialog for create / edit ────────────────────
  const openCreateCategoryDialog = () => {
    // Use the first category's menuId if available, otherwise empty
    const menuId = categories.length > 0 ? categories[0].menuId : "";
    setCategoryForm({ ...EMPTY_CATEGORY_FORM, menuId });
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: CategoryWithItems) => {
    setCategoryForm({
      id: category.id,
      menuId: category.menuId,
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setCategoryDialogOpen(true);
  };

  // ── Save category (create or update) ───────────────────────────────────
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Champ requis", description: "Le nom de la categorie est obligatoire.", variant: "destructive" });
      return;
    }

    try {
      setCategorySaving(true);
      const isEditing = !!categoryForm.id;
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        menuId: categoryForm.menuId,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        isActive: categoryForm.isActive,
      };
      if (isEditing) body.id = categoryForm.id;

      const res = await fetch("/api/menu-categories", {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        toast({
          title: isEditing ? "Categorie modifiee" : "Categorie creee",
          description: `"${categoryForm.name}" a ete ${isEditing ? "modifiee" : "ajoutee"} avec succes.`,
        });
        setCategoryDialogOpen(false);
        fetchMenu();
      } else {
        toast({
          title: "Erreur",
          description: json.error || `Impossible de ${isEditing ? "modifier" : "creer"} la categorie.`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur reseau",
        description: "Une erreur est survenue. Veuillez reessayer.",
        variant: "destructive",
      });
    } finally {
      setCategorySaving(false);
    }
  };

  // ── Item form field updater ────────────────────────────────────────────
  const updateItemField = <K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) => {
    setItemForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Category form field updater ────────────────────────────────────────
  const updateCategoryField = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
    setCategoryForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Item form boolean updater (for Switch onCheckedChange) ─────────────
  const updateItemFormBool = (key: "isAvailable" | "isFeatured" | "isPopular" | "isNew", value: boolean) => {
    setItemForm((prev) => ({ ...prev, [key]: value }));
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
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateCategoryDialog}
            className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
          >
            <FolderPlus className="h-4 w-4" /> Ajouter une categorie
          </button>
          <button
            onClick={() => openCreateItemDialog()}
            className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Ajouter un produit
          </button>
          <button
            onClick={fetchMenu}
            className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
          >
            <RefreshCcw className="h-4 w-4" /> Rafraichir
          </button>
        </div>
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
                        <DropdownMenuItem
                          onClick={() => openEditCategoryDialog(category)}
                        >
                          <Pencil className="h-4 w-4" /> Modifier la categorie
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openCreateItemDialog(category.id)}
                        >
                          <Plus className="h-4 w-4" /> Ajouter un produit
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
                                <DropdownMenuItem onClick={() => openEditItemDialog(item)}>
                                  <Pencil className="h-3.5 w-3.5" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleItemFeatured(item)} disabled={togglingFeaturedId === item.id}>
                                  {togglingFeaturedId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Star className="h-3.5 w-3.5 mr-2" />}
                                  {item.isFeatured ? "Retirer des vedettes" : "Ajouter aux vedettes"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleItemAvailability(item)}>
                                  {item.isAvailable ? "Rendre indisponible" : "Rendre disponible"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => confirmDeleteItem(item)}
                                  className="text-kfm-danger focus:text-kfm-danger"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
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
                    <p className="text-xs text-text-3 mb-3">Aucun produit dans cette categorie</p>
                    <button
                      onClick={() => openCreateItemDialog(category.id)}
                      className="inline-flex items-center gap-1.5 rounded-kfm-sm bg-kfm-secondary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      <Plus className="h-3 w-3" /> Ajouter un produit
                    </button>
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

      {/* ── Item Create / Edit Dialog ──────────────────────────────────────── */}
      <Dialog open={itemDialogOpen} onOpenChange={(open) => { if (!open) setItemDialogOpen(false); }}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text">
              {itemForm.id ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
            <DialogDescription className="text-text-2">
              {itemForm.id ? "Modifiez les informations du produit." : "Remplissez les informations du nouveau produit."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Row: Name + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">
                  Nom <span className="text-kfm-danger">*</span>
                </Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => updateItemField("name", e.target.value)}
                  placeholder="Nom du produit"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-category">
                  Categorie <span className="text-kfm-danger">*</span>
                </Label>
                <Select
                  value={itemForm.categoryId}
                  onValueChange={(val) => updateItemField("categoryId", val)}
                >
                  <SelectTrigger className="w-full bg-bg border-kfm-border text-text">
                    <SelectValue placeholder="Selectionner une categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={itemForm.description}
                onChange={(e) => updateItemField("description", e.target.value)}
                placeholder="Description du produit (optionnel)"
                rows={3}
                className="bg-bg border-kfm-border text-text"
              />
            </div>

            {/* Row: Price + Discount Price + Cost Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">
                  Prix (GNF) <span className="text-kfm-danger">*</span>
                </Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => updateItemField("price", e.target.value)}
                  placeholder="0"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-discount-price">Prix promo (GNF)</Label>
                <Input
                  id="item-discount-price"
                  type="number"
                  min="0"
                  value={itemForm.discountPrice}
                  onChange={(e) => updateItemField("discountPrice", e.target.value)}
                  placeholder="Optionnel"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-cost-price">Prix de revient (GNF)</Label>
                <Input
                  id="item-cost-price"
                  type="number"
                  min="0"
                  value={itemForm.costPrice}
                  onChange={(e) => updateItemField("costPrice", e.target.value)}
                  placeholder="Optionnel"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>
            </div>

            {/* Row: Item Type + Prep Time + Calories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-type">Type de produit</Label>
                <Select
                  value={itemForm.itemType}
                  onValueChange={(val) => updateItemField("itemType", val)}
                >
                  <SelectTrigger className="w-full bg-bg border-kfm-border text-text">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-preptime">Temps de preparation (min)</Label>
                <Input
                  id="item-preptime"
                  type="number"
                  min="0"
                  value={itemForm.prepTime}
                  onChange={(e) => updateItemField("prepTime", e.target.value)}
                  placeholder="Minutes"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-calories">Calories (kcal)</Label>
                <Input
                  id="item-calories"
                  type="number"
                  min="0"
                  value={itemForm.calories}
                  onChange={(e) => updateItemField("calories", e.target.value)}
                  placeholder="kcal"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>
            </div>

            {/* Row: Sort Order + Image URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-sort-order">Ordre d'affichage</Label>
                <Input
                  id="item-sort-order"
                  type="number"
                  min="0"
                  value={itemForm.sortOrder}
                  onChange={(e) => updateItemField("sortOrder", e.target.value)}
                  placeholder="0"
                  className="bg-bg border-kfm-border text-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-image">URL de l'image</Label>
                <Input
                  id="item-image"
                  type="url"
                  value={itemForm.image}
                  onChange={(e) => updateItemField("image", e.target.value)}
                  placeholder="https://..."
                  className="bg-bg border-kfm-border text-text"
                />
              </div>
            </div>

            {/* Toggle switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="item-available" className="cursor-pointer">Disponible</Label>
                <Switch
                  id="item-available"
                  checked={itemForm.isAvailable}
                  onCheckedChange={(checked) => updateItemFormBool("isAvailable", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="item-featured" className="cursor-pointer">Vedette</Label>
                <Switch
                  id="item-featured"
                  checked={itemForm.isFeatured}
                  onCheckedChange={(checked) => updateItemFormBool("isFeatured", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="item-popular" className="cursor-pointer">Populaire</Label>
                <Switch
                  id="item-popular"
                  checked={itemForm.isPopular}
                  onCheckedChange={(checked) => updateItemFormBool("isPopular", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="item-new" className="cursor-pointer">Nouveau</Label>
                <Switch
                  id="item-new"
                  checked={itemForm.isNew}
                  onCheckedChange={(checked) => updateItemFormBool("isNew", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setItemDialogOpen(false)}
              className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2 transition"
              disabled={itemSaving}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              disabled={itemSaving}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {itemSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {itemSaving ? "Enregistrement..." : itemForm.id ? "Modifier" : "Creer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Item AlertDialog ────────────────────────────────────────── */}
      <AlertDialog open={deleteItemOpen} onOpenChange={(open) => { if (!open) { setDeleteItemOpen(false); setDeleteItemTarget(null); } }}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Etes-vous sur de vouloir supprimer{" "}
              <span className="font-semibold text-text">{deleteItemTarget?.name}</span> ?
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={deleteItemSaving}
              className="border-kfm-border text-text-2 hover:bg-surface-2"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={deleteItemSaving}
              className="bg-kfm-danger text-white hover:bg-kfm-danger/90"
            >
              {deleteItemSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Category Create / Edit Dialog ──────────────────────────────────── */}
      <Dialog open={categoryDialogOpen} onOpenChange={(open) => { if (!open) setCategoryDialogOpen(false); }}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">
              {categoryForm.id ? "Modifier la categorie" : "Ajouter une categorie"}
            </DialogTitle>
            <DialogDescription className="text-text-2">
              {categoryForm.id ? "Modifiez les informations de la categorie." : "Remplissez les informations de la nouvelle categorie."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Menu selector (only for create) */}
            {!categoryForm.id && categories.length > 0 && (
              <div className="space-y-2">
                <Label>Menu parent</Label>
                <Select
                  value={categoryForm.menuId}
                  onValueChange={(val) => updateCategoryField("menuId", val)}
                >
                  <SelectTrigger className="w-full bg-bg border-kfm-border text-text">
                    <SelectValue placeholder="Selectionner un menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Map(categories.map((c) => [c.menuId, c.menu])).values()
                    ).map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Nom <span className="text-kfm-danger">*</span>
              </Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => updateCategoryField("name", e.target.value)}
                placeholder="Nom de la categorie"
                className="bg-bg border-kfm-border text-text"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                value={categoryForm.description}
                onChange={(e) => updateCategoryField("description", e.target.value)}
                placeholder="Description (optionnel)"
                rows={3}
                className="bg-bg border-kfm-border text-text"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="cat-active" className="cursor-pointer">Categorie active</Label>
              <Switch
                id="cat-active"
                checked={categoryForm.isActive}
                onCheckedChange={(checked) => updateCategoryField("isActive", checked)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setCategoryDialogOpen(false)}
              className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2 transition"
              disabled={categorySaving}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveCategory}
              disabled={categorySaving}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {categorySaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {categorySaving ? "Enregistrement..." : categoryForm.id ? "Modifier" : "Creer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
