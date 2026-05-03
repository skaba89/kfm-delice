"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MapPin,
  UtensilsCrossed,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import {
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  getCartSubtotal,
  type CartItem,
  type OrderType,
  getOrderType,
  setOrderType,
  getDeliveryAddress,
  setDeliveryAddress,
  type DeliveryAddress,
} from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ──────────────── Component ──────────────── */
export function CartView() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setLocalOrderType] = useState<OrderType>("DINE_IN");
  const [deliveryAddr, setLocalDeliveryAddr] = useState<DeliveryAddress>({
    address: "",
    city: "",
    district: "",
    landmark: "",
    notes: "",
  });
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Load cart and order settings
  useEffect(() => {
    const handleUpdate = () => {
      setCart(getCart());
      setLocalOrderType(getOrderType());
      const addr = getDeliveryAddress();
      if (addr) setLocalDeliveryAddr(addr);
    };
    // Initial load via microtask
    const id = requestAnimationFrame(handleUpdate);
    window.addEventListener("cart-updated", handleUpdate);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("cart-updated", handleUpdate);
    };
  }, []);

  // Fetch delivery fee from menu API
  useEffect(() => {
    async function fetchDeliveryFee() {
      try {
        const res = await fetch("/api/customer/menu");
        const data = await res.json();
        if (data.success && data.data?.restaurant) {
          setDeliveryFee(data.data.restaurant.deliveryFee || 0);
        }
      } catch {
        // Silently fail
      }
    }
    fetchDeliveryFee();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const fee = orderType === "DELIVERY" ? deliveryFee : 0;
  const total = subtotal + tax + fee;

  const handleRemove = (item: CartItem) => {
    const updated = removeFromCart(item.menuItemId, item.variant, item.options);
    setCart(updated);
  };

  const handleQuantityChange = (item: CartItem, newQty: number) => {
    const updated = updateQuantity(item.menuItemId, newQty, item.variant, item.options);
    setCart(updated);
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setLocalOrderType(type);
    setOrderType(type);
  };

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    const updated = { ...deliveryAddr, [field]: value };
    setLocalDeliveryAddr(updated);
    setDeliveryAddress(updated);
  };

  const handleClear = () => {
    clearCart();
    setCart([]);
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text">Mon panier</h2>
        <EmptyState
          icon={ShoppingCart}
          title="Votre panier est vide"
          description="Ajoutez des articles depuis le menu pour commencer votre commande."
          action={
            <Link href="/customer/menu">
              <Button className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white">
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Voir le menu
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">
          Mon panier
          <span className="ml-2 text-sm font-normal text-text-3">
            ({cart.reduce((s, i) => s + i.quantity, 0)} article{cart.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""})
          </span>
        </h2>
        <Button variant="ghost" size="sm" className="text-kfm-danger hover:text-kfm-danger hover:bg-kfm-danger/10" onClick={handleClear}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Vider
        </Button>
      </div>

      {/* Cart items */}
      <div className="space-y-2">
        {cart.map((item, idx) => (
          <Card key={`${item.menuItemId}-${item.variant}-${idx}`} className="border-kfm-border bg-surface">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{item.name}</p>
                  <p className="text-xs text-text-3 mt-0.5">{formatCurrency(item.price)} / piece</p>
                  {item.variant && (
                    <p className="text-[10px] text-text-3 mt-0.5">{item.variant}</p>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-kfm-border text-text-2 hover:bg-surface-2 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-text">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-kfm-border text-text-2 hover:bg-surface-2 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Price + remove */}
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className="text-sm font-semibold text-text">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => handleRemove(item)}
                    className="text-text-3 hover:text-kfm-danger transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order type */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-4">
          <Label className="text-sm font-semibold text-text mb-3 block">Type de commande</Label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "DINE_IN", label: "Sur place", icon: UtensilsCrossed },
              { value: "TAKEAWAY", label: "A emporter", icon: ShoppingBag },
              { value: "DELIVERY", label: "Livraison", icon: Truck },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleOrderTypeChange(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-kfm-sm border-2 p-3 transition-all",
                  orderType === opt.value
                    ? "border-kfm-secondary bg-kfm-secondary/5 text-kfm-secondary"
                    : "border-kfm-border text-text-2 hover:border-text-3"
                )}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery address (if delivery) */}
      {orderType === "DELIVERY" && (
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-kfm-danger" />
              <Label className="text-sm font-semibold text-text">Adresse de livraison</Label>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Adresse complete"
                className="border-kfm-border"
                value={deliveryAddr.address}
                onChange={(e) => handleAddressChange("address", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ville"
                  className="border-kfm-border"
                  value={deliveryAddr.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
                <Input
                  placeholder="Quartier"
                  className="border-kfm-border"
                  value={deliveryAddr.district}
                  onChange={(e) => handleAddressChange("district", e.target.value)}
                />
              </div>
              <Input
                placeholder="Point de repere (optionnel)"
                className="border-kfm-border"
                value={deliveryAddr.landmark}
                onChange={(e) => handleAddressChange("landmark", e.target.value)}
              />
              <Input
                placeholder="Instructions de livraison (optionnel)"
                className="border-kfm-border"
                value={deliveryAddr.notes}
                onChange={(e) => handleAddressChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-2">Sous-total</span>
            <span className="text-text">{formatCurrency(subtotal)}</span>
          </div>
          {fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Frais de livraison</span>
              <span className="text-text">{formatCurrency(fee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-2">Taxe (TVA 18%)</span>
            <span className="text-text">{formatCurrency(tax)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-text">Total</span>
            <span className="text-text">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Checkout button */}
      <Link href="/customer/checkout">
        <Button className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white h-12 text-sm font-semibold">
          Passer la commande
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
