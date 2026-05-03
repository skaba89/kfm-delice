"use client";

import React, { useState } from "react";
import {
  Building2,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  CreditCard,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Store,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { TopItemsChart } from "@/components/charts/top-items-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// ──────────────────────────────────────────────
// Sample Data — Guinean context
// ──────────────────────────────────────────────

const platformStats = {
  totalRestaurants: 24,
  totalOrdersToday: 347,
  totalRevenueToday: 8_750_000,
  activeUsers: 1_842,
  changeRestaurants: "+3 ce mois",
  changeOrders: "+12.5%",
  changeRevenue: "+8.2%",
  changeUsers: "+156 cette semaine",
};

const revenueData = [
  { date: "01 Jan", revenue: 5_200_000, orders: 210 },
  { date: "05 Jan", revenue: 6_800_000, orders: 280 },
  { date: "10 Jan", revenue: 5_900_000, orders: 240 },
  { date: "15 Jan", revenue: 7_100_000, orders: 310 },
  { date: "20 Jan", revenue: 8_400_000, orders: 350 },
  { date: "25 Jan", revenue: 7_600_000, orders: 290 },
  { date: "30 Jan", revenue: 9_200_000, orders: 380 },
  { date: "05 Fev", revenue: 8_100_000, orders: 340 },
  { date: "10 Fev", revenue: 9_500_000, orders: 400 },
  { date: "15 Fev", revenue: 8_750_000, orders: 347 },
];

const topRestaurants = [
  { name: "Le Jardin de Conakry", quantity: 89, revenue: 2_450_000 },
  { name: "Saveurs du Fouta", quantity: 67, revenue: 1_890_000 },
  { name: "Restaurant Petit Bateau", quantity: 54, revenue: 1_340_000 },
  { name: "Chez Maman Aminata", quantity: 48, revenue: 1_120_000 },
  { name: "La Terrasse de Kaloum", quantity: 42, revenue: 980_000 },
];

interface ActivityItem {
  id: string;
  type: "new_restaurant" | "new_order" | "payment" | "user_signup" | "alert" | "milestone";
  message: string;
  timestamp: string;
  restaurant?: string;
}

const recentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "new_order",
    message: "Nouvelle commande #4521 de 125 000 FG",
    timestamp: "Il y a 5 min",
    restaurant: "Le Jardin de Conakry",
  },
  {
    id: "2",
    type: "payment",
    message: "Paiement recu: 350 000 FG via Orange Money",
    timestamp: "Il y a 12 min",
    restaurant: "Saveurs du Fouta",
  },
  {
    id: "3",
    type: "user_signup",
    message: "Nouvel utilisateur inscrit: Mamadou Bah",
    timestamp: "Il y a 18 min",
  },
  {
    id: "4",
    type: "new_restaurant",
    message: "Nouveau restaurant enregistre: Chez Fatou",
    timestamp: "Il y a 25 min",
  },
  {
    id: "5",
    type: "milestone",
    message: "Objectif atteint: 1 800 utilisateurs actifs",
    timestamp: "Il y a 32 min",
  },
  {
    id: "6",
    type: "alert",
    message: "Restaurant 'Le Mandingue' - Abonnement expire demain",
    timestamp: "Il y a 45 min",
  },
  {
    id: "7",
    type: "payment",
    message: "Commission plateforme: 87 500 FG (10%)",
    timestamp: "Il y a 1h",
  },
  {
    id: "8",
    type: "new_order",
    message: "Commande en masse: 25 plats pour evenement",
    timestamp: "Il y a 1h 30",
    restaurant: "Restaurant Petit Bateau",
  },
  {
    id: "9",
    type: "user_signup",
    message: "Nouvel utilisateur: Aissatou Diallo (Livreur)",
    timestamp: "Il y a 2h",
  },
  {
    id: "10",
    type: "new_order",
    message: "Nouvelle commande #4518 de 78 000 FG",
    timestamp: "Il y a 2h 15min",
    restaurant: "Chez Maman Aminata",
  },
];

const quickActions = [
  { label: "Ajouter un restaurant", icon: Store, href: "/saas/restaurants", color: "bg-orange-500" },
  { label: "Gerer les plans", icon: CreditCard, href: "/saas/billing", color: "bg-emerald-500" },
  { label: "Voir l'analytique", icon: BarChart3, href: "/saas/analytics", color: "bg-violet-500" },
  { label: "Gerer la page publique", icon: Activity, href: "/saas/public-page", color: "bg-cyan-500" },
];

const restaurantStatuses = [
  { name: "Le Jardin de Conakry", status: "active" as const, orders: 89 },
  { name: "Saveurs du Fouta", status: "active" as const, orders: 67 },
  { name: "Restaurant Petit Bateau", status: "active" as const, orders: 54 },
  { name: "Chez Maman Aminata", status: "trial" as const, orders: 48 },
  { name: "La Terrasse de Kaloum", status: "active" as const, orders: 42 },
  { name: "Le Mandingue", status: "suspended" as const, orders: 0 },
  { name: "Chez Karamoko", status: "trial" as const, orders: 31 },
  { name: "Restaurant Belle Vue", status: "active" as const, orders: 16 },
];

