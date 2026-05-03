"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck, Plus, Search, RefreshCcw, AlertCircle, MoreVertical, Pencil, Trash2,
  Phone, Mail, MapPin, X, Loader2, Eye, Building2, Package,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
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

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  categories: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

interface CreateFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  categories: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "kfm_suppliers";

const emptyForm = (): CreateFormData => ({
  name: "", contactName: "", email: "", phone: "", address: "", city: "", categories: "",
});

function loadSuppliers(): Supplier[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSuppliers(suppliers: Supplier[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminSuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);

  // Form
  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Load from localStorage ──────────────────────────────────────────────
  const fetchSuppliers = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setSuppliers(loadSuppliers());
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;

  // ── Create ──────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Requis";
    if (!form.contactName.trim()) errors.contactName = "Requis";
    if (!form.phone.trim()) errors.phone = "Requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      categories: form.categories.trim(),
      rating: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSupplier, ...suppliers];
    saveSuppliers(updated);
    setSuppliers(updated);
    setCreateOpen(false);
    setForm(emptyForm());
    setFormErrors({});
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!selected) return;
    const updated = suppliers.filter((s) => s.id !== selected.id);
    saveSuppliers(updated);
    setSuppliers(updated);
    setDeleteOpen(false);
    setSelected(null);
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Fournisseurs</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des fournisseurs</p>
          </div>
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-xs rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Fournisseurs</h2>
          <p className="mt-1 text-sm text-text-2">{totalSuppliers} fournisseur{totalSuppliers !== 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter un fournisseur
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total fournisseurs" value={String(totalSuppliers)} icon={Truck} className="border-l-4 border-l-kfm-secondary" />
        <StatCard label="Fournisseurs actifs" value={String(activeSuppliers)} icon={Building2} className="border-l-4 border-l-kfm-success" />
        <StatCard label="Categories" value={String(new Set(suppliers.flatMap((s) => s.categories.split(",").filter(Boolean))).size)} icon={Package} className="border-l-4 border-l-blue-500" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom, contact, ville..."
          />
        </div>
        {search && (
          <button onClick={() => setSearch("")} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reinitialiser
          </button>
        )}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <EmptyState
          icon={Truck}
          title="Aucun fournisseur trouve"
          description={search ? "Aucun fournisseur ne correspond a votre recherche." : "Commencez par ajouter votre premier fournisseur."}
          action={
            search ? (
              <button onClick={() => setSearch("")} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                <RefreshCcw className="h-4 w-4" /> Reinitialiser
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Ajouter un fournisseur
              </button>
            )
          }
        />
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase">Fournisseur</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Contact</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Telephone</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Ville</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Categorie</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-right">Actions</span>
          </div>

          {filtered.map((supplier, idx) => (
            <div
              key={supplier.id}
              className={cn(
                "hidden md:grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                idx % 2 === 1 && "bg-bg/40"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                  <Truck className="h-4 w-4 text-kfm-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{supplier.name}</p>
                  {supplier.email && <p className="text-xs text-text-3 truncate">{supplier.email}</p>}
                </div>
              </div>
              <span className="text-sm text-text-2">{supplier.contactName}</span>
              <span className="text-sm text-text-2">{supplier.phone}</span>
              <span className="text-sm text-text-2">{supplier.city || "—"}</span>
              <div className="flex items-center gap-1 flex-wrap">
                {supplier.categories.split(",").filter(Boolean).slice(0, 2).map((cat) => (
                  <span key={cat} className="rounded-full bg-kfm-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-kfm-secondary">
                    {cat.trim()}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-end gap-0.5">
                <button onClick={() => { setSelected(supplier); setDetailOpen(true); }} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text">
                  <Eye className="h-4 w-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelected(supplier); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" /> Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-kfm-danger" onClick={() => { setSelected(supplier); setDeleteOpen(true); }}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Mobile cards */}
          {filtered.map((supplier) => (
            <div key={supplier.id} className="md:hidden rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-kfm-sm bg-kfm-secondary/10">
                    <Truck className="h-5 w-5 text-kfm-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{supplier.name}</p>
                    <p className="text-xs text-text-2">{supplier.contactName}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelected(supplier); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" /> Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-kfm-danger" onClick={() => { setSelected(supplier); setDeleteOpen(true); }}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 space-y-1.5">
                {supplier.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-text-2">
                    <Phone className="h-3 w-3" /> {supplier.phone}
                  </div>
                )}
                {supplier.city && (
                  <div className="flex items-center gap-1.5 text-xs text-text-2">
                    <MapPin className="h-3 w-3" /> {supplier.city}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter un fournisseur</DialogTitle>
            <DialogDescription className="text-text-2">Informations du fournisseur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Nom *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Nom du fournisseur" />
                {formErrors.name && <p className="mt-1 text-xs text-kfm-danger">{formErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Personne de contact *</label>
                <input value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Nom du contact" />
                {formErrors.contactName && <p className="mt-1 text-xs text-kfm-danger">{formErrors.contactName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Telephone *</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="+224 6XX XX XX XX" />
                {formErrors.phone && <p className="mt-1 text-xs text-kfm-danger">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="email@fournisseur.com" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Adresse</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Adresse du fournisseur" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Ville</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Conakry" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Categories</label>
                <input value={form.categories} onChange={(e) => setForm((f) => ({ ...f, categories: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Viandes, Legumes, Boissons" />
                <p className="mt-1 text-xs text-text-3">Separees par des virgules</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              Annuler
            </button>
            <button onClick={handleCreate} disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{selected.name}</DialogTitle>
                <DialogDescription className="text-text-2">Fournisseur depuis le {formatDate(selected.createdAt)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <span className={cn("mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                      selected.isActive ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20" : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                    )}>
                      {selected.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Contact</p>
                    <p className="mt-1 text-sm font-medium text-text">{selected.contactName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {selected.phone && (
                    <div className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-text-3" /><span className="text-sm text-text">{selected.phone}</span></div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-text-3" /><span className="text-sm text-text">{selected.email}</span></div>
                  )}
                  {selected.address && (
                    <div className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-text-3" /><span className="text-sm text-text">{selected.address}{selected.city ? `, ${selected.city}` : ""}</span></div>
                  )}
                </div>
                {selected.categories && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.categories.split(",").filter(Boolean).map((cat) => (
                        <span key={cat} className="rounded-full bg-kfm-secondary/10 px-2.5 py-1 text-xs font-semibold text-kfm-secondary">{cat.trim()}</span>
                      ))}
                    </div>
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer le fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. Le fournisseur <strong className="text-text">{selected?.name}</strong> sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-kfm-danger text-white hover:bg-kfm-danger/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
