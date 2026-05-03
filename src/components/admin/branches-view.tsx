"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Building2, Plus, Search, RefreshCcw, AlertCircle, MapPin, Phone, Mail,
  Eye, MoreVertical, X, Trash2, Loader2, Globe, Users, DoorOpen, CheckCircle,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { SkeletonStatCard, SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────

interface Branch {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isOpen: boolean;
  createdAt: string;
}

interface CreateFormData {
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  description: string;
}

const emptyForm = (): CreateFormData => ({
  name: "", slug: "", address: "", city: "", phone: "", email: "", description: "",
});

// ── Component ──────────────────────────────────────────────────────────────

export function AdminBranchesView() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/organizations?limit=50", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setBranches(json.data.restaurants || json.data || []);
      } else {
        setError(json.error || "Erreur de chargement des branches");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredBranches = useMemo(() => {
    if (!search) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      (b.city || "").toLowerCase().includes(q) ||
      (b.address || "").toLowerCase().includes(q) ||
      (b.phone || "").includes(q)
    );
  }, [branches, search]);

  const stats = useMemo(() => ({
    total: branches.length,
    active: branches.filter((b) => b.isActive).length,
    open: branches.filter((b) => b.isOpen).length,
  }), [branches]);

  // ── Create ───────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Requis";
    if (!form.city.trim()) errors.city = "Requis";
    if (!form.phone.trim()) errors.phone = "Requis";
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
        fetchBranches();
      } else {
        setFormErrors({ submit: json.error || "Erreur lors de la creation" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedBranch) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/organizations/${selectedBranch.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteOpen(false);
        setSelectedBranch(null);
        fetchBranches();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Branches</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des etablissements</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
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

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && branches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Branches</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des etablissements</p>
          </div>
          <button onClick={fetchBranches} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
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

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Branches</h2>
          <p className="mt-1 text-sm text-text-2">
            {stats.total} branche{stats.total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter une branche
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total branches" value={String(stats.total)} icon={Building2} />
        <StatCard label="Actives" value={String(stats.active)} icon={CheckCircle} className="border-l-4 border-l-kfm-success" />
        <StatCard label="Ouvertes" value={String(stats.open)} icon={DoorOpen} className="border-l-4 border-l-kfm-info" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom, ville, adresse..."
          />
        </div>
        {search && (
          <button onClick={() => setSearch("")} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reinitialiser
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && branches.length > 0 && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Empty state */}
      {filteredBranches.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aucune branche trouvee"
          description={search ? "Aucun etablissement ne correspond a votre recherche." : "Commencez par ajouter votre premiere branche."}
          action={
            search ? (
              <button onClick={() => setSearch("")} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                <X className="h-4 w-4" /> Reinitialiser
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Ajouter une branche
              </button>
            )
          }
        />
      )}

      {/* Card grid */}
      {filteredBranches.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="group rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-5 hover:shadow-md hover:border-kfm-secondary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                  <Building2 className="h-5 w-5 text-kfm-secondary" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", branch.isActive ? "bg-kfm-success/10 text-kfm-success" : "bg-kfm-danger/10 text-kfm-danger")}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </span>
                  {branch.isOpen && (
                    <span className="rounded-full bg-kfm-info/10 px-2.5 py-0.5 text-[10px] font-semibold text-kfm-info">Ouvert</span>
                  )}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-text mb-1 truncate">{branch.name}</h3>
              {branch.city && <p className="text-xs text-text-3 mb-3">{branch.city}</p>}
              <div className="space-y-2 text-xs text-text-2">
                {branch.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-text-3 flex-shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-text-3 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-end pt-3 border-t border-kfm-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 transition">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedBranch(branch); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4 mr-2" /> Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-kfm-danger focus:text-kfm-danger" onClick={() => { setSelectedBranch(branch); setDeleteOpen(true); }}>
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          {selectedBranch && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{selectedBranch.name}</DialogTitle>
                <DialogDescription className="text-text-2">@{selectedBranch.slug}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <p className={cn("mt-1 text-sm font-medium", selectedBranch.isActive ? "text-kfm-success" : "text-kfm-danger")}>
                      {selectedBranch.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Ouverture</p>
                    <p className={cn("mt-1 text-sm font-medium", selectedBranch.isOpen ? "text-kfm-info" : "text-text-3")}>
                      {selectedBranch.isOpen ? "Ouvert" : "Ferme"}
                    </p>
                  </div>
                </div>
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 text-text-3 flex-shrink-0" />
                    <span className="text-text">{selectedBranch.address || "—"}, {selectedBranch.city || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-4 w-4 text-text-3 flex-shrink-0" />
                    <span className="text-text">{selectedBranch.phone || "—"}</span>
                  </div>
                  {selectedBranch.email && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="h-4 w-4 text-text-3 flex-shrink-0" />
                      <span className="text-text">{selectedBranch.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm">
                    <Globe className="h-4 w-4 text-text-3 flex-shrink-0" />
                    <span className="text-text">{formatDate(selectedBranch.createdAt)}</span>
                  </div>
                </div>
                {selectedBranch.description && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3 mb-1">Description</p>
                    <p className="text-sm text-text-2">{selectedBranch.description}</p>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter une branche</DialogTitle>
            <DialogDescription className="text-text-2">Creez un nouvel etablissement</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Nom *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Nom de la branche" />
              {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="ma-branche" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Adresse *</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Ex: Almamya, Dixinn" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Ville *</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Conakry" />
                {formErrors.city && <p className="mt-1 text-xs text-kfm-danger">{formErrors.city}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Telephone *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="+224 6XX XX XX" />
                {formErrors.phone && <p className="mt-1 text-xs text-kfm-danger">{formErrors.phone}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="contact@resto.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none resize-none" placeholder="Description de la branche..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleCreate} disabled={submitting} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Creer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer la branche ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. La branche <strong className="text-text">{selectedBranch?.name}</strong> sera supprimee definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-kfm-danger text-white hover:bg-kfm-danger/90">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
