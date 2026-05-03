"use client";

import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GlassWater,
  CakeSlice,
  Soup,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { authHeaders } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/kfm-ui/empty-state";

/* ──────────────── Types ──────────────── */
interface MenuItemData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  prepTime?: number | null;
  isAvailable: boolean;
  itemType: string;
  image?: string | null;
  category: string;
  categoryId: string;
  trackInventory: boolean;
  quantity: number | null;
  lowStockThreshold: number | null;
}

interface MenuStockData {
  items: MenuItemData[];
  grouped: Record<string, MenuItemData[]>;
}

type FilterType = "all" | "available" | "unavailable";

const itemTypeLabels: Record<string, string> = {
  food: "Plat",
  drink: "Boisson",
  dessert: "Dessert",
  side: "Accompagnement",
};

const itemTypeIcons: Record<string, React.ReactNode> = {
  food: <UtensilsCrossed className="h-3 w-3" />,
  drink: <GlassWater className="h-3 w-3" />,
  dessert: <CakeSlice className="h-3 w-3" />,
  side: <Soup className="h-3 w-3" />,
};

/* ──────────────── Component ──────────────── */
export function MenuView() {
  const [data, setData] = useState<MenuStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<FilterType>("all");

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/kitchen/menu-stock", {
          headers: authHeaders(),
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="kfm-skeleton h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-kfm-border bg-surface">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="kfm-skeleton h-10 w-10 rounded-kfm-sm" />
                  <div className="flex-1">
                    <div className="kfm-skeleton h-5 w-40" />
                    <div className="kfm-skeleton mt-2 h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Impossible de charger le menu"
        description="Une erreur est survenue. Reessayez plus tard."
      />
    );
  }

  const categories = Object.keys(data.grouped);

  // Filter items
  const filteredGroups: Record<string, MenuItemData[]> = {};
  for (const [cat, items] of Object.entries(data.grouped)) {
    const filtered = items.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
      if (availabilityFilter === "available" && !item.isAvailable) return false;
      if (availabilityFilter === "unavailable" && item.isAvailable) return false;
      if (
        search &&
        !item.name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
    if (filtered.length > 0) {
      filteredGroups[cat] = filtered;
    }
  }

  const totalAvailable = data.items.filter((i) => i.isAvailable).length;
  const totalUnavailable = data.items.filter((i) => !i.isAvailable).length;

  return (
    <div className="space-y-5">
      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <Input
            placeholder="Rechercher un plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-kfm-border bg-surface text-text"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { key: "all", label: `Tous (${data.items.length})` },
              { key: "available", label: `Dispo (${totalAvailable})` },
              { key: "unavailable", label: `Indispo (${totalUnavailable})` },
            ] as { key: FilterType; label: string }[]
          ).map((f) => (
            <Badge
              key={f.key}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                availabilityFilter === f.key
                  ? "bg-kfm-accent/10 border-kfm-accent/30 text-kfm-accent"
                  : "border-kfm-border text-text-2 hover:bg-surface-2"
              }`}
              onClick={() => setAvailabilityFilter(f.key)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={`cursor-pointer transition-colors ${
            categoryFilter === "all"
              ? "bg-kfm-accent/10 border-kfm-accent/30 text-kfm-accent"
              : "border-kfm-border text-text-2 hover:bg-surface-2"
          }`}
          onClick={() => setCategoryFilter("all")}
        >
          Toutes categories
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant="outline"
            className={`cursor-pointer transition-colors ${
              categoryFilter === data.grouped[cat]?.[0]?.categoryId
                ? "bg-kfm-accent/10 border-kfm-accent/30 text-kfm-accent"
                : "border-kfm-border text-text-2 hover:bg-surface-2"
            }`}
            onClick={() =>
              setCategoryFilter(data.grouped[cat]?.[0]?.categoryId || "all")
            }
          >
            {cat} ({data.grouped[cat].length})
          </Badge>
        ))}
      </div>

      {/* Menu items grouped by category */}
      {Object.keys(filteredGroups).length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Aucun article trouve"
          description="Modifiez vos filtres pour voir plus de resultats."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-text">
                {category} ({items.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className={`border-kfm-border transition-shadow hover:shadow-md ${
                      item.isAvailable ? "bg-surface" : "bg-surface/60 opacity-70"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Item icon */}
                        <div
                          className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-kfm-sm ${
                            item.isAvailable
                              ? "bg-kfm-accent/10 text-kfm-accent"
                              : "bg-kfm-danger/10 text-kfm-danger"
                          }`}
                        >
                          {itemTypeIcons[item.itemType] || (
                            <UtensilsCrossed className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold truncate ${
                                item.isAvailable
                                  ? "text-text"
                                  : "text-text-3 line-through"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="gap-1 border-kfm-border text-text-3 text-[10px] px-1.5 py-0"
                            >
                              {itemTypeIcons[item.itemType]}
                              {itemTypeLabels[item.itemType] || item.itemType}
                            </Badge>

                            {item.isAvailable ? (
                              <Badge
                                variant="outline"
                                className="border-kfm-success/30 bg-kfm-success/10 text-kfm-success text-[10px] px-1.5 py-0 gap-0.5"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Disponible
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-kfm-danger/30 bg-kfm-danger/10 text-kfm-danger text-[10px] px-1.5 py-0 gap-0.5"
                              >
                                <XCircle className="h-2.5 w-2.5" />
                                Indisponible
                              </Badge>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-3 text-xs text-text-3">
                            {item.prepTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.prepTime} min
                              </span>
                            )}
                            <span className="font-medium text-text-2">
                              {formatNumber(item.price)} FG
                            </span>
                          </div>

                          {/* Stock info */}
                          {item.trackInventory && item.quantity !== null && (
                            <div className="mt-2 flex items-center gap-1.5">
                              {item.quantity <= (item.lowStockThreshold ?? 5) ? (
                                <AlertTriangle className="h-3 w-3 text-kfm-warning" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-kfm-success" />
                              )}
                              <span
                                className={`text-[10px] font-medium ${
                                  item.quantity <= (item.lowStockThreshold ?? 5)
                                    ? "text-kfm-warning"
                                    : "text-kfm-success"
                                }`}
                              >
                                Stock : {item.quantity}{" "}
                                {item.quantity <= (item.lowStockThreshold ?? 5)
                                  ? "(stock bas)"
                                  : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
