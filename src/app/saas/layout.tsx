"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Globe,
  BarChart3,
  X,
  LogOut,
  ChefHat,
  Shield,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

const saasNavSections = [
  {
    label: "Principal",
    items: [
      { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/saas" },
      { id: "restaurants", label: "Restaurants", icon: Building2, href: "/saas/restaurants" },
      { id: "users", label: "Utilisateurs", icon: Users, href: "/saas/users" },
    ],
  },
  {
    label: "Monetisation",
    items: [
      { id: "billing", label: "Plans & Facturation", icon: CreditCard, href: "/saas/billing" },
    ],
  },
  {
    label: "Contenu",
    items: [
      { id: "public-page", label: "Page Publique", icon: Globe, href: "/saas/public-page" },
    ],
  },
  {
    label: "Analyse",
    items: [
      { id: "analytics", label: "Analytique globale", icon: BarChart3, href: "/saas/analytics" },
    ],
  },
  {
    label: "Systeme",
    items: [
      { id: "settings", label: "Parametres Plateforme", icon: Settings, href: "/saas/settings" },
    ],
  },
];

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SaasLayoutInner>{children}</SaasLayoutInner>
    </AuthProvider>
  );
}

function SaasLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const currentPage = saasNavSections
    .flatMap((s) => s.items)
    .find((i) => pathname === i.href);

  const pageTitle = pathname === "/saas"
    ? "Tableau de bord SaaS"
    : currentPage?.label ?? "KFM Delice SaaS";

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-kfm-border bg-surface transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-kfm-border px-5">
          <Link href="/saas" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-orange-500 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-text">KFM Delice</span>
              <span className="ml-1.5 text-xs font-medium text-orange-500">SaaS</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {saasNavSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-3">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/saas" && pathname.startsWith(item.href));
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-orange-500/10 text-orange-500"
                            : "text-text-2 hover:bg-surface-2 hover:text-text"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive ? "text-orange-500" : "text-text-3"
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-kfm-border p-3 space-y-1">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-orange-500 hover:bg-orange-500/10"
          >
            <ChefHat className="h-4 w-4 text-text-3" />
            Restaurant
          </Link>
          <Link
            href="/order"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
          >
            <Eye className="h-4 w-4 text-text-3" />
            Voir la page publique
          </Link>
          <div className="flex items-center gap-2 px-3 py-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-kfm-danger hover:bg-kfm-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-kfm-border bg-surface/80 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-text-3 hover:bg-surface-2 lg:hidden"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1">
              <Shield className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-500">SUPER_ADMIN</span>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white"
              title={
                user
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
                  : "Super Admin"
              }
            >
              {user
                ? (
                    (user.firstName?.[0] || "") + (user.lastName?.[0] || "")
                  ).toUpperCase() || user.email?.[0]?.toUpperCase() || "SA"
                : "SA"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
