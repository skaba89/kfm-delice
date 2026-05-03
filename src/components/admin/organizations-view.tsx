"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Building2, Plus, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, Eye, MapPin, Phone, Mail,
  Trash2, MoreVertical, Star, Globe,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
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

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  district: string | null;
  website: string | null;
  logo: string | null;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateFormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  description: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const emptyForm = (): CreateFormData => ({
  name: "", phone: "", email: "", city: "", address: "", description: "",
});

// ── Component ──────────────────────────────────────────────────────────────

export function AdminOrganizationsView() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchOrganizations = useCallback(async () => {
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
        const data = json.data.restaurants || json.data.organizations || json.data || [];
        setOrganizations(Array.isArray(data) ? data : []);
        setTotal(json.data.total || data.length || 0);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeCount = organizations.filter(o => o.isActive).length;
    const cities = new Set(organizations.map(o => o.city).filter(Boolean));
    return { activeCount, cityCount: cities.size };
  }, [organizations]);

  // ── Create ──────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Requis";
    if (!form.phone.trim()) errors.phone = "Requis";
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
        fetchOrganizations();
      } else {
        setFormErrors({ submit: json.error || "Erreur lors de la creation" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedOrg) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/organizations/${selectedOrg.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteOpen(false);
        setSelectedOrg(null);
        fetchOrganizations();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Organisations</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des organisations</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />)}
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

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && organizations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Organisations</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des organisations</p>
          </div>
          <button onClick={fetchOrganizations} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Organisations</h2>
          <p className="mt-1 text-sm text-text-2">{total} organisation{total !== 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter une organisation
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total organisations" value={String(total)} icon={Building2} />
        <StatCard label="Actives" value={String(stats.activeCount)} icon={Building2} changeType="positive" />
        <StatCard label="Villes" value={String(stats.cityCount)} icon={MapPin} />
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

      {/* Empty */}
      {organizations.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aucune organisation trouvee"
          description={search ? "Aucune organisation ne correspond a votre recherche." : "Commencez par ajouter votre premiere organisation."}
          action={
            search ? (
              <button onClick={() => setSearch("")} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                <RefreshCcw className="h-4 w-4" /> Reinitialiser
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Ajouter une organisation
              </button>
            )
          }
        />
      )}

      {/* ── Card Grid ────────────────────────────────────────────────────── */}
      {organizations.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map(org => (
              <div
                key={org.id}
                className="group rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-kfm-secondary/30"
              >
                {/* Card header */}
                <div className="relative h-28 bg-gradient-to-br from-kfm-secondary/20 to-kfm-secondary/5 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-kfm-secondary/40" />
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      org.isActive
                        ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                        : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                    )}>
                      {org.isActive ? "Actif" : "Inactif"}
                    </span>
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
                        <DropdownMenuItem onClick={() => { setSelectedOrg(org); setDetailOpen(true); }}>
                          <Eye className="h-4 w-4" /> Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-kfm-danger focus:text-kfm-danger"
                          onClick={() => { setSelectedOrg(org); setDeleteOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text truncate">{org.name}</h3>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-text-2">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-text-3" />
                      <span className="truncate">{org.city || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-2">
                      <Phone className="h-3 w-3 flex-shrink-0 text-text-3" />
                      <span>{org.phone}</span>
                    </div>
                    {org.email && (
                      <div className="flex items-center gap-1.5 text-xs text-text-2">
                        <Mail className="h-3 w-3 flex-shrink-0 text-text-3" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-kfm-border pt-3">
                    <span className="text-xs text-text-3">{formatDate(org.createdAt)}</span>
                    {org.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs font-medium text-kfm-warning">
                        <Star className="h-3 w-3 fill-kfm-warning" />
                        {org.rating.toFixed(1)}
                        <span className="text-text-3">({org.reviewCount})</span>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-2 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-2 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Create Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter une organisation</DialogTitle>
            <DialogDescription className="text-text-2">Remplissez les informations de l'organisation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Nom *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Nom de l'organisation" />
              {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Telephone *</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="+224 6XX XX XX XX" />
                {formErrors.phone && <p className="mt-1 text-xs text-kfm-danger">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="contact@org.com" />
                {formErrors.email && <p className="mt-1 text-xs text-kfm-danger">{formErrors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Ville</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Conakry" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Adresse</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Almamya, Dixinn" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none resize-none"
                placeholder="Description de l'organisation..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleCreate} disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Creer l'organisation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          {selectedOrg && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{selectedOrg.name}</DialogTitle>
                <DialogDescription className="text-text-2">@{selectedOrg.slug}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <p className={cn("mt-1 text-sm font-medium", selectedOrg.isActive ? "text-kfm-success" : "text-kfm-danger")}>
                      {selectedOrg.isActive ? "Actif" : "Inactif"}
                    </p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Note</p>
                    <p className="mt-1 text-sm font-medium text-text">
                      {selectedOrg.rating > 0 ? `${selectedOrg.rating.toFixed(1)} / 5 (${selectedOrg.reviewCount} avis)` : "Pas encore note"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {selectedOrg.city && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-text-3" />
                      <span className="text-sm text-text">{selectedOrg.city}{selectedOrg.district ? `, ${selectedOrg.district}` : ""}</span>
                    </div>
                  )}
                  {selectedOrg.address && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-text-3" />
                      <span className="text-sm text-text">{selectedOrg.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 flex-shrink-0 text-text-3" />
                    <span className="text-sm text-text">{selectedOrg.phone}</span>
                  </div>
                  {selectedOrg.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 flex-shrink-0 text-text-3" />
                      <span className="text-sm text-text">{selectedOrg.email}</span>
                    </div>
                  )}
                  {selectedOrg.website && (
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 flex-shrink-0 text-text-3" />
                      <span className="text-sm text-kfm-secondary">{selectedOrg.website}</span>
                    </div>
                  )}
                </div>
                {selectedOrg.description && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3 mb-1">Description</p>
                    <p className="text-sm text-text-2">{selectedOrg.description}</p>
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
            <AlertDialogTitle className="text-text">Supprimer l'organisation ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. L'organisation <strong className="text-text">{selectedOrg?.name}</strong> sera supprimee definitivement.
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
