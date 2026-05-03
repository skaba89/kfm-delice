"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Users,
  ShoppingCart,
  TrendingUp,
  Download,
  Shield,
  Crown,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type RestaurantStatus = "active" | "suspended" | "trial";
type PlanType = "free" | "pro" | "enterprise";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo?: string;
  status: RestaurantStatus;
  plan: PlanType;
  adminName: string;
  adminEmail: string;
  description: string;
  cuisine: string;
  ordersToday: number;
  revenueToday: number;
  totalOrders: number;
  totalRevenue: number;
  rating: number;
  createdAt: string;
  lastActive: string;
  deliveryRadius: number;
  openingTime: string;
  closingTime: string;
}

// ──────────────────────────────────────────────
// Sample Data — Guinean Restaurants
// ──────────────────────────────────────────────

const initialRestaurants: Restaurant[] = [
  {
    id: "rest-001",
    name: "Le Jardin de Conakry",
    slug: "jardin-conakry",
    address: "45 Ave de la Republique, Almamya",
    city: "Conakry",
    phone: "+224 622 11 22 33",
    email: "contact@jardin-conakry.com",
    status: "active",
    plan: "enterprise",
    adminName: "Mamadou Bah",
    adminEmail: "mamadou@jardin-conakry.com",
    description: "Restaurant gastronomique offrant les meilleurs plats guineens et africains dans un cadre prestigieux.",
    cuisine: "Gastronomie guineenne",
    ordersToday: 89,
    revenueToday: 2_450_000,
    totalOrders: 12_450,
    totalRevenue: 345_000_000,
    rating: 4.8,
    createdAt: "2024-01-15",
    lastActive: "2025-01-15 14:32",
    deliveryRadius: 15,
    openingTime: "08:00",
    closingTime: "23:00",
  },
  {
    id: "rest-002",
    name: "Saveurs du Fouta",
    slug: "saveurs-fouta",
    address: "12 Rue du Commerce, Dixinn",
    city: "Conakry",
    phone: "+224 628 44 55 66",
    email: "info@saveurs-fouta.com",
    status: "active",
    plan: "pro",
    adminName: "Fatoumata Diallo",
    adminEmail: "fatoumata@saveurs-fouta.com",
    description: "Cuisine traditionnelle du Fouta Djallon avec des ingredients biologiques locaux.",
    cuisine: "Traditionnelle Fouta",
    ordersToday: 67,
    revenueToday: 1_890_000,
    totalOrders: 8_920,
    totalRevenue: 215_000_000,
    rating: 4.6,
    createdAt: "2024-02-20",
    lastActive: "2025-01-15 13:55",
    deliveryRadius: 10,
    openingTime: "09:00",
    closingTime: "22:00",
  },
  {
    id: "rest-003",
    name: "Restaurant Petit Bateau",
    slug: "petit-bateau",
    address: "78 Corniche Nord, Kaloum",
    city: "Conakry",
    phone: "+224 625 77 88 99",
    email: "reservation@petit-bateau.com",
    status: "active",
    plan: "pro",
    adminName: "Ibrahima Sow",
    adminEmail: "ibrahima@petit-bateau.com",
    description: "Specialites de poisson frais et fruits de mer, situe face a la mer.",
    cuisine: "Fruits de mer & Poissons",
    ordersToday: 54,
    revenueToday: 1_340_000,
    totalOrders: 6_780,
    totalRevenue: 178_000_000,
    rating: 4.5,
    createdAt: "2024-03-10",
    lastActive: "2025-01-15 12:40",
    deliveryRadius: 8,
    openingTime: "10:00",
    closingTime: "22:30",
  },
  {
    id: "rest-004",
    name: "Chez Maman Aminata",
    slug: "maman-aminata",
    address: "23 Carrefour Madina, Matam",
    city: "Conakry",
    phone: "+224 621 33 44 55",
    email: "maman.aminata@gmail.com",
    status: "trial",
    plan: "free",
    adminName: "Aminata Camara",
    adminEmail: "aminata.camara@gmail.com",
    description: "Cuisine maison authentique guineenne. Plats traditionnels prepares avec amour.",
    cuisine: "Cuisine maison guineenne",
    ordersToday: 48,
    revenueToday: 1_120_000,
    totalOrders: 3_200,
    totalRevenue: 85_000_000,
    rating: 4.7,
    createdAt: "2024-06-01",
    lastActive: "2025-01-15 14:10",
    deliveryRadius: 5,
    openingTime: "07:00",
    closingTime: "21:00",
  },
  {
    id: "rest-005",
    name: "La Terrasse de Kaloum",
    slug: "terrasse-kaloum",
    address: "56 Blvd du Commerce, Kaloum",
    city: "Conakry",
    phone: "+224 626 55 66 77",
    email: "la-terrasse@kaloum.com",
    status: "active",
    plan: "enterprise",
    adminName: "Oumar Sylla",
    adminEmail: "omar@terrasse-kaloum.com",
    description: "Restaurant moderne avec terrasse panoramique. Cuisine fusion afro-contemporaine.",
    cuisine: "Fusion Afro-Contemporaine",
    ordersToday: 42,
    revenueToday: 980_000,
    totalOrders: 5_100,
    totalRevenue: 142_000_000,
    rating: 4.4,
    createdAt: "2024-04-05",
    lastActive: "2025-01-15 11:30",
    deliveryRadius: 12,
    openingTime: "11:00",
    closingTime: "01:00",
  },
  {
    id: "rest-006",
    name: "Le Mandingue",
    slug: "le-mandingue",
    address: "8 Ave Samory Toure, Kipe",
    city: "Conakry",
    phone: "+224 623 88 99 00",
    email: "contact@le-mandingue.com",
    status: "suspended",
    plan: "pro",
    adminName: "Sekou Toure",
    adminEmail: "sekou@le-mandingue.com",
    description: "Specialites mandingues dans un cadre traditionnel. Musique live le weekend.",
    cuisine: "Cuisine Mandingue",
    ordersToday: 0,
    revenueToday: 0,
    totalOrders: 2_890,
    totalRevenue: 78_000_000,
    rating: 4.2,
    createdAt: "2024-01-28",
    lastActive: "2024-12-20 18:00",
    deliveryRadius: 10,
    openingTime: "12:00",
    closingTime: "00:00",
  },
  {
    id: "rest-007",
    name: "Chez Karamoko",
    slug: "chez-karamoko",
    address: "34 Quartier Sandervalia",
    city: "Conakry",
    phone: "+224 624 11 22 33",
    email: "karamoko.food@gmail.com",
    status: "trial",
    plan: "free",
    adminName: "Karamoko Bangoura",
    adminEmail: "karamoko.b@gmail.com",
    description: "Fast-food guineen de qualite. Brochettes, alloco, attieke et plus encore.",
    cuisine: "Fast-food guineen",
    ordersToday: 31,
    revenueToday: 620_000,
    totalOrders: 1_560,
    totalRevenue: 32_000_000,
    rating: 4.1,
    createdAt: "2024-08-15",
    lastActive: "2025-01-15 13:20",
    deliveryRadius: 4,
    openingTime: "08:00",
    closingTime: "23:00",
  },
  {
    id: "rest-008",
    name: "Restaurant Belle Vue",
    slug: "belle-vue",
    address: "91 Cite de la Butte, Ratoma",
    city: "Conakry",
    phone: "+224 627 44 55 66",
    email: "bellevue@restaurant.com",
    status: "active",
    plan: "pro",
    adminName: "Mariam Conde",
    adminEmail: "mariam@belle-vue.com",
    description: "Vue panoramique imprenable sur Conakry. Parfait pour evenements et diners romantiques.",
    cuisine: "Internationale",
    ordersToday: 16,
    revenueToday: 520_000,
    totalOrders: 4_200,
    totalRevenue: 125_000_000,
    rating: 4.3,
    createdAt: "2024-05-22",
    lastActive: "2025-01-15 10:45",
    deliveryRadius: 15,
    openingTime: "10:00",
    closingTime: "00:30",
  },
];

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function StatusBadge({ status }: { status: RestaurantStatus }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-0 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Actif
        </Badge>
      );
    case "suspended":
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-0 gap-1">
          <XCircle className="h-3 w-3" /> Suspendu
        </Badge>
      );
    case "trial":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-0 gap-1">
          <AlertCircle className="h-3 w-3" /> Essai
        </Badge>
      );
  }
}

