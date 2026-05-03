"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  DollarSign,
  User,
  Users,
  ToggleLeft,
  X,
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Shield,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authHeaders } from "@/lib/constants";
import { NotificationBell } from "@/components/kfm-ui/notification-bell";
import { SocketProvider } from "@/components/providers/socket-provider";
import { DriverSocketListener } from "@/components/driver/socket-listener";

const driverNavItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/driver/dashboard" },
  { id: "deliveries", label: "Livraisons", icon: Truck, href: "/driver/deliveries" },
  { id: "earnings", label: "Revenus", icon: DollarSign, href: "/driver/earnings" },
  { id: "profile", label: "Profil", icon: User, href: "/driver/profile" },
  { id: "availability", label: "Disponibilite", icon: ToggleLeft, href: "/driver/availability" },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [driverName, setDriverName] = useState("Livreur");
  const [isOnline, setIsOnline] = useState(false);

  // Fetch driver profile for the top bar
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/driver/profile", {
          headers: authHeaders(),
        });
        const result = await res.json();
        if (result.success && result.data) {
          setDriverName(`${result.data.firstName} ${result.data.lastName}`);
          setIsOnline(result.data.isAvailable);
        }
      } catch {
        // Silently fail
      }
    }
    fetchProfile();
  }, []);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return next;
    });
  };

  return (
    <SocketProvider rooms={["drivers"]}>
    <DriverSocketListener />
    <div className="min-h-screen bg-bg">
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
          "fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-kfm-border bg-surface transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-kfm-border px-4">
          <Link href="/driver/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-kfm-secondary text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-text">KFM</span>
              <span className="ml-1 text-xs font-medium text-text-3">Livreur</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {driverNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-kfm-sm px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-kfm-secondary/10 text-kfm-secondary"
                        : "text-text-2 hover:bg-surface-2 hover:text-text"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-kfm-secondary" : "text-text-3"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-kfm-border p-3 space-y-1">
          <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-3">Services</p>
          <Link
            href="/admin/dashboard"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-kfm-danger hover:bg-kfm-danger/10"
          >
            <Shield className="h-4 w-4 text-text-3" />
            Admin
          </Link>
          <Link
            href="/kitchen/orders"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-kfm-accent hover:bg-kfm-accent/10"
          >
            <ChefHat className="h-4 w-4 text-text-3" />
            Cuisine
          </Link>
          <Link
            href="/order"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
          >
            <Users className="h-4 w-4 text-text-3" />
            Portail Client
          </Link>
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
          >
            <Image src="/logo.svg" alt="KFM" width={16} height={16} />
            Restaurant
          </Link>
          <hr className="border-kfm-border my-1" />
          <button
            onClick={toggleDark}
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-text-3" />
            ) : (
              <Moon className="h-4 w-4 text-text-3" />
            )}
            {darkMode ? "Mode clair" : "Mode sombre"}
          </button>
          <Link
            href="/customer/login"
            className="flex w-full items-center gap-3 rounded-kfm-sm px-3 py-2 text-sm font-medium text-kfm-danger hover:bg-kfm-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Deconnexion
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-kfm-border bg-surface/80 px-4 backdrop-blur lg:px-6">
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
          <h1 className="text-lg font-semibold text-text">
            {driverNavItems.find((i) => pathname === i.href)?.label ?? "Portail Livreur"}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {/* Online indicator */}
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-kfm-success" />
                  <span className="hidden text-xs font-medium text-kfm-success sm:inline">
                    En ligne
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-text-3" />
                  <span className="hidden text-xs font-medium text-text-3 sm:inline">
                    Hors ligne
                  </span>
                </>
              )}
            </div>
            {/* Driver avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-secondary text-xs font-bold text-white">
              {driverName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </SocketProvider>
  );
}
