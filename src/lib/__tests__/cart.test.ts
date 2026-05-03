// ============================================
// Tests: KFM Cart Utility Functions
// ============================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addToCart,
  removeFromCart,
  clearCart,
  getCart,
  getCartSubtotal,
  getCartCount,
  updateQuantity,
  type CartItem,
} from "@/lib/cart";

// ── Mock localStorage ──

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock window.dispatchEvent so it doesn't fail in Node
Object.defineProperty(global, "window", {
  value: {
    ...global,
    localStorage: localStorageMock,
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ── Tests ──

describe("Cart utilities", () => {
  describe("getCart", () => {
    it("returns empty array when cart is empty", () => {
      expect(getCart()).toEqual([]);
    });

    it("returns parsed items from localStorage", () => {
      const items: CartItem[] = [
        { menuItemId: "1", name: "Riz au gras", price: 15000, quantity: 2 },
      ];
      localStorageMock.setItem("kfm_cart", JSON.stringify(items));
      expect(getCart()).toEqual(items);
    });

    it("returns empty array on invalid JSON", () => {
      localStorageMock.setItem("kfm_cart", "not-json");
      expect(getCart()).toEqual([]);
    });
  });

  describe("addToCart", () => {
    it("adds a new item to the cart", () => {
      const cart = addToCart({
        menuItemId: "1",
        name: "Riz au gras",
        price: 15000,
      });
      expect(cart).toHaveLength(1);
      expect(cart[0].menuItemId).toBe("1");
      expect(cart[0].quantity).toBe(1);
    });

    it("increments quantity for existing item (same menuItemId)", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(2);
    });

    it("adds separate entries for different items", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = addToCart({ menuItemId: "2", name: "Poulet fumé", price: 20000 });
      expect(cart).toHaveLength(2);
    });

    it("respects custom quantity", () => {
      const cart = addToCart({
        menuItemId: "3",
        name: "Thiéboudienne",
        price: 18000,
        quantity: 4,
      });
      expect(cart[0].quantity).toBe(4);
    });
  });

  describe("removeFromCart", () => {
    it("removes an item by menuItemId", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      addToCart({ menuItemId: "2", name: "Poulet fumé", price: 20000 });
      const cart = removeFromCart("1");
      expect(cart).toHaveLength(1);
      expect(cart[0].menuItemId).toBe("2");
    });

    it("returns empty array when removing the last item", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = removeFromCart("1");
      expect(cart).toHaveLength(0);
    });

    it("does nothing if item does not exist", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = removeFromCart("nonexistent");
      expect(cart).toHaveLength(1);
    });
  });

  describe("clearCart", () => {
    it("removes all items from the cart", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      addToCart({ menuItemId: "2", name: "Poulet fumé", price: 20000 });
      clearCart();
      expect(getCart()).toEqual([]);
    });

    it("removes order type and delivery address keys", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      clearCart();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("kfm_cart");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("kfm_order_type");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("kfm_delivery_address");
    });
  });

  describe("getCartSubtotal", () => {
    it("returns 0 for empty cart", () => {
      expect(getCartSubtotal()).toBe(0);
    });

    it("calculates subtotal correctly", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000, quantity: 2 });
      addToCart({ menuItemId: "2", name: "Poulet fumé", price: 20000, quantity: 1 });
      expect(getCartSubtotal()).toBe(15000 * 2 + 20000);
    });
  });

  describe("getCartCount", () => {
    it("returns 0 for empty cart", () => {
      expect(getCartCount()).toBe(0);
    });

    it("counts total quantity across items", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000, quantity: 3 });
      addToCart({ menuItemId: "2", name: "Poulet fumé", price: 20000, quantity: 2 });
      expect(getCartCount()).toBe(5);
    });
  });

  describe("updateQuantity", () => {
    it("updates the quantity of an existing item", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = updateQuantity("1", 5);
      expect(cart[0].quantity).toBe(5);
    });

    it("removes item when quantity is set to 0", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = updateQuantity("1", 0);
      expect(cart).toHaveLength(0);
    });

    it("does not set quantity below 0", () => {
      addToCart({ menuItemId: "1", name: "Riz au gras", price: 15000 });
      const cart = updateQuantity("1", -5);
      expect(cart).toHaveLength(0);
    });
  });
});
