"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Flame,
  Leaf,
  Sparkles,
  Clock,
  ChevronRight,
  UtensilsCrossed,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { MenuCardSkeleton } from "@/components/ui/loading-patterns";
import { addToCart, getCartCount, getCartSubtotal, getCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ──────────────── Image helpers ──────────────── */

const SLUG_IMAGE_MAP: Record<string, string> = {
  thieboudienne: "/images/menu/thieboudienne.png",
  "thieboudienne-poisson": "/images/menu/thieboudienne.png",
  "yassa-poulet": "/images/menu/yassa-poulet.png",
  mafe: "/images/menu/mafe.png",
  "poulet-brase": "/images/menu/poulet-brase.png",
  "brochette-boeuf": "/images/menu/brochette-boeuf.png",
  "poisson-grille": "/images/menu/poisson-grille.png",
  bissap: "/images/menu/bissap.png",
  gingembre: "/images/menu/gingembre.png",
  ataya: "/images/menu/ataya.png",
  thiakry: "/images/menu/thiakry.png",
  alloco: "/images/menu/alloco.png",
  accra: "/images/menu/accra.png",
  "riz-blanc": "/images/menu/riz-blanc.png",
  "banane-flambee": "/images/menu/banane-flambee.png",
  "salade-guineenne": "/images/menu/salade-guineenne.png",
};

const ITEM_EMOJI_MAP: Record<string, string> = {
  food: "🍽️",
  side: "🥗",
  drink: "🥤",
  dessert: "🍮",
};

function getItemImage(item: MenuItemData): string | null {
  // Priority: item.image from API > slug mapping
  if (item.image) return item.image;
  return SLUG_IMAGE_MAP[item.slug] || null;
}

/* ──────────────── Banner Carousel ──────────────── */

const BANNER_IMAGES = [
  "/images/banner/banner1.png",
  "/images/banner/banner2.png",
  "/images/banner/banner3.png",
];

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goTo = (index: number) => {
    setCurrent(index);
    startTimer(); // reset timer on manual navigation
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-48 md:h-64 lg:h-72">
      {/* Slides */}
      {BANNER_IMAGES.map((src, idx) => (
        <div
          key={src}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={src}
            alt={`KFM Delice banner ${idx + 1}`}
            fill
            className="object-cover"
            priority={idx === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Text overlay */}
      <div className="absolute inset-0 z-30 flex flex-col justify-end p-5 md:p-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl tracking-tight">
          KFM Delice
        </h1>
        <p className="mt-1 text-sm text-white/80 md:text-base lg:text-lg">
          Cuisine guineenne authentique
        </p>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {BANNER_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Aller au bannière ${idx + 1}`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              idx === current
                ? "w-6 bg-white"
                : "w-2 bg-white/50 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────── Placeholder image ──────────────── */

function PlaceholderImage({ item }: { item: MenuItemData }) {
  const emoji = ITEM_EMOJI_MAP[item.itemType] || "🍽️";
  const letter = item.name.charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-kfm-secondary/20 to-kfm-accent/20">
      <div className="text-center">
        <span className="text-2xl">{emoji}</span>
        <p className="mt-1 text-lg font-bold text-kfm-secondary/60">{letter}</p>
      </div>
    </div>
  );
}

/* ──────────────── Types ──────────────── */
interface MenuItemData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: number;
  discountPrice: number | null;
  calories: number | null;
  itemType: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  prepTime: number | null;
  allergens: string[];
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  items: MenuItemData[];
}

interface RestaurantInfo {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  isOpen: boolean;
  deliveryFee: number;
  minOrderAmount: number;
}

/* ──────────────── Component ──────────────── */
export function MenuView() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const updateCartInfo = useCallback(() => {
    setCartCount(getCartCount());
    setCartTotal(getCartSubtotal());
  }, []);

  useEffect(() => {
    updateCartInfo();
    window.addEventListener("cart-updated", updateCartInfo);
    window.addEventListener("storage", updateCartInfo);
    return () => {
      window.removeEventListener("cart-updated", updateCartInfo);
      window.removeEventListener("storage", updateCartInfo);
    };
  }, [updateCartInfo]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/customer/menu");
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.categories || []);
          setRestaurant(data.data.restaurant || null);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const allItems = useMemo(
    () => categories.flatMap((cat) => cat.items),
    [categories]
  );

  const filteredItems = useMemo(() => {
    let items = activeCategory === "all"
      ? allItems
      : categories.find((c) => c.id === activeCategory)?.items || [];

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [activeCategory, search, categories, allItems]);

  const handleAdd = (item: MenuItemData) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      price: item.discountPrice ?? item.price,
      image: item.image || undefined,
    });
    setAddedId(item.id);
    // Update cart count/total immediately after adding
    setTimeout(() => {
      setCartCount(getCartCount());
      setCartTotal(getCartSubtotal());
    }, 50);
    setTimeout(() => setAddedId(null), 1000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Banner skeleton */}
        <div className="kfm-skeleton h-48 w-full rounded-2xl md:h-64 lg:h-72" />
        {/* Category pills skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kfm-skeleton h-8 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>
        {/* Menu cards skeleton */}
        <MenuCardSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Banner carousel */}
      <BannerCarousel />

      {/* Restaurant status */}
      {restaurant && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              restaurant.isOpen
                ? "bg-kfm-success/10 text-kfm-success"
                : "bg-kfm-danger/10 text-kfm-danger"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", restaurant.isOpen ? "bg-kfm-success" : "bg-kfm-danger")} />
            {restaurant.isOpen ? "Ouvert" : "Ferme"}
          </span>
          <span className="text-xs text-text-3">
            {restaurant.city} · Livraison {formatCurrency(restaurant.deliveryFee)}
          </span>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
        <Input
          placeholder="Rechercher un plat..."
          className="pl-10 border-kfm-border bg-surface"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            activeCategory === "all"
              ? "bg-kfm-secondary text-white"
              : "bg-surface-2 text-text-2 hover:bg-kfm-border"
          )}
        >
          Tout
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              activeCategory === cat.id
                ? "bg-kfm-secondary text-white"
                : "bg-surface-2 text-text-2 hover:bg-kfm-border"
            )}
          >
            {cat.name}
            <span className="ml-1.5 text-[10px] opacity-70">({cat.items.length})</span>
          </button>
        ))}
      </div>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Aucun article trouve"
          description={
            search
              ? "Essayez un autre terme de recherche."
              : "Cette categorie est vide pour le moment."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const imageUrl = getItemImage(item);

            return (
              <Card
                key={item.id}
                className="border-kfm-border bg-surface overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Food image */}
                    <div className="relative flex-shrink-0 aspect-square w-full sm:w-28 md:w-32 rounded-xl overflow-hidden bg-surface-2">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <PlaceholderImage item={item} />
                      )}
                      {/* Popular badge overlay */}
                      {item.isPopular && (
                        <div className="absolute top-1.5 left-1.5 z-10">
                          <Badge className="bg-kfm-accent text-white border-none text-[9px] px-1.5 py-0 shadow-sm">
                            ⭐ Populaire
                          </Badge>
                        </div>
                      )}
                      {item.isNew && (
                        <div className="absolute top-1.5 right-1.5 z-10">
                          <Badge className="bg-kfm-info text-white border-none text-[9px] px-1.5 py-0 shadow-sm">
                            Nouveau
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Name + badges row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-text truncate">
                            {item.name}
                          </h3>
                        </div>

                        {/* Add button */}
                        <Button
                          size="sm"
                          className={cn(
                            "flex-shrink-0 h-8 w-8 p-0 rounded-full transition-all",
                            addedId === item.id
                              ? "bg-kfm-success text-white scale-110"
                              : "bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
                          )}
                          onClick={() => handleAdd(item)}
                          disabled={addedId === item.id}
                        >
                          {addedId === item.id ? (
                            <span className="text-xs font-bold">✓</span>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="mt-1 text-xs text-text-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Dietary badges */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.isVegetarian && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <Leaf className="h-2.5 w-2.5" /> Vegetarien
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <Sparkles className="h-2.5 w-2.5" /> Vegan
                          </span>
                        )}
                        {item.isHalal && (
                          <span className="inline-flex items-center rounded-md bg-kfm-info/10 px-1.5 py-0.5 text-[10px] font-medium text-kfm-info">
                            Halal
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            Sans gluten
                          </span>
                        )}
                        {item.isSpicy && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <Flame className="h-2.5 w-2.5" /> Piquant
                          </span>
                        )}
                      </div>

                      {/* Price + prep time */}
                      <div className="mt-auto pt-2 flex items-center gap-2">
                        <div className="flex items-baseline gap-1">
                          {item.discountPrice ? (
                            <>
                              <span className="text-sm font-bold text-kfm-secondary">
                                {formatCurrency(item.discountPrice)}
                              </span>
                              <span className="text-xs text-text-3 line-through">
                                {formatCurrency(item.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-text">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </div>
                        {item.prepTime && (
                          <span className="flex items-center gap-0.5 text-[10px] text-text-3">
                            <Clock className="h-3 w-3" />
                            {item.prepTime} min
                          </span>
                        )}
                        {item.calories && (
                          <span className="text-[10px] text-text-3">
                            {item.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating cart bar — visible when cart has items */}
      {cartCount > 0 && (
        <Link href="/customer/cart" className="block">
          <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-xl lg:bottom-20 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between rounded-2xl bg-kfm-secondary px-5 py-3.5 text-white shadow-xl shadow-kfm-secondary/30 hover:bg-kfm-secondary/90 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    Voir le panier
                    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-xs font-bold">
                      {cartCount} article{cartCount > 1 ? "s" : ""}
                    </span>
                  </p>
                  <p className="text-xs text-white/80">Sous-total : {formatCurrency(cartTotal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{formatCurrency(cartTotal)}</span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
