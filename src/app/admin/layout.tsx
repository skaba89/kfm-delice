"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Monitor, Truck, UtensilsCrossed, Package, Users,
  CreditCard, UserCog, BarChart3, Settings, ChefHat, X, LogOut, Moon, Sun,
  MapPin, CalendarCheck, Receipt, FileText, TrendingUp, Building2,
  Briefcase, Gift, Apple, Crown, ClipboardList, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/kfm-ui/notification-bell";
import { SocketProvider } from "@/components/providers/socket-provider";
import { AdminSocketListener } from "@/components/admin/socket-listener";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const adminNavSections = [
  {
    label: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard Admin", icon: LayoutDashboard, href: "/admin/dashboard" },
      { id: "restaurants", label: "Restaurants", icon: Building2, href: "/admin/restaurants" },
      { id: "organizations", label: "Organisations", icon: Crown, href: "/admin/organizations" },
      { id: "users", label: "Utilisateurs", icon: Users, href: "/admin/users" },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "orders", label: "Commandes globales", icon: ShoppingCart, href: "/admin/orders" },
      { id: "deliveries", label: "Livraisons", icon: Truck, href: "/admin/deliveries" },
      { id: "drivers", label: "Livreurs", icon: Truck, href: "/admin/drivers" },
      { id: "reservations", label: "Reservations", icon: CalendarCheck, href: "/admin/reservations" },
      { id: "waitlist", label: "Listes d'attente", icon: ClipboardList, href: "/admin/waitlist" },
    ],
  },
  {
    label: "Menu & Stock",
    items: [
      { id: "menu", label: "Menus", icon: UtensilsCrossed, href: "/admin/menu" },
      { id: "inventory", label: "Inventaire", icon: Package, href: "/admin/inventory" },
      { id: "suppliers", label: "Fournisseurs", icon: Truck, href: "/admin/suppliers" },
      { id: "nutrition", label: "Nutrition", icon: Apple, href: "/admin/nutrition" },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "invoices", label: "Factures", icon: Receipt, href: "/admin/invoices" },
      { id: "expenses", label: "Depenses", icon: FileText, href: "/admin/expenses" },
      { id: "subscriptions", label: "Abonnements", icon: Crown, href: "/admin/subscriptions" },
      { id: "gift-cards", label: "Cartes cadeaux", icon: Gift, href: "/admin/gift-cards" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { id: "reports", label: "Rapports", icon: BarChart3, href: "/admin/reports" },
      { id: "analytics", label: "Analytique", icon: TrendingUp, href: "/admin/analytics" },
      { id: "branches", label: "Branches", icon: Building2, href: "/admin/branches" },
    ],
  },
  {
    label: "RH & Config",
    items: [
      { id: "staff", label: "Personnel", icon: UserCog, href: "/admin/staff" },
      { id: "hr", label: "RH", icon: Users, href: "/admin/hr" },
      { id: "catering", label: "Traiteur", icon: Briefcase, href: "/admin/catering" },
      { id: "pos", label: "POS", icon: Monitor, href: "/admin/pos" },
      { id: "floor-plan", label: "Plans de salle", icon: MapPin, href: "/admin/floor-plan" },
    ],
  },
  {
    label: "Systeme",
    items: [
      { id: "restaurant", label: "Restaurant courant", icon: Building2, href: "/admin/restaurant" },
      { id: "customers", label: "Clients", icon: Users, href: "/admin/customers" },
      { id: "settings", label: "Parametres", icon: Settings, href: "/admin/settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return next;
    });
  };

  return (
    <SocketProvider rooms={["admin"]}>
    <AdminSocketListener />
    <div className="min-h-screen bg-bg">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-kfm-border bg-surface transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-kfm-border px-5">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-kfm-danger text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-text">KFM</span>
              <span className="ml-1.5 text-xs font-medium text-text-3">Admin Panel</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {adminNavSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-3">{section.label}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.id}>
                      <Link href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                        "flex items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium transition-all",
                        isActive ? "bg-kfm-danger/10 text-kfm-danger" : "text-text-2 hover:bg-surface-2 hover:text-text"
                      )}>
                        <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-kfm-danger" : "text-text-3")} />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-kfm-border p-3 space-y-1">
          <Link href="/" className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-kfm-secondary hover:bg-kfm-secondary/10">
            <ChefHat className="h-4 w-4 text-text-3" />
            Restaurant
          </Link>
          <Link href="/order" className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
            <Users className="h-4 w-4 text-text-3" />
            Portail Client
          </Link>
          <Link href="/driver/dashboard" className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
            <Truck className="h-4 w-4 text-text-3" />
            Portail Livreur
          </Link>
          <Link href="/kitchen/orders" className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
            <ChefHat className="h-4 w-4 text-text-3" />
            Portail Cuisine
          </Link>
          <button onClick={toggleDark} className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
            {darkMode ? <Sun className="h-4 w-4 text-text-3" /> : <Moon className="h-4 w-4 text-text-3" />}
            {darkMode ? "Mode clair" : "Mode sombre"}
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <LogOut className="h-4 w-4" />
            Deconnexion
          </button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-kfm-border bg-surface/80 px-4 backdrop-blur lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-text-3 hover:bg-surface-2 lg:hidden">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <h1 className="text-lg font-semibold text-text">
            {adminNavSections.flatMap((s) => s.items).find((i) => pathname === i.href)?.label ?? "Admin Dashboard"}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-danger text-xs font-bold text-white"
              title={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Admin"}
            >
              {user
                ? ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || user.email?.[0]?.toUpperCase() || "A"
                : "SA"}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
    </SocketProvider>
  );
}
