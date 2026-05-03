"use client";

import React, { useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
  Calendar,

  ArrowUpRight,

  Activity,

  Download,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
} from "recharts";

// ──────────────────────────────────────────────
// Sample Data
// ──────────────────────────────────────────────

const revenueData = [
  { date: "Jan", revenue: 28_500_000, orders: 4_200 },
  { date: "Fev", revenue: 31_200_000, orders: 4_650 },
  { date: "Mar", revenue: 35_800_000, orders: 5_100 },
  { date: "Avr", revenue: 33_400_000, orders: 4_800 },
  { date: "Mai", revenue: 38_900_000, orders: 5_600 },
  { date: "Jun", revenue: 42_100_000, orders: 6_020 },
  { date: "Jul", revenue: 45_600_000, orders: 6_500 },
  { date: "Aou", revenue: 41_200_000, orders: 5_890 },
  { date: "Sep", revenue: 48_300_000, orders: 6_900 },
  { date: "Oct", revenue: 52_700_000, orders: 7_530 },
  { date: "Nov", revenue: 56_100_000, orders: 8_010 },
  { date: "Dec", revenue: 62_800_000, orders: 8_970 },
];

const userGrowthData = [
  { date: "Jan", users: 520, newUsers: 120 },
  { date: "Fev", users: 640, newUsers: 120 },
  { date: "Mar", users: 790, newUsers: 150 },
  { date: "Avr", users: 920, newUsers: 130 },
  { date: "Mai", users: 1_080, newUsers: 160 },
  { date: "Jun", users: 1_250, newUsers: 170 },
  { date: "Jul", users: 1_430, newUsers: 180 },
  { date: "Aou", users: 1_570, newUsers: 140 },
  { date: "Sep", users: 1_720, newUsers: 150 },
  { date: "Oct", users: 1_890, newUsers: 170 },
  { date: "Nov", users: 2_050, newUsers: 160 },
  { date: "Dec", users: 2_250, newUsers: 200 },
];

const ordersByRestaurant = [
  { name: "Le Jardin de Conakry", orders: 12_450, revenue: 345_000_000 },
  { name: "Saveurs du Fouta", orders: 8_920, revenue: 215_000_000 },
  { name: "Rest. Petit Bateau", orders: 6_780, revenue: 178_000_000 },
  { name: "La Terrasse de Kaloum", orders: 5_100, revenue: 142_000_000 },
  { name: "Chez Maman Aminata", orders: 3_200, revenue: 85_000_000 },
  { name: "Restaurant Belle Vue", orders: 4_200, revenue: 125_000_000 },
  { name: "Chez Karamoko", orders: 1_560, revenue: 32_000_000 },
  { name: "Le Mandingue", orders: 2_890, revenue: 78_000_000 },
];

const paymentMethodData = [
  { name: "Orange Money", value: 42, color: "#F97316" },
  { name: "CinetPay", value: 28, color: "#8B5CF6" },
  { name: "Especes", value: 18, color: "#22C55E" },
  { name: "MTN MoMo", value: 12, color: "#FBBF24" },
];

const topMenuItems = [
  { name: "Riz sauce arachide", restaurant: "Le Jardin de Conakry", quantity: 2_340, revenue: 35_100_000 },
  { name: "Poulet Braise", restaurant: "Chez Karamoko", quantity: 1_890, revenue: 18_900_000 },
  { name: "Thieboudienne", restaurant: "Saveurs du Fouta", quantity: 1_760, revenue: 21_120_000 },
  { name: "Grilled Fish Special", restaurant: "Rest. Petit Bateau", quantity: 1_540, revenue: 27_720_000 },
  { name: "To Sauce Feuille", restaurant: "Chez Maman Aminata", quantity: 1_420, revenue: 11_360_000 },
  { name: "Brochettes Mixtes", restaurant: "La Terrasse de Kaloum", quantity: 1_280, revenue: 17_920_000 },
  { name: "Foutou Banane", restaurant: "Saveurs du Fouta", quantity: 1_150, revenue: 13_800_000 },
  { name: "Alloco Poisson", restaurant: "Chez Karamoko", quantity: 980, revenue: 9_800_000 },
  { name: "Mafe Gambit", restaurant: "Le Mandingue", quantity: 890, revenue: 14_240_000 },
  { name: "Salade Verte Royale", restaurant: "La Terrasse de Kaloum", quantity: 760, revenue: 7_600_000 },
];

const dailyOrdersData = [
  { day: "Lun", orders: 420 },
  { day: "Mar", orders: 380 },
  { day: "Mer", orders: 510 },
  { day: "Jeu", orders: 470 },
  { day: "Ven", orders: 560 },
  { day: "Sam", orders: 620 },
  { day: "Dim", orders: 390 },
];

