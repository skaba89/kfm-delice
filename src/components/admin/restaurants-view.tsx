"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2, Plus, Search, Filter, MoreVertical, Pencil, Trash2, RefreshCcw,
  ArrowLeft, ArrowRight, Loader2, X, MapPin, Phone, Mail, Globe,
  AlertCircle, Eye, Clock,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  district: string | null;
  website: string | null;
  coverImage: string | null;
  logo: string | null;
  isActive: boolean;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateFormData {
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  description: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const emptyForm = (): CreateFormData => ({
  name: "", slug: "", address: "", city: "", district: "", phone: "", email: "", description: "",
});

// ── Component ──────────────────────────────────────────────────────────────

export function AdminRestaurantsView() {
  // Data state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "table">("grid");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Form state
  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch restaurants ──────────────────────────────────────────────────
  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/organizations?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setRestaurants(json.data.restaurants || []);
        setTotal(json.data.total || 0);
      } else {
        setError(json.error || "Failed to fetch restaurants");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Create ──────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Requis";
    if (!form.city.trim()) errors.city = "Requis";
    if (!form.phone.trim()) errors.phone = "Requis";
    if (!form.address.trim()) errors.address = "Requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setForm(emptyForm());
        setFormErrors({});
        fetchRestaurants();
      } else {
        setFormErrors({ submit: json.error || "Failed to create restaurant" });
      }
    } catch {
      setFormErrors({ submit: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/organizations/${selectedRestaurant.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteOpen(false);
        setSelectedRestaurant(null);
        fetchRestaurants();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Restaurants</h2>
            <p className="mt-1 text-sm text-text-2">Gestion de tous les restaurants</p>
          </div>
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-xs rounded-kfm-sm" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kfm-skeleton h-52 rounded-kfm-md" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && restaurants.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Restaurants</h2>
            <p className="mt-1 text-sm text-text-2">Gestion de tous les restaurants</p>
          </div>
          <button onClick={fetchRestaurants} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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

  // ── Main view ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Restaurants</h2>
          <p className="mt-1 text-sm text-text-2">
            {total} restaurant{total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-kfm-sm border border-kfm-border overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={cn("px-3 py-2 text-xs font-medium transition", view === "grid" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}
            >
              Grille
            </button>
            <button
              onClick={() => setView("table")}
              className={cn("px-3 py-2 text-xs font-medium transition", view === "table" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Ajouter un restaurant
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom, ville..."
          />
        </div>
        {search && (
          <button onClick={() => setSearch("")} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reinitialiser
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && restaurants.length > 0 && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {restaurants.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aucun restaurant trouve"
          description={search ? "Aucun restaurant ne correspond a votre recherche." : "Commencez par ajouter votre premier restaurant."}
          action={
            search ? (
              <button onClick={() => setSearch("")} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                <RefreshCcw className="h-4 w-4" /> Reinitialiser
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Ajouter un restaurant
              </button>
            )
          }
        />
      )}

      {/* ── Grid View ─────────────────────────────────────────────────────── */}
      {restaurants.length > 0 && view === "grid" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="group rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-kfm-secondary/30"
              >
                {/* Cover image placeholder */}
                <div className="relative h-32 bg-gradient-to-br from-kfm-secondary/20 to-kfm-secondary/5 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-kfm-secondary/40" />
                  {/* Status badge */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      restaurant.isActive
                        ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                        : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                    )}>
                      {restaurant.isActive ? "Actif" : "Inactif"}
                    </span>
                    {restaurant.isOpen && (
                      <span className="inline-flex items-center rounded-full border bg-kfm-success/10 text-kfm-success border-kfm-success/20 px-2 py-0.5 text-[10px] font-semibold">
                        Ouvert
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg bg-surface/90 p-1.5 text-text-3 shadow-sm hover:bg-surface">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setSelectedRestaurant(restaurant); setDetailOpen(true); }}>
                          <Eye className="h-4 w-4" /> Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-kfm-danger focus:text-kfm-danger"
                          onClick={() => { setSelectedRestaurant(restaurant); setDeleteOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text truncate">{restaurant.name}</h3>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-text-2">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-text-3" />
                      <span className="truncate">{restaurant.city}{restaurant.district ? `, ${restaurant.district}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-2">
                      <Phone className="h-3 w-3 flex-shrink-0 text-text-3" />
                      <span>{restaurant.phone}</span>
                    </div>
                    {restaurant.email && (
                      <div className="flex items-center gap-1.5 text-xs text-text-2">
                        <Mail className="h-3 w-3 flex-shrink-0 text-text-3" />
                        <span className="truncate">{restaurant.email}</span>
                      </div>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-kfm-border pt-3">
                    <div className="flex items-center gap-1 text-xs text-text-3">
                      <Clock className="h-3 w-3" />
                      {formatDate(restaurant.createdAt)}
                    </div>
                    {restaurant.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs font-medium text-kfm-warning">
                        <span>★</span> {restaurant.rating.toFixed(1)}
                        <span className="text-text-3">({restaurant.reviewCount})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-kfm-border p-2 text-text-2 hover:bg-surface-2 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-kfm-border p-2 text-text-2 hover:bg-surface-2 disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Table View ────────────────────────────────────────────────────── */}
      {restaurants.length > 0 && view === "table" && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr_0.6fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Restaurant</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Ville</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Inscrit le</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
          </div>

          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className={cn(
                "grid grid-cols-[1.5fr_1fr_0.8fr_1fr_0.6fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                index % 2 === 1 && "bg-bg/40"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                  <Building2 className="h-4 w-4 text-kfm-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{restaurant.name}</p>
                  {restaurant.email && (
                    <p className="text-xs text-text-3 truncate">{restaurant.email}</p>
                  )}
                </div>
              </div>

              <span className="text-sm text-text-2">
                {restaurant.city}{restaurant.district ? `, ${restaurant.district}` : ""}
              </span>

              <span className="text-sm text-text-2">{restaurant.phone}</span>

              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  restaurant.isActive ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20" : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                )}>
                  {restaurant.isActive ? "Actif" : "Inactif"}
                </span>
                {restaurant.isOpen && (
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-kfm-success/10 text-kfm-success border-kfm-success/20">
                    Ouvert
                  </span>
                )}
              </div>

              <span className="text-xs text-text-3 whitespace-nowrap">{formatDate(restaurant.createdAt)}</span>

              <div className="flex items-center justify-end gap-0.5">
                <button
                  onClick={() => { setSelectedRestaurant(restaurant); setDetailOpen(true); }}
                  className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedRestaurant(restaurant); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" /> Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-kfm-danger" onClick={() => { setSelectedRestaurant(restaurant); setDeleteOpen(true); }}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
              <span className="text-xs text-text-3">
                {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} sur {total}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter un restaurant</DialogTitle>
            <DialogDescription className="text-text-2">Remplissez les informations du restaurant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Nom du restaurant *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: Le Jardin Gourmand"
              />
              {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Auto-genere si vide"
              />
              <p className="mt-1 text-xs text-text-3">Laissez vide pour generer automatiquement</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Adresse *</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: Almamya, Dixinn"
              />
              {formErrors.address && <p className="mt-1 text-xs text-kfm-danger">{formErrors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Ville *</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Conakry"
                />
                {formErrors.city && <p className="mt-1 text-xs text-kfm-danger">{formErrors.city}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Quartier</label>
                <input
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Kaloum"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Telephone *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="+224 6XX XX XX XX"
                />
                {formErrors.phone && <p className="mt-1 text-xs text-kfm-danger">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="contact@restaurant.com"
                />
                {formErrors.email && <p className="mt-1 text-xs text-kfm-danger">{formErrors.email}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none resize-none"
                placeholder="Description du restaurant..."
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Creer le restaurant
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{selectedRestaurant.name}</DialogTitle>
                <DialogDescription className="text-text-2">@{selectedRestaurant.slug}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <p className="mt-1 text-sm font-medium text-text">
                      {selectedRestaurant.isActive ? "Actif" : "Inactif"}
                    </p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Note</p>
                    <p className="mt-1 text-sm font-medium text-text">
                      {selectedRestaurant.rating > 0 ? `${selectedRestaurant.rating.toFixed(1)} / 5 (${selectedRestaurant.reviewCount} avis)` : "Pas encore note"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-text-3" />
                    <span className="text-sm text-text">{selectedRestaurant.address}, {selectedRestaurant.city}{selectedRestaurant.district ? `, ${selectedRestaurant.district}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 flex-shrink-0 text-text-3" />
                    <span className="text-sm text-text">{selectedRestaurant.phone}</span>
                  </div>
                  {selectedRestaurant.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 flex-shrink-0 text-text-3" />
                      <span className="text-sm text-text">{selectedRestaurant.email}</span>
                    </div>
                  )}
                  {selectedRestaurant.website && (
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 flex-shrink-0 text-text-3" />
                      <span className="text-sm text-kfm-secondary">{selectedRestaurant.website}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 flex-shrink-0 text-text-3" />
                    <span className="text-sm text-text-2">Inscrit le {formatDate(selectedRestaurant.createdAt)}</span>
                  </div>
                </div>
                {selectedRestaurant.description && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3 mb-1">Description</p>
                    <p className="text-sm text-text-2">{selectedRestaurant.description}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <button onClick={() => setDetailOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                  Fermer
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer le restaurant ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. Le restaurant <strong className="text-text">{selectedRestaurant?.name}</strong> sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-kfm-danger text-white hover:bg-kfm-danger/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
