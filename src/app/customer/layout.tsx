"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  ShoppingCart,
  Calendar,
  User,
  LogIn,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCartCount } from "@/lib/cart";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

const customerNavItems = [
  { id: "menu", label: "Menu", icon: UtensilsCrossed, href: "/customer/menu" },
  { id: "cart", label: "Panier", icon: ShoppingCart, href: "/customer/cart" },
  { id: "orders", label: "Commandes", icon: ClipboardList, href: "/customer/orders" },
  { id: "reservations", label: "Reservations", icon: Calendar, href: "/customer/reservations" },
  { id: "profile", label: "Profil", icon: User, href: "/customer/profile" },
];

/* ── Inner layout with auth access ── */
function CustomerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [restaurantName, setRestaurantName] = useState("KFM Delice");
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const handleStorage = () => setCartCount(getCartCount());
    window.addEventListener("storage", handleStorage);
    const update = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", update);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart-updated", update);
    };
  }, []);

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await fetch("/api/customer/menu");
        const result = await res.json();
        if (result.success && result.data?.restaurant?.name) {
          setRestaurantName(result.data.restaurant.name);
        }
      } catch {
        // Silently fail
      }
    }
    fetchRestaurant();
  }, []);

  // Get active nav label for header title
  const activeItem = customerNavItems.find((item) => pathname.startsWith(item.href));
  const pageTitle = activeItem?.label || "KFM Delice";

  // Don't show bottom nav on login page
  const isLoginPage = pathname === "/customer/login";

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-kfm-border bg-surface/90 px-4 backdrop-blur-md">
        <Link href="/customer" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-kfm-sm bg-kfm-secondary text-white">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-text">{restaurantName}</span>
          </div>
        </Link>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-text sm:hidden">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Cart button */}
          <Link
            href="/customer/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-kfm-sm hover:bg-surface-2 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-text-2" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-kfm-danger px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Auth button: login or profile/logout */}
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <div className="flex items-center gap-1">
                  <Link
                    href="/customer/profile"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary"
                    title={user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                  >
                    {user.firstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "U"}
                  </Link>
                  <button
                    onClick={logout}
                    className="flex h-8 w-8 items-center justify-center rounded-kfm-sm hover:bg-kfm-danger/10 transition-colors"
                    title="Se deconnecter"
                  >
                    <LogOut className="h-4 w-4 text-text-3" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/customer/login"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-secondary/10 text-kfm-secondary hover:bg-kfm-secondary/20 transition-colors"
                  title="Se connecter"
                >
                  <LogIn className="h-4 w-4" />
                </Link>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-4 pb-24 lg:pb-6">
        {children}
      </main>

      {/* ── Bottom Navigation (mobile) ── */}
      {!isLoginPage && (
        <>
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-kfm-border bg-surface/95 backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-5xl items-center justify-around py-1">
              {customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "relative flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors",
                      isActive ? "text-kfm-secondary" : "text-text-3 hover:text-text-2"
                    )}
                  >
                    {item.id === "cart" && cartCount > 0 && (
                      <span className="absolute -top-0.5 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-kfm-danger px-1 text-[8px] font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                    <Icon className={cn("h-5 w-5", isActive && "text-kfm-secondary")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-kfm-secondary" />
                    )}
                  </Link>
                );
              })}
            </div>
            {/* Safe area for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </nav>

          {/* ── Desktop bottom navigation ── */}
          <div className="hidden lg:block fixed bottom-0 left-0 right-0 border-t border-kfm-border bg-surface/80 backdrop-blur-sm z-30">
            <div className="mx-auto flex max-w-5xl items-center justify-around py-2 px-4">
              {customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-kfm-sm text-sm font-medium transition-colors",
                      isActive
                        ? "bg-kfm-secondary/10 text-kfm-secondary"
                        : "text-text-3 hover:text-text-2 hover:bg-surface-2"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main layout with AuthProvider wrapper ── */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CustomerLayoutInner>{children}</CustomerLayoutInner>
    </AuthProvider>
  );
}
