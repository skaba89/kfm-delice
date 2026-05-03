// ============================================
// KFM Customer Cart — localStorage-based cart
// ============================================

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  options?: string;
}

const CART_KEY = "kfm_cart";
const ORDER_TYPE_KEY = "kfm_order_type";
const DELIVERY_ADDRESS_KEY = "kfm_delivery_address";

/* ── Cart CRUD ── */

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  // Dispatch a custom event so components can react
  window.dispatchEvent(new Event("cart-updated"));
}

/** Notify listeners that the cart was updated (e.g. after clearCart) */
function notifyCartUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }): CartItem[] {
  const cart = getCart();
  const existing = cart.find(
    (c) =>
      c.menuItemId === item.menuItemId &&
      c.variant === item.variant &&
      c.options === item.options
  );

  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }

  setCart(cart);
  return cart;
}

export function removeFromCart(menuItemId: string, variant?: string, options?: string): CartItem[] {
  const cart = getCart().filter(
    (c) =>
      !(
        c.menuItemId === menuItemId &&
        c.variant === variant &&
        c.options === options
      )
  );
  setCart(cart);
  return cart;
}

export function updateQuantity(
  menuItemId: string,
  quantity: number,
  variant?: string,
  options?: string
): CartItem[] {
  const cart = getCart();
  const item = cart.find(
    (c) =>
      c.menuItemId === menuItemId &&
      c.variant === variant &&
      c.options === options
  );
  if (item) {
    item.quantity = Math.max(0, quantity);
  }
  const filtered = cart.filter((c) => c.quantity > 0);
  setCart(filtered);
  return filtered;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(ORDER_TYPE_KEY);
  localStorage.removeItem(DELIVERY_ADDRESS_KEY);
  notifyCartUpdated();
}

/* ── Cart helpers ── */

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/* ── Order type ── */

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export function getOrderType(): OrderType {
  if (typeof window === "undefined") return "DINE_IN";
  return (localStorage.getItem(ORDER_TYPE_KEY) as OrderType) || "DINE_IN";
}

export function setOrderType(type: OrderType): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDER_TYPE_KEY, type);
}

/* ── Delivery address ── */

export interface DeliveryAddress {
  address: string;
  city: string;
  district?: string;
  landmark?: string;
  notes?: string;
}

export function getDeliveryAddress(): DeliveryAddress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DELIVERY_ADDRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setDeliveryAddress(addr: DeliveryAddress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELIVERY_ADDRESS_KEY, JSON.stringify(addr));
}