function PlanBadge({ plan }: { plan: PlanType }) {
  switch (plan) {
    case "free":
      return (
        <Badge variant="outline" className="gap-1 border-text-3">
          <Zap className="h-3 w-3" /> Gratuit
        </Badge>
      );
    case "pro":
      return (
        <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
          <Star className="h-3 w-3" /> Pro
        </Badge>
      );
    case "enterprise":
      return (
        <Badge variant="outline" className="gap-1 border-violet-500 text-violet-500">
          <Crown className="h-3 w-3" /> Enterprise
        </Badge>
      );
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-text-3"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-text-3">({rating})</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Empty form state
// ──────────────────────────────────────────────

const emptyForm: Omit<Restaurant, "id" | "ordersToday" | "revenueToday" | "totalOrders" | "totalRevenue" | "rating" | "createdAt" | "lastActive"> = {
  name: "",
  slug: "",
  address: "",
  city: "Conakry",
  phone: "",
  email: "",
  status: "trial",
  plan: "free",
  adminName: "",
  adminEmail: "",
  description: "",
  cuisine: "",
  deliveryRadius: 5,
  openingTime: "08:00",
  closingTime: "22:00",
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export function SaasRestaurantsView() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RestaurantStatus>("all");
  const [planFilter, setPlanFilter] = useState<"all" | PlanType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  // ── Filtering ──
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.adminName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesPlan = planFilter === "all" || r.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [restaurants, searchQuery, statusFilter, planFilter]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: restaurants.length,
    active: restaurants.filter((r) => r.status === "active").length,
    trial: restaurants.filter((r) => r.status === "trial").length,
    suspended: restaurants.filter((r) => r.status === "suspended").length,
  }), [restaurants]);

  // ── Handlers ──
  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (restaurant: Restaurant) => {
    setIsEditing(true);
    setSelectedRestaurant(restaurant);
    setForm({
      name: restaurant.name,
      slug: restaurant.slug,
      address: restaurant.address,
      city: restaurant.city,
      phone: restaurant.phone,
      email: restaurant.email,
      status: restaurant.status,
      plan: restaurant.plan,
      adminName: restaurant.adminName,
      adminEmail: restaurant.adminEmail,
      description: restaurant.description,
      cuisine: restaurant.cuisine,
      deliveryRadius: restaurant.deliveryRadius,
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
    });
    setDialogOpen(true);
  };

  const handleOpenDetail = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setDetailDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.adminName || !form.adminEmail) return;
    if (isEditing && selectedRestaurant) {
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === selectedRestaurant.id
            ? { ...r, ...form }
            : r
        )
      );
    } else {
      const newRestaurant: Restaurant = {
        ...form,
        id: `rest-${String(Date.now())}`,
        ordersToday: 0,
        revenueToday: 0,
        totalOrders: 0,
        totalRevenue: 0,
        rating: 0,
        createdAt: new Date().toISOString().split("T")[0],
        lastActive: new Date().toISOString().slice(0, 16),
      };
      setRestaurants((prev) => [newRestaurant, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === "active" ? "suspended" : "active",
            }
          : r
      )
    );
  };

  const handleDelete = (id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Restaurants", value: stats.total, icon: Building2, color: "bg-orange-500/10 text-orange-500" },
          { label: "Actifs", value: stats.active, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "En essai", value: stats.trial, icon: AlertCircle, color: "bg-amber-500/10 text-amber-500" },
          { label: "Suspendus", value: stats.suspended, icon: XCircle, color: "bg-red-500/10 text-red-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-3">{s.label}</p>
                <p className="text-xl font-bold text-text">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <Input
              placeholder="Rechercher un restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="trial">Essai</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
          {/* Plan Filter */}
          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les plans</SelectItem>
              <SelectItem value="free">Gratuit</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleOpenCreate} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="space-y-3">
        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-text-3 mb-4" />
              <p className="text-lg font-medium text-text-2">Aucun restaurant trouve</p>
              <p className="text-sm text-text-3 mt-1">Essayez de modifier vos filtres de recherche</p>
            </CardContent>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 lg:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Restaurant Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 flex-shrink-0">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-text">{restaurant.name}</h3>
                        <StatusBadge status={restaurant.status} />
                        <PlanBadge plan={restaurant.plan} />
                      </div>
                      <p className="text-xs text-text-3 mt-1 truncate">{restaurant.description}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-text-3">
                          <MapPin className="h-3 w-3" /> {restaurant.address}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-text-3">
                          <Phone className="h-3 w-3" /> {restaurant.phone}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-text-3">
                          <Clock className="h-3 w-3" /> {restaurant.openingTime} - {restaurant.closingTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-text-3">Commandes</p>
                      <p className="text-lg font-bold text-text">{restaurant.ordersToday}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-3">Revenu</p>
                      <p className="text-sm font-bold text-text">{formatCurrency(restaurant.revenueToday)}</p>
                    </div>
                    <div className="hidden sm:block">
                      <StarRating rating={restaurant.rating} />
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetail(restaurant)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={restaurant.status === "active"}
                      onCheckedChange={() => handleToggleStatus(restaurant.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(restaurant)}>
                          <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDetail(restaurant)}>
                          <Eye className="mr-2 h-4 w-4" /> Voir details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(restaurant.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Admin info row */}
                <div className="mt-3 pt-3 border-t border-kfm-border flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-text-3">
                    <Users className="h-3 w-3" /> Admin: {restaurant.adminName}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-3">
                    <Mail className="h-3 w-3" /> {restaurant.adminEmail}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-3">
                    <ShoppingCart className="h-3 w-3" /> Total: {restaurant.totalOrders.toLocaleString("fr-FR")} commandes
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-3">
                    <TrendingUp className="h-3 w-3" /> Revenu total: {formatCurrency(restaurant.totalRevenue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier le restaurant" : "Nouveau restaurant"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations du restaurant."
                : "Remplissez les informations pour creer un nouveau restaurant."}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="contact" className="flex-1">Contact</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1">Administrateur</TabsTrigger>
              <TabsTrigger value="config" className="flex-1">Configuration</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom du restaurant *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                    placeholder="Ex: Le Jardin de Conakry"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="jardin-conakry" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Decrivez le restaurant..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Type de cuisine</Label>
                  <Input value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} placeholder="Ex: Gastronomie guineenne" />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conakry">Conakry</SelectItem>
                      <SelectItem value="Kindia">Kindia</SelectItem>
                      <SelectItem value="Labe">Labe</SelectItem>
                      <SelectItem value="Kankan">Kankan</SelectItem>
                      <SelectItem value="Nzerekore">Nzerekore</SelectItem>
                      <SelectItem value="Mamou">Mamou</SelectItem>
                      <SelectItem value="Boke">Boke</SelectItem>
                      <SelectItem value="Faranah">Faranah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Adresse complete</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="45 Ave de la Republique, Almamya" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Telephone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+224 6XX XX XX XX" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@restaurant.com" />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="admin" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom de l&apos;administrateur *</Label>
                  <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Mamadou Bah" />
                </div>
                <div className="space-y-2">
                  <Label>Email de l&apos;administrateur *</Label>
                  <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@restaurant.com" />
                </div>
              </div>
              <p className="text-xs text-text-3">
                Un compte administrateur sera automatiquement cree pour ce restaurant. Un email de bienvenue sera envoye.
              </p>
            </TabsContent>
            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as RestaurantStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="trial">En essai</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan d&apos;abonnement</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v as PlanType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuit</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rayon de livraison (km)</Label>
                  <Input type="number" value={form.deliveryRadius} onChange={(e) => setForm({ ...form, deliveryRadius: Number(e.target.value) })} min={1} max={50} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Heure d&apos;ouverture</Label>
                    <Input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure de fermeture</Label>
                    <Input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              {isEditing ? "Enregistrer" : "Creer le restaurant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">{selectedRestaurant.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedRestaurant.status} />
                      <PlanBadge plan={selectedRestaurant.plan} />
                      <StarRating rating={selectedRestaurant.rating} />
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <p className="text-sm text-text-2">{selectedRestaurant.description}</p>
                  <p className="text-xs text-text-3 mt-1">Cuisine: {selectedRestaurant.cuisine}</p>
                </div>

                <Separator />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Commandes aujourd'hui", value: selectedRestaurant.ordersToday.toString(), icon: ShoppingCart },
                    { label: "Revenu du jour", value: formatCurrency(selectedRestaurant.revenueToday), icon: TrendingUp },
                    { label: "Total commandes", value: selectedRestaurant.totalOrders.toLocaleString("fr-FR"), icon: ShoppingCart },
                    { label: "Revenu total", value: formatCurrency(selectedRestaurant.totalRevenue), icon: TrendingUp },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-kfm-border p-3">
                      <p className="text-xs text-text-3">{s.label}</p>
                      <p className="text-sm font-bold text-text mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Contact & Config */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text">Contact</h4>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm text-text-2"><MapPin className="h-4 w-4 text-text-3" />{selectedRestaurant.address}, {selectedRestaurant.city}</p>
                      <p className="flex items-center gap-2 text-sm text-text-2"><Phone className="h-4 w-4 text-text-3" />{selectedRestaurant.phone}</p>
                      <p className="flex items-center gap-2 text-sm text-text-2"><Mail className="h-4 w-4 text-text-3" />{selectedRestaurant.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text">Configuration</h4>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm text-text-2"><Clock className="h-4 w-4 text-text-3" />{selectedRestaurant.openingTime} - {selectedRestaurant.closingTime}</p>
                      <p className="flex items-center gap-2 text-sm text-text-2"><MapPin className="h-4 w-4 text-text-3" />Rayon de livraison: {selectedRestaurant.deliveryRadius} km</p>
                      <p className="flex items-center gap-2 text-sm text-text-2"><Shield className="h-4 w-4 text-text-3" />Admin: {selectedRestaurant.adminName}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-text">Informations du compte</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-text-3">ID:</p><p className="text-text">{selectedRestaurant.id}</p>
                    <p className="text-text-3">Slug:</p><p className="text-text">{selectedRestaurant.slug}</p>
                    <p className="text-text-3">Cree le:</p><p className="text-text">{selectedRestaurant.createdAt}</p>
                    <p className="text-text-3">Derniere activite:</p><p className="text-text">{selectedRestaurant.lastActive}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
