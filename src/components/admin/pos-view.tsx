"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Monitor, ShoppingCart, Plus, Minus, Trash2, AlertCircle,
  Search, CreditCard, Truck, UtensilsCrossed, Loader2, CheckCircle, Receipt,
  Smartphone, Banknote, Sparkles, Flame, Leaf, Clock,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  items: MenuItemData[];
}

interface MenuItemData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  itemType: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isSpicy: boolean;
  isNew: boolean;
  isPopular: boolean;
  prepTime: number | null;
  calories: number | null;
  sortOrder: number;
  category: { id: string; name: string; slug: string };
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

// Payment methods with Mobile Money sub-providers
type PaymentMethodKey = "CASH" | "MOBILE_MONEY" | "CARD";
type MobileMoneyProvider = "mtn_momo" | "orange_money" | "wave";

interface PaymentOption {
  key: PaymentMethodKey;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

const ORDER_TYPES: { key: OrderType; label: string; icon: React.ReactNode }[] = [
  { key: "DINE_IN", label: "Sur place", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { key: "TAKEAWAY", label: "A emporter", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "DELIVERY", label: "Livraison", icon: <Truck className="h-4 w-4" /> },
];

const PAYMENT_OPTIONS: PaymentOption[] = [
  { key: "CASH", label: "Cash", icon: <Banknote className="h-4 w-4" /> },
  { key: "MOBILE_MONEY", label: "Mobile Money", icon: <Smartphone className="h-4 w-4" />, color: "text-orange-500" },
  { key: "CARD", label: "Carte", icon: <CreditCard className="h-4 w-4" /> },
];

const MOBILE_MONEY_PROVIDERS: { key: MobileMoneyProvider; label: string; color: string; bgColor: string }[] = [
  { key: "mtn_momo", label: "MTN MoMo", color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
  { key: "orange_money", label: "Orange Money", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
  { key: "wave", label: "Wave", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
];

const TAX_RATE = 0.18;

const itemTypeEmoji: Record<string, string> = {
  food: "\uD83C\uDF5A",
  drink: "\uD83E\uDD64",
  dessert: "\uD83C\uDF70",
  side: "\uD83E\uDD57",
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminPosView() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [allItems, setAllItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodKey>("CASH");
  const [mmProvider, setMmProvider] = useState<MobileMoneyProvider>("mtn_momo");
  const [mmPhone, setMmPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [clearTarget, setClearTarget] = useState(false);
  const orderNumber = useMemo(() => Math.floor(1000 + Math.random() * 9000), []);

  // ── Fetch menu — same API as Products page and Customer menu ─────────
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/menu");
      const json = await res.json();
      // Unified /api/menu returns { categories, restaurant }
      const cats = json.data?.categories;
      if (json.success && Array.isArray(cats)) {
        const catsData: CategoryData[] = cats;
        setCategories(catsData);
        // Flatten items with category reference
        const items: MenuItemData[] = [];
        catsData.forEach((cat) => {
          cat.items?.forEach((item: MenuItemData) => {
            items.push({ ...item, category: { id: cat.id, name: cat.name, slug: cat.slug } });
          });
        });
        setAllItems(items);
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // ── Filtered items ────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (!item.isAvailable) return false;
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || item.category?.id === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [allItems, search, categoryFilter]);

  // ── Cart operations ───────────────────────────────────────────────────
  const addToCart = (item: MenuItemData) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.discountPrice ?? item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setClearTarget(false);
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  // ── Checkout ──────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setSuccess(null);
    try {
      // Build payment metadata
      const paymentMeta: Record<string, string> = {};
      if (paymentMethod === "MOBILE_MONEY") {
        paymentMeta.provider = mmProvider;
        if (!mmPhone || mmPhone.length < 8) {
          setError("Numero de telephone Mobile Money invalide");
          setCheckingOut(false);
          return;
        }
        paymentMeta.phone = mmPhone;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customerName: "Client POS",
          customerPhone: paymentMethod === "MOBILE_MONEY" ? mmPhone : "0000000000",
          orderType,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
          paymentMethod,
          paymentProvider: paymentMethod === "MOBILE_MONEY" ? mmProvider : undefined,
          notes: `POS - Paiement: ${paymentMethod === "MOBILE_MONEY" ? MOBILE_MONEY_PROVIDERS.find(p => p.key === mmProvider)?.label : paymentMethod}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Create payment record
        try {
          await fetch("/api/payments", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              orderId: json.data.id,
              method: paymentMethod,
              provider: paymentMethod === "MOBILE_MONEY" ? mmProvider : undefined,
              amount: total,
              phoneNumber: paymentMethod === "MOBILE_MONEY" ? mmPhone : undefined,
            }),
          });
        } catch { /* payment creation non-critical */ }

        setCart([]);
        setSuccess(`Commande ${json.data.orderNumber} creee avec succes !`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(json.error || "Erreur de commande");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold tracking-tight text-text">Point de vente</h2><p className="mt-1 text-sm text-text-2">Interface de caisse</p></div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Point de vente</h2>
          <p className="mt-1 text-sm text-text-2">
            Interface de caisse — {allItems.length} produits dans {categories.length} categories
          </p>
        </div>
        <button onClick={fetchMenu} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
          Rafraichir
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-success/30 bg-kfm-success/5 px-4 py-3 text-sm text-kfm-success">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />{success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-4 py-2 text-sm text-kfm-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><Trash2 className="h-3 w-3" /></button>
        </div>
      )}

      {/* Main POS Layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Left: Product Grid */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Rechercher un produit..."
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", categoryFilter === "all" ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2")}
              >
                Tous ({allItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", categoryFilter === cat.id ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2")}
                >
                  {cat.name} ({cat.items?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState icon={Monitor} title="Aucun produit" description="Aucun produit disponible ne correspond." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                const displayPrice = item.discountPrice ?? item.price;
                const hasDiscount = item.discountPrice && item.discountPrice < item.price;
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={cn("rounded-kfm-md border bg-surface p-3 text-left transition-all hover:shadow-md", inCart ? "border-kfm-secondary shadow-sm" : "border-kfm-border")}
                  >
                    {/* Top row: category + badges */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-text-3 bg-surface-2 rounded-full px-2 py-0.5">
                        {item.category?.name || item.itemType}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.isNew && <span className="text-[9px] font-semibold text-kfm-info bg-kfm-info/10 px-1.5 py-0.5 rounded-full">Nouveau</span>}
                        {item.isPopular && <span className="text-[9px] font-semibold text-kfm-warning bg-kfm-warning/10 px-1.5 py-0.5 rounded-full">Populaire</span>}
                        {inCart && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-kfm-secondary text-white text-[10px] font-bold">{inCart.quantity}</span>}
                      </div>
                    </div>

                    {/* Emoji + Name */}
                    <div className="flex items-start gap-1.5 mb-1">
                      <span className="text-base flex-shrink-0">{itemTypeEmoji[item.itemType] ?? "\uD83C\uDF7D\uFE0F"}</span>
                      <p className="text-sm font-medium text-text truncate">{item.name}</p>
                    </div>

                    {/* Dietary badges */}
                    {(item.isVegetarian || item.isVegan || item.isHalal || item.isSpicy) && (
                      <div className="flex flex-wrap gap-0.5 mb-1.5">
                        {item.isVegetarian && <Leaf className="h-2.5 w-2.5 text-green-600" />}
                        {item.isVegan && <Sparkles className="h-2.5 w-2.5 text-green-600" />}
                        {item.isHalal && <span className="text-[8px] font-medium text-kfm-info">Halal</span>}
                        {item.isSpicy && <Flame className="h-2.5 w-2.5 text-red-500" />}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-kfm-secondary">{formatCurrency(displayPrice)}</p>
                      {hasDiscount && (
                        <p className="text-[10px] text-text-3 line-through">{formatCurrency(item.price)}</p>
                      )}
                    </div>

                    {/* Prep time */}
                    {item.prepTime && (
                      <p className="text-[10px] text-text-3 mt-0.5 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {item.prepTime} min
                      </p>
                    )}

                    <p className="text-[10px] text-kfm-secondary mt-1 font-medium">Ajouter</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm flex flex-col h-fit lg:sticky lg:top-4">
          <div className="border-b border-kfm-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-kfm-secondary" />
                Commande #{orderNumber}
              </h3>
              {itemCount > 0 && <span className="rounded-full bg-kfm-secondary text-white text-[10px] font-bold px-1.5 py-0.5">{formatNumber(itemCount)}</span>}
            </div>
          </div>

          {/* Order type */}
          <div className="px-4 py-3 border-b border-kfm-border">
            <label className="text-xs font-medium text-text-3 mb-1.5 block">Type de commande</label>
            <div className="grid grid-cols-3 gap-2">
              {ORDER_TYPES.map((ot) => (
                <button
                  key={ot.key}
                  onClick={() => setOrderType(ot.key)}
                  className={cn("rounded-kfm-sm border p-2 text-center text-xs font-medium transition-all flex flex-col items-center gap-1", orderType === ot.key ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-bg text-text-2 hover:bg-surface-2")}
                >
                  {ot.icon} {ot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto max-h-[30vh]">
            {cart.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-text-3" />
                <p className="mt-2 text-xs text-text-3">La commande est vide</p>
              </div>
            ) : (
              <div className="divide-y divide-kfm-border">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{item.name}</p>
                      <p className="text-[10px] text-text-3">{formatCurrency(item.price)} x {formatNumber(item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.menuItemId, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-kfm-border text-text-2 hover:bg-surface-2"><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-sm font-semibold text-text">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItemId, 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-kfm-border text-text-2 hover:bg-surface-2"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => removeFromCart(item.menuItemId)} className="flex h-6 w-6 items-center justify-center rounded-md text-kfm-danger hover:bg-kfm-danger/10 ml-0.5"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-semibold text-text w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-kfm-border px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-text-2">Sous-total</span><span className="text-text">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-2">Taxe (18%)</span><span className="text-text">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-kfm-border pt-2"><span className="text-text">Total</span><span className="text-kfm-secondary">{formatCurrency(total)}</span></div>
          </div>

          {/* Payment method */}
          <div className="px-4 py-3 border-t border-kfm-border">
            <label className="text-xs font-medium text-text-3 mb-1.5 block">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map((pm) => (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={cn("rounded-kfm-sm border p-2 text-center text-xs font-medium transition-all flex items-center justify-center gap-1", paymentMethod === pm.key ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-bg text-text-2 hover:bg-surface-2")}
                >
                  {pm.icon} {pm.label}
                </button>
              ))}
            </div>

            {/* Mobile Money sub-options */}
            {paymentMethod === "MOBILE_MONEY" && (
              <div className="mt-3 space-y-3">
                {/* Provider selector */}
                <div className="grid grid-cols-3 gap-2">
                  {MOBILE_MONEY_PROVIDERS.map((provider) => (
                    <button
                      key={provider.key}
                      onClick={() => setMmProvider(provider.key)}
                      className={cn("rounded-kfm-sm border p-2 text-center text-xs font-medium transition-all", mmProvider === provider.key ? `border-current ${provider.bgColor} ${provider.color}` : "border-kfm-border bg-bg text-text-2 hover:bg-surface-2")}
                    >
                      {provider.label}
                    </button>
                  ))}
                </div>
                {/* Phone number */}
                <div>
                  <label className="text-[10px] font-medium text-text-3 mb-1 block">Numero de telephone</label>
                  <input
                    type="tel"
                    value={mmPhone}
                    onChange={(e) => setMmPhone(e.target.value)}
                    placeholder="07X XXX XXX"
                    className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Checkout buttons */}
          <div className="p-4 border-t border-kfm-border flex gap-2">
            <button
              onClick={() => { if (cart.length > 0) setClearTarget(true); }}
              disabled={cart.length === 0}
              className="rounded-kfm-sm border border-kfm-border px-4 py-3 text-sm font-medium text-text-2 hover:bg-surface-2 disabled:opacity-40 flex-1"
            >
              Vider
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut || (paymentMethod === "MOBILE_MONEY" && mmPhone.length < 8)}
              className="flex-[2] rounded-kfm-sm bg-kfm-secondary py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Encaisser {total > 0 ? formatCurrency(total) : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation */}
      <AlertDialog open={clearTarget} onOpenChange={setClearTarget}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Vider la commande ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Tous les articles seront supprimes de la commande courante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-kfm-sm border border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={clearCart} className="rounded-kfm-sm bg-kfm-danger text-white hover:opacity-90">Vider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
