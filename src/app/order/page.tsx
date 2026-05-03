"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Phone,
  Clock,
  MapPin,
  X,
  ChevronRight,
  Check,
  Loader2,
  UtensilsCrossed,
  Flame,
  Leaf,
  Wheat,
  StarOff,
  Sparkles,
  BadgeCheck,
  Truck,
  ShoppingBag,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  ChefHat,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCart,
  setCart,
  addToCart as addToCartLib,
  removeFromCart as removeFromCartLib,
  updateQuantity as updateQuantityLib,
  clearCart,
  getCartCount,
  getCartSubtotal,
  type CartItem,
} from "@/lib/cart";

// ── Types ────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  isOpen: boolean;
  deliveryFee: number;
  minOrderAmount: number;
}

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

// ── Emojis ───────────────────────────────────────────────────────────

const categoryEmojis: Record<string, string> = {
  plats: "\uD83C\uDF5B",
  grillades: "\uD83E\uDD69",
  boissons: "\uD83E\uDD64",
  desserts: "\uD83C\uDF70",
  accompagnements: "\uD83E\uDD57",
  drinks: "\uD83E\uDD64",
  sides: "\uD83E\uDD57",
  main: "\uD83C\uDF5B",
};

const itemTypeEmojis: Record<string, string> = {
  food: "\uD83C\uDF5B",
  drink: "\uD83E\uDD64",
  dessert: "\uD83C\uDF70",
  side: "\uD83E\uDD57",
};

function getItemEmoji(item: MenuItemData): string {
  if (item.image) return "\u2B1C";
  return (
    itemTypeEmojis[item.itemType] ??
    categoryEmojis[item.slug?.toLowerCase()] ??
    "\uD83C\uDF7D\uFE0F"
  );
}

// ── Formatters ───────────────────────────────────────────────────────

const currencyFmt = new Intl.NumberFormat("fr-FR");
function fmtPrice(amount: number): string {
  return currencyFmt.format(amount) + " FG";
}

// ── Component ────────────────────────────────────────────────────────

