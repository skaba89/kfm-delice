"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2, MapPin, Phone, Mail, Globe, RefreshCcw, AlertCircle,
  Pencil, Loader2, Info, Contact, Armchair, Star, Wifi, Car,
  ShoppingCart, UtensilsCrossed, Package, CalendarCheck,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  website: string | null;
  isActive: boolean;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  indoorCapacity: number | null;
  outdoorCapacity: number | null;
  acceptsDelivery: boolean;
  acceptsDineIn: boolean;
  acceptsTakeaway: boolean;
  acceptsReservations: boolean;
  hasParking: boolean;
  hasWifi: boolean;
  priceRange: number | null;
  createdAt: string;
  updatedAt: string;
}

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  description: string;
  address: string;
  city: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminRestaurantView() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormData>({
    name: "", phone: "", email: "", description: "", address: "", city: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/organizations?limit=1", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const list = json.data.restaurants || json.data || [];
        setRestaurant(list[0] || null);
      } else {
        setError(json.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRestaurant(); }, [fetchRestaurant]);

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!restaurant) return;
    setForm({
      name: restaurant.name,
      phone: restaurant.phone,
      email: restaurant.email || "",
      description: restaurant.description || "",
      address: restaurant.address,
      city: restaurant.city,
    });
    setFormErrors({});
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!restaurant) return;
    if (!form.name.trim()) { setFormErrors({ name: "Requis" }); return; }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/organizations/${restaurant.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setEditOpen(false);
        fetchRestaurant();
      } else {
        setFormErrors({ submit: json.error || "Erreur de mise a jour" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Restaurant</h2>
          <p className="mt-1 text-sm text-text-2">Restaurant courant</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="kfm-skeleton h-56 rounded-kfm-md" />
          <div className="kfm-skeleton h-56 rounded-kfm-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="kfm-skeleton h-48 rounded-kfm-md" />
          <div className="kfm-skeleton h-48 rounded-kfm-md" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Restaurant</h2>
            <p className="mt-1 text-sm text-text-2">Restaurant courant</p>
          </div>
          <button onClick={fetchRestaurant} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <RefreshCcw className="h-4 w-4" /> Reessayer
          </button>
        </div>
        <div className="rounded-kfm-md border border-kfm-danger/30 bg-kfm-danger/5 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-kfm-danger" />
          <p className="mt-3 text-sm font-medium text-kfm-danger">{error}</p>
        </div>
      </div>
    );
  }

  // ── No restaurant ────────────────────────────────────────────────────────
  if (!restaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Restaurant</h2>
          <p className="mt-1 text-sm text-text-2">Restaurant courant</p>
        </div>
        <EmptyState
          icon={Building2}
          title="Aucun restaurant configure"
          description="Aucun restaurant n'a encore ete ajoute a la plateforme."
        />
      </div>
    );
  }

  const r = restaurant;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-kfm-md bg-kfm-secondary/10">
            <Building2 className="h-7 w-7 text-kfm-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">{r.name}</h2>
            <p className="mt-1 text-sm text-text-2">@{r.slug}</p>
          </div>
        </div>
        <button onClick={openEdit} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Pencil className="h-4 w-4" /> Modifier
        </button>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Info card */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-kfm-secondary" /> Informations generales
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-3">Nom</span>
              <span className="text-text font-medium truncate ml-4">{r.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-3">Slug</span>
              <span className="text-kfm-secondary font-mono text-xs">{r.slug}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-3">Statut</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", r.isActive ? "bg-kfm-success/10 text-kfm-success" : "bg-kfm-danger/10 text-kfm-danger")}>
                {r.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            {r.description && (
              <div className="pt-2 border-t border-kfm-border">
                <p className="text-xs text-text-3 mb-1">Description</p>
                <p className="text-sm text-text-2">{r.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact card */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <Contact className="h-4 w-4 text-kfm-secondary" /> Contact
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                <Phone className="h-4 w-4 text-kfm-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-3">Telephone</p>
                <p className="text-sm text-text">{r.phone}</p>
              </div>
            </div>
            {r.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                  <Mail className="h-4 w-4 text-kfm-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-3">Email</p>
                  <p className="text-sm text-text truncate">{r.email}</p>
                </div>
              </div>
            )}
            {r.website && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                  <Globe className="h-4 w-4 text-kfm-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-3">Site web</p>
                  <p className="text-sm text-kfm-secondary truncate">{r.website}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                <MapPin className="h-4 w-4 text-kfm-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-3">Adresse</p>
                <p className="text-sm text-text truncate">{r.address}, {r.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity card */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <Armchair className="h-4 w-4 text-kfm-secondary" /> Capacite & Services
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3 text-center">
                <UtensilsCrossed className="mx-auto h-5 w-5 text-kfm-secondary mb-1" />
                <p className="text-lg font-bold text-text">{r.indoorCapacity ?? "—"}</p>
                <p className="text-[10px] text-text-3">Places interieur</p>
              </div>
              <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3 text-center">
                <Package className="mx-auto h-5 w-5 text-kfm-secondary mb-1" />
                <p className="text-lg font-bold text-text">{r.outdoorCapacity ?? "—"}</p>
                <p className="text-[10px] text-text-3">Places exterieur</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sur place", active: r.acceptsDineIn, icon: UtensilsCrossed },
                { label: "A emporter", active: r.acceptsTakeaway, icon: Package },
                { label: "Livraison", active: r.acceptsDelivery, icon: ShoppingCart },
                { label: "Reservations", active: r.acceptsReservations, icon: CalendarCheck },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2">
                  <s.icon className={cn("h-3.5 w-3.5", s.active ? "text-kfm-success" : "text-text-3")} />
                  <span className={cn("text-xs font-medium", s.active ? "text-kfm-success" : "text-text-3")}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features card */}
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-kfm-secondary" /> Equipements & Infos
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-kfm-sm border border-kfm-border bg-bg px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Wifi className={cn("h-4 w-4", r.hasWifi ? "text-kfm-success" : "text-text-3")} />
                <span className="text-sm text-text">Wi-Fi</span>
              </div>
              <span className={cn("text-xs font-medium", r.hasWifi ? "text-kfm-success" : "text-text-3")}>
                {r.hasWifi ? "Disponible" : "Non disponible"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-kfm-sm border border-kfm-border bg-bg px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Car className={cn("h-4 w-4", r.hasParking ? "text-kfm-success" : "text-text-3")} />
                <span className="text-sm text-text">Parking</span>
              </div>
              <span className={cn("text-xs font-medium", r.hasParking ? "text-kfm-success" : "text-text-3")}>
                {r.hasParking ? "Disponible" : "Non disponible"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-kfm-sm border border-kfm-border bg-bg px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-text">Gamme de prix</span>
              </div>
              <span className="text-sm font-semibold text-text">
                {r.priceRange ? "$".repeat(r.priceRange) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-kfm-sm border border-kfm-border bg-bg px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-text">Note clients</span>
              </div>
              <span className="text-sm font-semibold text-text">
                {r.rating > 0 ? `${r.rating.toFixed(1)} (${r.reviewCount})` : "Pas encore note"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text">Modifier le restaurant</DialogTitle>
            <DialogDescription className="text-text-2">Mettez a jour les informations de base</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Nom *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Nom du restaurant" />
              {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Telephone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Adresse</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Ville</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none resize-none" placeholder="Decrivez votre restaurant..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleSave} disabled={submitting} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
