"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  UserCog, Plus, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, Lock, Unlock, Shield, Eye,
} from "lucide-react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────

interface StaffUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

type RoleTab = "all" | "MANAGER" | "STAFF" | "KITCHEN";
type StatusFilter = "all" | "active" | "locked";

// ── Constants ──────────────────────────────────────────────────────────────

const roleTabs: { key: RoleTab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "MANAGER", label: "Managers" },
  { key: "STAFF", label: "Personnel" },
  { key: "KITCHEN", label: "Cuisine" },
];

const roleConfig: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  ADMIN: { label: "Admin", color: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20" },
  MANAGER: { label: "Manager", color: "bg-kfm-info/10 text-kfm-info border-kfm-info/20" },
  STAFF: { label: "Personnel", color: "bg-surface-2 text-text-2 border-kfm-border" },
  KITCHEN: { label: "Cuisine", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20" },
  CUSTOMER: { label: "Client", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20" },
};

const staffRoles = ["MANAGER", "STAFF", "KITCHEN"];

interface CreateFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

const emptyForm = (): CreateFormData => ({
  email: "", password: "", firstName: "", lastName: "", phone: "", role: "STAFF",
});

const PAGE_SIZE = 20;

// ── Component ──────────────────────────────────────────────────────────────

export function AdminStaffView() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (search) params.set("search", search);
      if (statusFilter === "active") params.set("status", "active");
      if (statusFilter === "locked") params.set("status", "locked");

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        let data = (json.data?.users || []).filter((u: StaffUser) => staffRoles.includes(u.role));
        if (roleTab !== "all") {
          data = data.filter((u: StaffUser) => u.role === roleTab);
        }
        setStaff(data);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, roleTab, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const totalPages = Math.max(1, Math.ceil(staff.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return staff.slice(start, start + PAGE_SIZE);
  }, [staff, page]);

  const getDisplayName = (u: StaffUser) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    if (u.firstName) return u.firstName;
    if (u.lastName) return u.lastName;
    return u.email.split("@")[0];
  };

  const getInitials = (u: StaffUser) => {
    if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    if (u.firstName) return u.firstName[0].toUpperCase();
    return u.email[0].toUpperCase();
  };

  const resetFilters = () => {
    setSearch("");
    setRoleTab("all");
    setStatusFilter("all");
    setPage(1);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.email.trim()) errors.email = "Requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    if (!form.password || form.password.length < 6) errors.password = "Min. 6 caracteres";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setForm(emptyForm());
        setFormErrors({});
        toast.success(`${getDisplayName({ firstName: form.firstName, lastName: form.lastName, email: form.email } as StaffUser)} ajoute avec succes`);
        fetchStaff();
      } else {
        setFormErrors({ submit: json.error || "Erreur" });
        toast.error(json.error || "Erreur lors de la creation");
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
      toast.error("Erreur reseau. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (userId: string, currentlyLocked: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !currentlyLocked }),
      });
      const json = await res.json();
      if (json.success) {
        setStaff((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isLocked: !currentlyLocked } : u))
        );
        toast.success(currentlyLocked ? "Compte deverrouille" : "Compte verrouille");
      } else {
        toast.error(json.error || "Erreur lors du changement de statut");
      }
    } catch {
      toast.error("Erreur reseau. Veuillez reessayer.");
    }
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      const json = await res.json();
      if (json.success) {
        setStaff((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentlyActive } : u))
        );
        toast.success(currentlyActive ? "Compte desactive" : "Compte active");
      } else {
        toast.error(json.error || "Erreur lors du changement de statut");
      }
    } catch {
      toast.error("Erreur reseau. Veuillez reessayer.");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Personnel</h2>
          <p className="mt-1 text-sm text-text-2">Gestion du personnel</p>
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kfm-skeleton h-8 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && staff.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Personnel</h2>
            <p className="mt-1 text-sm text-text-2">Gestion du personnel</p>
          </div>
          <button onClick={fetchStaff} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Personnel</h2>
          <p className="mt-1 text-sm text-text-2">{staff.length} membre{staff.length !== 1 ? "s" : ""} du personnel</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter du personnel
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher par nom, email..."
            />
          </div>
          <div className="flex rounded-kfm-sm border border-kfm-border overflow-hidden">
            <button onClick={() => { setStatusFilter("all"); setPage(1); }} className={cn("px-3 py-2 text-xs font-medium transition", statusFilter === "all" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>Tous</button>
            <button onClick={() => { setStatusFilter("active"); setPage(1); }} className={cn("px-3 py-2 text-xs font-medium transition border-l border-kfm-border", statusFilter === "active" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>Actifs</button>
            <button onClick={() => { setStatusFilter("locked"); setPage(1); }} className={cn("px-3 py-2 text-xs font-medium transition border-l border-kfm-border", statusFilter === "locked" ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>Verrouilles</button>
          </div>
          {(search || roleTab !== "all" || statusFilter !== "all") && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
              <X className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setRoleTab(tab.key); setPage(1); }}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                roleTab === tab.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {staff.length === 0 && (
        <EmptyState
          icon={UserCog}
          title="Aucun personnel trouve"
          description="Aucun membre du personnel ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser
            </button>
          }
        />
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="grid grid-cols-[0.5fr_1.2fr_1fr_0.7fr_0.6fr_0.6fr_0.6fr_0.4fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Membre</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Nom</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Email</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Role</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Inscrit le</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
        </div>

        {paginated.map((member, index) => {
          const rCfg = roleConfig[member.role] || { label: member.role, color: "bg-surface-2 text-text-2 border-kfm-border" };

          return (
            <div
              key={member.id}
              className={cn(
                "grid grid-cols-[0.5fr_1.2fr_1fr_0.7fr_0.6fr_0.6fr_0.6fr_0.4fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                index % 2 === 1 && "bg-bg/40"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                member.isLocked ? "bg-kfm-danger/10 text-kfm-danger" : "bg-kfm-secondary/10 text-kfm-secondary"
              )}>
                {getInitials(member)}
              </div>

              <span className="text-sm font-medium text-text truncate">{getDisplayName(member)}</span>
              <span className="text-sm text-text-2 truncate">{member.email}</span>
              <span className="text-sm text-text-2">{member.phone || "—"}</span>

              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", rCfg.color)}>
                {rCfg.label}
              </span>

              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                member.isLocked
                  ? "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                  : member.isActive
                  ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                  : "bg-surface-2 text-text-3 border-kfm-border"
              )}>
                {member.isLocked ? "Verrouille" : member.isActive ? "Actif" : "Inactif"}
              </span>

              <span className="text-xs text-text-3">{formatDate(member.createdAt)}</span>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleToggleLock(member.id, member.isLocked)}
                  className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2"
                  title={member.isLocked ? "Deverrouiller" : "Verrouiller"}
                >
                  {member.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, staff.length)} sur {staff.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>{p}</button>;
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {paginated.map((member) => {
          const rCfg = roleConfig[member.role] || { label: member.role, color: "bg-surface-2 text-text-2 border-kfm-border" };

          return (
            <div key={member.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    member.isLocked ? "bg-kfm-danger/10 text-kfm-danger" : "bg-kfm-secondary/10 text-kfm-secondary"
                  )}>
                    {getInitials(member)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{getDisplayName(member)}</p>
                    <p className="text-xs text-text-3">{member.email}</p>
                  </div>
                </div>
                <button onClick={() => handleToggleLock(member.id, member.isLocked)} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2">
                  {member.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", rCfg.color)}>
                  {rCfg.label}
                </span>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  member.isLocked ? "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20" : "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                )}>
                  {member.isLocked ? "Verrouille" : "Actif"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-kfm-border pt-2">
                <span className="text-xs text-text-3">{member.phone || "—"}</span>
                <span className="text-xs text-text-3">{formatDate(member.createdAt)}</span>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, staff.length)} sur {staff.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter du personnel</DialogTitle>
            <DialogDescription className="text-text-2">Creer un compte pour un membre du personnel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formErrors.submit && <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Prenom</label>
                <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Prenom" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Nom</label>
                <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Nom" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="email@exemple.com" />
              {formErrors.email && <p className="mt-1 text-xs text-kfm-danger">{formErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Mot de passe *</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Min. 6 caracteres" />
              {formErrors.password && <p className="mt-1 text-xs text-kfm-danger">{formErrors.password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Telephone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="+224 6XX XX XX XX" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Role *</label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger className="w-full rounded-kfm-sm border border-kfm-border bg-bg text-sm text-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((r) => (
                      <SelectItem key={r} value={r}>{roleConfig[r]?.label || r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleCreate} disabled={submitting} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Shield className="h-4 w-4" />
              Creer le compte
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