export default function OrderPage() {
  // Menu data
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  // Cart
  const [cart, setCartState] = useState<CartItem[]>([]);

  // Checkout form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("TAKEAWAY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile-money" | "card">("cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    total: number;
    estimatedTime: number;
  } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // ── Fetch menu ────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/menu");
      const json = await res.json();
      if (json.success && json.data) {
        setRestaurant(json.data.restaurant);
        setCategories(json.data.categories || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ── Cart sync ─────────────────────────────────────────────
  const refreshCart = useCallback(() => {
    setCartState(getCart());
  }, []);

  useEffect(() => {
    refreshCart();
    const handler = () => refreshCart();
    window.addEventListener("cart-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cart-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refreshCart]);

  // ── Cart actions ──────────────────────────────────────────
  function handleAddToCart(item: MenuItemData) {
    addToCartLib({
      menuItemId: item.id,
      name: item.name,
      price: item.discountPrice ?? item.price,
      image: item.image ?? undefined,
    });
    refreshCart();
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 600);
  }

  function handleRemoveFromCart(menuItemId: string) {
    removeFromCartLib(menuItemId);
    refreshCart();
  }

  function handleUpdateQuantity(menuItemId: string, quantity: number) {
    updateQuantityLib(menuItemId, quantity);
    refreshCart();
  }

  function handleClearCart() {
    clearCart();
    refreshCart();
  }

  // ── Filtered items ────────────────────────────────────────
  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCategory =
        activeCategory === "all" ||
        categories.find((c) => c.id === activeCategory)?.items.includes(item);
      const matchSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allItems, activeCategory, searchQuery, categories]);

  // ── Cart calculations ─────────────────────────────────────
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const deliveryFee = orderType === "DELIVERY" ? (restaurant?.deliveryFee || 0) : 0;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  // ── Submit order ──────────────────────────────────────────
  async function handleSubmitOrder() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setOrderError(null);

    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          orderType,
          deliveryAddress: orderType === "DELIVERY" ? deliveryAddress.trim() : undefined,
          deliveryCity: orderType === "DELIVERY" ? deliveryCity.trim() : undefined,
          paymentMethod,
          notes: notes.trim() || undefined,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      });
      const json = await res.json();

      if (json.success) {
        setOrderResult(json.data);
        handleClearCart();
        setCheckoutOpen(false);
        setCartOpen(false);
      } else {
        setOrderError(json.error || "Erreur lors de la commande");
      }
    } catch {
      setOrderError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-kfm-secondary" />
          <p className="mt-3 text-sm text-text-3">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  // ── Order success ─────────────────────────────────────────
  if (orderResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-kfm-success/10">
          <Check className="h-10 w-10 text-kfm-success" />
        </div>
        <h1 className="text-2xl font-bold text-text">Commande confirmee !</h1>
        <p className="mt-2 text-sm text-text-2">
          Votre commande a ete enregistree avec succes.
        </p>

        <div className="mt-8 rounded-kfm-md border border-kfm-border bg-surface p-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Numero de commande</span>
              <span className="font-bold text-kfm-secondary">{orderResult.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Montant total</span>
              <span className="font-semibold text-text">{fmtPrice(orderResult.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Delai estime</span>
              <span className="font-semibold text-text">{orderResult.estimatedTime} min</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-kfm-md border border-kfm-info/20 bg-kfm-info/5 p-4">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-kfm-info" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text">Besoin d&apos;aide ?</p>
              <p className="mt-1 text-sm text-text-2">
                Appelez-nous directement au{" "}
                <a
                  href={`tel:${restaurant?.phone}`}
                  className="font-semibold text-kfm-secondary underline"
                >
                  {restaurant?.phone}
                </a>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setOrderResult(null)}
          className="mt-8 inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Nouvelle commande
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl">
      {/* ═══ RESTAURANT HERO ═══ */}
      <div className="border-b border-kfm-border bg-gradient-to-b from-kfm-secondary/5 to-bg px-4 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-kfm-border bg-surface/80 px-3 py-1.5 text-xs font-medium">
            {restaurant?.isOpen ? (
              <>
                <span className="h-2 w-2 rounded-full bg-kfm-success animate-pulse" />
                <span className="text-kfm-success">Ouvert maintenant</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-kfm-danger" />
                <span className="text-kfm-danger">Ferme</span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold text-text sm:text-4xl">
            {restaurant?.name || "Notre Menu"}
          </h1>
          {restaurant && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-text-2">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {restaurant.address}, {restaurant.city}
              </span>
              <a
                href={`tel:${restaurant.phone}`}
                className="inline-flex items-center gap-1.5 font-medium text-kfm-secondary transition hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {restaurant.phone}
              </a>
              {restaurant.deliveryFee > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Livraison : {fmtPrice(restaurant.deliveryFee)}
                </span>
              )}
            </div>
          )}

          {/* Order type tabs */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-kfm-lg bg-surface p-1 shadow-sm">
            {[
              { key: "TAKEAWAY" as const, label: "A emporter", icon: <ShoppingBag className="h-4 w-4" /> },
              { key: "DINE_IN" as const, label: "Sur place", icon: <UtensilsCrossed className="h-4 w-4" /> },
              { key: "DELIVERY" as const, label: "Livraison", icon: <Truck className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setOrderType(tab.key)}
                className={cn(
                  "flex items-center gap-2 rounded-kfm-md px-5 py-2.5 text-sm font-medium transition-all",
                  orderType === tab.key
                    ? "bg-kfm-secondary text-white shadow-sm"
                    : "text-text-2 hover:bg-surface-2 hover:text-text"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ PHONE ORDER BANNER ═══ */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <a
          href={`tel:${restaurant?.phone || "+224622000000"}`}
          className="flex items-center gap-3 rounded-kfm-md border border-kfm-info/20 bg-kfm-info/5 p-4 transition hover:bg-kfm-info/10"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-kfm-info/10">
            <Phone className="h-5 w-5 text-kfm-info" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Commander par telephone</p>
            <p className="text-xs text-text-3">
              Appelez-nous directement pour passer votre commande
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-kfm-info">
            <Phone className="h-3.5 w-3.5" />
            {restaurant?.phone || "+224 622 00 00 00"}
            <ChevronRight className="h-4 w-4" />
          </div>
        </a>
      </div>

      {/* ═══ SEARCH + CATEGORIES ═══ */}
      <div className="sticky top-14 z-30 bg-bg px-4 pb-3 pt-4">
        <div className="mx-auto max-w-6xl">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-kfm-md border border-kfm-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none focus:ring-1 focus:ring-kfm-secondary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                activeCategory === "all"
                  ? "border-kfm-secondary bg-kfm-secondary text-white"
                  : "border-kfm-border bg-surface text-text-2 hover:border-kfm-secondary/50"
              )}
            >
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Tout
              <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                {allItems.length}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === cat.id
                    ? "border-kfm-secondary bg-kfm-secondary text-white"
                    : "border-kfm-border bg-surface text-text-2 hover:border-kfm-secondary/50"
                )}
              >
                <span>{categoryEmojis[cat.slug?.toLowerCase()] || "\uD83C\uDF7D\uFE0F"}</span>
                {cat.name}
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    activeCategory === cat.id ? "bg-white/20" : "bg-surface-2 text-text-3"
                  )}
                >
                  {cat.items.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MENU ITEMS GRID ═══ */}
      <div className="mx-auto max-w-6xl px-4 pb-32">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-3">
            <Search className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">Aucun plat trouve</p>
            <p className="mt-1 text-xs">Essayez une autre recherche ou categorie</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const cartItem = cart.find((c) => c.menuItemId === item.id);
              const qtyInCart = cartItem?.quantity || 0;
              const price = item.discountPrice ?? item.price;
              const isAdded = addedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="group relative rounded-kfm-md border border-kfm-border bg-surface p-4 transition hover:shadow-md"
                >
                  {/* Top badges */}
                  <div className="mb-2 flex items-center gap-1.5">
                    {item.isNew && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-kfm-info/10 px-2 py-0.5 text-[10px] font-bold text-kfm-info">
                        <Sparkles className="h-3 w-3" /> Nouveau
                      </span>
                    )}
                    {item.isPopular && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-kfm-warning/10 px-2 py-0.5 text-[10px] font-bold text-kfm-warning">
                        <Flame className="h-3 w-3" /> Populaire
                      </span>
                    )}
                    {item.isFeatured && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-kfm-secondary/10 px-2 py-0.5 text-[10px] font-bold text-kfm-secondary">
                        <BadgeCheck className="h-3 w-3" /> Signature
                      </span>
                    )}
                  </div>

                  {/* Name + description */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-text">{item.name}</h3>
                      {item.description && (
                        <p className="mt-1 text-xs leading-relaxed text-text-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl">{getItemEmoji(item)}</span>
                  </div>

                  {/* Dietary icons */}
                  <div className="mt-2 flex items-center gap-2">
                    {item.isVegetarian && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-kfm-success">
                        <Leaf className="h-3 w-3" /> Veggie
                      </span>
                    )}
                    {item.isVegan && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                        <Leaf className="h-3 w-3" /> Vegan
                      </span>
                    )}
                    {item.isHalal && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-kfm-secondary">
                        <BadgeCheck className="h-3 w-3" /> Halal
                      </span>
                    )}
                    {item.isSpicy && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-kfm-danger">
                        <Flame className="h-3 w-3" /> Piquant
                      </span>
                    )}
                    {item.prepTime && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-text-3">
                        <Clock className="h-3 w-3" /> {item.prepTime} min
                      </span>
                    )}
                  </div>

                  {/* Price + Add button */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      {item.discountPrice && (
                        <span className="mr-2 text-xs text-text-3 line-through">
                          {fmtPrice(item.price)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-kfm-secondary">
                        {fmtPrice(price)}
                      </span>
                    </div>

                    {qtyInCart === 0 ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all active:scale-90",
                          isAdded
                            ? "border-kfm-success bg-kfm-success text-white"
                            : "border-kfm-secondary bg-kfm-secondary text-white hover:bg-kfm-secondary-hover"
                        )}
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            qtyInCart <= 1
                              ? handleRemoveFromCart(item.id)
                              : handleUpdateQuantity(item.id, qtyInCart - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-kfm-border text-text-2 transition hover:bg-surface-2"
                        >
                          {qtyInCart <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        </button>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-secondary text-sm font-bold text-white">
                          {qtyInCart}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, qtyInCart + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-secondary text-white transition hover:opacity-80"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ STICKY CART BAR (mobile) ═══ */}
      {cartCount > 0 && !checkoutOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-kfm-border bg-surface/95 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between py-3">
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-3"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-kfm-secondary text-white">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-kfm-danger px-1 text-[10px] font-bold">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-text">{fmtPrice(subtotal + tax + deliveryFee)}</p>
                <p className="text-[10px] text-text-3">Voir le panier</p>
              </div>
            </button>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="rounded-kfm-md bg-kfm-success px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Commander
            </button>
          </div>
        </div>
      )}

      {/* ═══ CART DRAWER (mobile slide-up / desktop modal) ═══ */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Overlay */}
          <div className="bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

          {/* Cart panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-kfm-border bg-surface shadow-xl lg:mx-auto lg:top-1/2 lg:right-auto lg:bottom-auto lg:left-1/2 lg:max-h-[70vh] lg:w-[420px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-kfm-border px-5 py-4">
              <h2 className="text-lg font-bold text-text">Votre panier</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-3">
                  <ShoppingCart className="mb-3 h-10 w-10 opacity-30" />
                  <p className="text-sm">Votre panier est vide</p>
                </div>
              ) : (
                <div className="divide-y divide-kfm-border">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{item.name}</p>
                        <p className="text-xs text-text-3">{fmtPrice(item.price)} / unite</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            item.quantity <= 1
                              ? handleRemoveFromCart(item.menuItemId)
                              : handleUpdateQuantity(item.menuItemId, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-kfm-border text-text-2"
                        >
                          {item.quantity <= 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-kfm-secondary text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="w-16 text-right text-sm font-semibold">
                        {fmtPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary + actions */}
            {cart.length > 0 && (
              <div className="border-t border-kfm-border px-5 py-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-2">Sous-total</span>
                    <span>{fmtPrice(subtotal)}</span>
                  </div>
                  {orderType === "DELIVERY" && deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-2">Livraison</span>
                      <span>{fmtPrice(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-text-2">TVA (18%)</span>
                    <span>{fmtPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-kfm-border pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-kfm-secondary">{fmtPrice(total)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="flex-[2] rounded-kfm-md bg-kfm-success py-3 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Commander — {fmtPrice(total)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CHECKOUT MODAL ═══ */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-kfm-border bg-surface px-5 py-4">
              <h2 className="text-lg font-bold text-text">Finaliser la commande</h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Error */}
              {orderError && (
                <div className="flex items-center gap-2 rounded-kfm-md border border-kfm-danger/20 bg-kfm-danger/5 px-4 py-3 text-sm text-kfm-danger">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  {orderError}
                </div>
              )}

              {/* Order summary */}
              <div className="rounded-kfm-md bg-surface-2 p-4">
                <h3 className="text-sm font-semibold text-text mb-2">Recapitulatif</h3>
                <div className="space-y-1.5 text-sm">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between">
                      <span className="text-text-2">
                        {item.quantity}x {item.name}
                      </span>
                      <span>{fmtPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-kfm-border pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-2">Sous-total</span>
                      <span>{fmtPrice(subtotal)}</span>
                    </div>
                    {orderType === "DELIVERY" && deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-2">Livraison</span>
                        <span>{fmtPrice(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-2">TVA (18%)</span>
                      <span>{fmtPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-base font-bold">
                      <span>Total</span>
                      <span className="text-kfm-secondary">{fmtPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer info */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Vos informations</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-2">Nom complet *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Amadou Ndiaye"
                      className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-2">Telephone *</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+224 6XX XX XX XX"
                      className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-2">Email (optionnel)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery address (only for delivery) */}
              {orderType === "DELIVERY" && (
                <div>
                  <h3 className="text-sm font-semibold text-text mb-3">Adresse de livraison</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-2">Adresse *</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ex: 45 Rue Carnot, Kaloum"
                        className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-2">Quartier / Ville *</label>
                      <input
                        type="text"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="Ex: Kaloum, Conakry"
                        className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment method */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Mode de paiement</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "cash" as const, label: "Especes", icon: <Banknote className="h-5 w-5" /> },
                    { key: "mobile-money" as const, label: "Mobile Money", icon: <Smartphone className="h-5 w-5" /> },
                    { key: "card" as const, label: "Carte", icon: <CreditCard className="h-5 w-5" /> },
                  ].map((pm) => (
                    <button
                      key={pm.key}
                      onClick={() => setPaymentMethod(pm.key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-kfm-md border p-3 text-xs font-medium transition-all",
                        paymentMethod === pm.key
                          ? "border-kfm-secondary bg-kfm-secondary/10 text-kfm-secondary"
                          : "border-kfm-border bg-bg text-text-2 hover:border-kfm-secondary/50"
                      )}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-2">Note (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions speciales, allergies..."
                  rows={2}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-kfm-secondary focus:outline-none resize-none"
                />
              </div>

              {/* Phone order alternative */}
              <div className="rounded-kfm-md border border-kfm-border bg-surface-2 p-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-kfm-secondary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">Preferez commander par telephone ?</p>
                    <p className="text-xs text-text-3">Appelez-nous au {restaurant?.phone}</p>
                  </div>
                  <a
                    href={`tel:${restaurant?.phone || "+224622000000"}`}
                    className="rounded-kfm-sm border border-kfm-secondary px-3 py-2 text-xs font-semibold text-kfm-secondary transition hover:bg-kfm-secondary/10"
                  >
                    Appeler
                  </a>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="sticky bottom-0 border-t border-kfm-border bg-surface px-5 py-4">
              <button
                onClick={handleSubmitOrder}
                disabled={
                  !customerName.trim() ||
                  !customerPhone.trim() ||
                  (orderType === "DELIVERY" && (!deliveryAddress.trim() || !deliveryCity.trim())) ||
                  cart.length === 0 ||
                  submitting
                }
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-kfm-md py-3.5 text-sm font-bold text-white transition",
                  cart.length > 0 && customerName.trim() && customerPhone.trim()
                    ? "bg-kfm-success hover:opacity-90"
                    : "cursor-not-allowed bg-kfm-success/30"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirmer la commande — {fmtPrice(total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