const peakHoursData = [
  { hour: "08h", orders: 45 },
  { hour: "09h", orders: 120 },
  { hour: "10h", orders: 85 },
  { hour: "11h", orders: 200 },
  { hour: "12h", orders: 380 },
  { hour: "13h", orders: 420 },
  { hour: "14h", orders: 180 },
  { hour: "15h", orders: 90 },
  { hour: "16h", orders: 60 },
  { hour: "17h", orders: 140 },
  { hour: "18h", orders: 280 },
  { hour: "19h", orders: 350 },
  { hour: "20h", orders: 220 },
  { hour: "21h", orders: 110 },
  { hour: "22h", orders: 40 },
];

// ──────────────────────────────────────────────
// KPI Summary
// ──────────────────────────────────────────────

const kpiData = {
  totalRevenue: 62_800_000,
  totalOrders: 8_970,
  totalUsers: 2_250,
  avgOrderValue: 7_000,
  revenueChange: "+18.5%",
  ordersChange: "+12.3%",
  usersChange: "+25.1%",
  aovChange: "+5.4%",
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export function SaasAnalyticsView() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "12m">("12m");

  const totalRevenueAll = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrdersAll = revenueData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" /> Donnees en temps reel
          </Badge>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="12m">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-3">Revenu total</p>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-text mt-2">{formatCurrency(totalRevenueAll)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">{kpiData.revenueChange}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-3">Commandes totales</p>
              <ShoppingCart className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-text mt-2">{totalOrdersAll.toLocaleString("fr-FR")}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">{kpiData.ordersChange}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-3">Utilisateurs</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-text mt-2">{kpiData.totalUsers.toLocaleString("fr-FR")}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">{kpiData.usersChange}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-3">Panier moyen</p>
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-text mt-2">{formatCurrency(kpiData.avgOrderValue)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">{kpiData.aovChange}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + User Growth Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenus mensuels</CardTitle>
            <CardDescription>Evolution des revenus sur 12 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="saasRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? formatCurrency(value) : value.toLocaleString("fr-FR"),
                      name === "revenue" ? "Revenu" : "Commandes",
                    ]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#F97316" fill="url(#saasRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Croissance des utilisateurs</CardTitle>
            <CardDescription>Nombre total et nouveaux utilisateurs par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="saasUserGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString("fr-FR"),
                      name === "users" ? "Total" : "Nouveaux",
                    ]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#8B5CF6" fill="url(#saasUserGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="newUsers" stroke="#22C55E" strokeWidth={1.5} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Restaurant + Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commandes par restaurant</CardTitle>
            <CardDescription>Repartition des commandes entre les restaurants</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByRestaurant} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString("fr-FR"), "Commandes"]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="orders" fill="#F97316" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Methodes de paiement</CardTitle>
            <CardDescription>Distribution des paiements par methode</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Part de marche"]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string, entry: any) => (
                      <span style={{ color: entry?.color, fontSize: "12px", fontWeight: 500 }}>
                        {value} ({entry?.payload?.value}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours + Daily Pattern */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Heures de pointe</CardTitle>
            <CardDescription>Volume de commandes par heure de la journee</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Commandes"]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="orders" fill="#F97316" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Repartition par jour</CardTitle>
            <CardDescription>Volume moyen de commandes par jour de la semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyOrdersData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Commandes"]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-orange-500" />
            Top 10 plats les plus vendus
          </CardTitle>
          <CardDescription>Plats les plus commandes sur l&apos;ensemble de la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Plat</TableHead>
                <TableHead className="hidden sm:table-cell">Restaurant</TableHead>
                <TableHead className="text-right">Quantite</TableHead>
                <TableHead className="text-right">Revenu</TableHead>
                <TableHead className="text-right hidden md:table-cell">Part</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topMenuItems.map((item, idx) => {
                const maxQuantity = topMenuItems[0].quantity;
                const percentage = ((item.quantity / topMenuItems.reduce((s, i) => s + i.quantity, 0)) * 100).toFixed(1);
                return (
                  <TableRow key={item.name}>
                    <TableCell className="font-bold text-text-3">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-text-3">{item.restaurant}</TableCell>
                    <TableCell className="text-right font-medium">{item.quantity.toLocaleString("fr-FR")}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={(item.quantity / maxQuantity) * 100} className="w-16 h-1.5" />
                        <span className="text-xs text-text-3 w-10">{percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restaurant Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            Revenus par restaurant
          </CardTitle>
          <CardDescription>Contribution de chaque restaurant au revenu total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ordersByRestaurant
            .sort((a, b) => b.revenue - a.revenue)
            .map((restaurant) => {
              const totalRev = ordersByRestaurant.reduce((s, r) => s + r.revenue, 0);
              const percentage = ((restaurant.revenue / totalRev) * 100).toFixed(1);
              return (
                <div key={restaurant.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-text truncate">{restaurant.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-text">{formatCurrency(restaurant.revenue)}</span>
                      <span className="text-text-3 w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