// ──────────────────────────────────────────────
// Activity Icon Mapper
// ──────────────────────────────────────────────

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "new_order":
      return <ShoppingCart className="h-4 w-4 text-orange-500" />;
    case "payment":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case "user_signup":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "new_restaurant":
      return <Building2 className="h-4 w-4 text-violet-500" />;
    case "alert":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "milestone":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    default:
      return <Clock className="h-4 w-4 text-text-3" />;
  }
}

function getStatusBadge(status: "active" | "suspended" | "trial") {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">Actif</Badge>;
    case "suspended":
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">Suspendu</Badge>;
    case "trial":
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0">Essai</Badge>;
  }
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function SaasDashboardView() {
  const [activityFilter, setActivityFilter] = useState<"all" | "alerts" | "orders" | "payments">("all");

  const filteredActivity =
    activityFilter === "all"
      ? recentActivity
      : recentActivity.filter((a) => {
          if (activityFilter === "alerts") return a.type === "alert" || a.type === "milestone";
          if (activityFilter === "orders") return a.type === "new_order";
          if (activityFilter === "payments") return a.type === "payment";
          return true;
        });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-kfm-border bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bienvenue sur KFM Delice SaaS</h2>
            <p className="mt-1 text-orange-100">
              Vue d&apos;ensemble de votre plateforme de gestion de restaurants en Guinee
            </p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <Button variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30 border-0">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau restaurant
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              <BarChart3 className="mr-2 h-4 w-4" />
              Rapport mensuel
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Restaurants"
          value={platformStats.totalRestaurants.toString()}
          change={platformStats.changeRestaurants}
          changeType="positive"
          icon={Building2}
        />
        <StatCard
          label="Commandes aujourd'hui"
          value={platformStats.totalOrdersToday.toLocaleString("fr-FR")}
          change={platformStats.changeOrders}
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatCard
          label="Revenu du jour"
          value={formatCurrency(platformStats.totalRevenueToday)}
          change={platformStats.changeRevenue}
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          label="Utilisateurs actifs"
          value={platformStats.activeUsers.toLocaleString("fr-FR")}
          change={platformStats.changeUsers}
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenus de la plateforme</CardTitle>
            <CardDescription>Evolution des revenus sur les 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} height={280} showOrders />
          </CardContent>
        </Card>

        {/* Top Restaurants Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Meilleurs restaurants</CardTitle>
            <CardDescription>Classement par nombre de commandes aujourd&apos;hui</CardDescription>
          </CardHeader>
          <CardContent>
            <TopItemsChart data={topRestaurants} height={280} metric="quantity" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Live Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
            <CardDescription>Acces direct aux fonctionnalites cles</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border border-kfm-border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                  )}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", action.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-text-2 text-center leading-tight">{action.label}</span>
                </a>
              );
            })}
          </CardContent>
        </Card>

        {/* Live Restaurant Status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Statut des restaurants</CardTitle>
            <CardDescription>Commandes en temps reel par restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurantStatuses.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-lg border border-kfm-border p-3 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full flex-shrink-0",
                        r.status === "active" ? "bg-emerald-500" : r.status === "trial" ? "bg-amber-500" : "bg-red-500"
                      )}
                    />
                    <span className="text-sm font-medium text-text truncate">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {getStatusBadge(r.status)}
                    <span className="text-sm text-text-3 w-16 text-right">{r.orders} cmd</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Activite recente</CardTitle>
              <CardDescription>Derniers evenements sur la plateforme</CardDescription>
            </div>
            <div className="flex gap-1">
              {(["all", "alerts", "orders", "payments"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    activityFilter === filter
                      ? "bg-orange-500 text-white"
                      : "bg-surface-2 text-text-2 hover:bg-kfm-border"
                  )}
                >
                  {filter === "all" ? "Tout" : filter === "alerts" ? "Alertes" : filter === "orders" ? "Commandes" : "Paiements"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {filteredActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-surface-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text">{activity.message}</p>
                  {activity.restaurant && (
                    <p className="text-xs text-orange-500 mt-0.5 font-medium">{activity.restaurant}</p>
                  )}
                </div>
                <span className="text-xs text-text-3 flex-shrink-0">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-2">Taux de conversion</p>
                <p className="text-xl font-bold text-text">23.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <ArrowUpRight className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-2">Panier moyen</p>
                <p className="text-xl font-bold text-text">{formatCurrency(25_200)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <TrendingDown className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-2">Taux de retention</p>
                <p className="text-xl font-bold text-text">67.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
