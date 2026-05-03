"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Plus, Search, RefreshCcw, AlertCircle, Eye, MoreVertical,
  UserCheck, ChefHat, Truck, Briefcase, Loader2, X,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate, initials } from "@/lib/utils";
import { SkeletonStatCard, SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface CreateFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STAFF_ROLES = ["STAFF", "MANAGER", "KITCHEN", "DRIVER"];

const DEPT_MAP: Record<string, string> = {
  KITCHEN: "Cuisine",
  STAFF: "Service",
  MANAGER: "Management",
  DRIVER: "Livraison",
};

const DEPT_TABS = [
  { key: "all", label: "Tout le personnel" },
  { key: "KITCHEN", label: "Cuisine" },
  { key: "STAFF", label: "Service" },
  { key: "MANAGER", label: "Management" },
  { key: "DRIVER", label: "Livraison" },
];

const ROLE_COLORS: Record<string, string> = {
  STAFF: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  MANAGER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  KITCHEN: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DRIVER: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  KITCHEN: <ChefHat className="h-3.5 w-3.5" />,
  STAFF: <Briefcase className="h-3.5 w-3.5" />,
  MANAGER: <UserCheck className="h-3.5 w-3.5" />,
  DRIVER: <Truck className="h-3.5 w-3.5" />,
};

const emptyForm = (): CreateFormData => ({
  email: "", password: "", firstName: "", lastName: "", role: "STAFF", phone: "",
});

// ── Component ──────────────────────────────────────────────────────────────

export function AdminHrView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users?limit=500", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const staff = (json.data.users || []).filter(
          (u: Employee) => STAFF_ROLES.includes(u.role?.toUpperCase())
        );
        setEmployees(staff);
      } else {
        setError(json.error || "Erreur de chargement du personnel");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const name = `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || e.role === deptFilter;
      return matchSearch && matchDept;
    });
  }, [employees, search, deptFilter]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byDept: Record<string, number> = {};
    employees.forEach((e) => { byDept[e.role] = (byDept[e.role] || 0) + 1; });
    return { total: employees.length, byDept };
  }, [employees]);

  // ── Create employee ──────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "Requis";
    if (!form.email.trim()) errors.email = "Requis";
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
        fetchEmployees();
      } else {
        setFormErrors({ submit: json.error || "Erreur lors de la creation" });
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Ressources humaines</h2>
          <p className="mt-1 text-sm text-text-2">Gestion du personnel</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-xs rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Ressources humaines</h2>
          <p className="mt-1 text-sm text-text-2">
            {stats.total} employe{stats.total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter un employe
        </button>
      </div>

      {/* Stats - Total + 4 departments */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total employes" value={String(stats.total)} icon={Users} />
        {STAFF_ROLES.map((role) => {
          const Icon = role === "KITCHEN" ? ChefHat : role === "STAFF" ? Briefcase : role === "MANAGER" ? UserCheck : Truck;
          return (
            <StatCard
              key={role}
              label={DEPT_MAP[role]}
              value={String(stats.byDept[role] || 0)}
              icon={Icon}
              className="border-l-4 border-l-kfm-secondary"
            />
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher un employe..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {DEPT_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setDeptFilter(tab.key)} className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
              deptFilter === tab.key
                ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
            )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-4 py-2 text-sm text-kfm-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Empty state */}
      {filteredEmployees.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun employe trouve"
          description="Aucun employe ne correspond a vos criteres."
          action={
            <button onClick={() => { setSearch(""); setDeptFilter("all"); }} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <X className="h-4 w-4" /> Reinitialiser
            </button>
          }
        />
      )}

      {/* Desktop Table */}
      {filteredEmployees.length > 0 && (
        <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.6fr_0.7fr_0.5fr_0.4fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Nom</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Email</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Role</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Departement</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredEmployees.map((emp, idx) => {
              const roleColor = ROLE_COLORS[emp.role] || "bg-surface-2 text-text-2 border-kfm-border";
              const dept = DEPT_MAP[emp.role] || emp.role;
              return (
                <div
                  key={emp.id}
                  className={cn(
                    "grid grid-cols-[1.2fr_1.2fr_0.8fr_0.6fr_0.7fr_0.5fr_0.4fr] gap-2 items-center border-b border-kfm-border px-5 py-3 transition-colors hover:bg-surface-2/40 last:border-0",
                    idx % 2 === 1 && "bg-bg/40"
                  )}
                >
                  {/* Name with initials */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary">
                      {initials(emp.firstName, emp.lastName)}
                    </div>
                    <span className="text-sm font-medium text-text truncate">
                      {emp.firstName || ""} {emp.lastName || ""}
                    </span>
                  </div>
                  <span className="text-sm text-text-2 truncate">{emp.email}</span>
                  <span className="text-sm text-text-2 truncate">{emp.phone || "—"}</span>
                  {/* Role badge */}
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap", roleColor)}>
                    {emp.role}
                  </span>
                  {/* Department */}
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap", roleColor)}>
                    {ROLE_ICONS[emp.role] || null}
                    {dept}
                  </span>
                  {/* Status */}
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold w-fit",
                    emp.isActive ? "bg-kfm-success/10 text-kfm-success" : "bg-kfm-danger/10 text-kfm-danger"
                  )}>
                    {emp.isActive ? "Actif" : "Inactif"}
                  </span>
                  {/* Actions */}
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 transition">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedEmp(emp); setDetailOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      {filteredEmployees.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredEmployees.map((emp) => {
            const roleColor = ROLE_COLORS[emp.role] || "bg-surface-2 text-text-2 border-kfm-border";
            const dept = DEPT_MAP[emp.role] || emp.role;
            return (
              <div key={emp.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kfm-secondary/10 text-sm font-bold text-kfm-secondary">
                    {initials(emp.firstName, emp.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-text-3 truncate">{emp.email}</p>
                  </div>
                  <button onClick={() => { setSelectedEmp(emp); setDetailOpen(true); }} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", roleColor)}>
                    {emp.role}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", roleColor)}>
                    {ROLE_ICONS[emp.role] || null}
                    {dept}
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    emp.isActive ? "bg-kfm-success/10 text-kfm-success" : "bg-kfm-danger/10 text-kfm-danger"
                  )}>
                    {emp.isActive ? "Actif" : "Inactif"}
                  </span>
                  <span className="text-[10px] text-text-3 ml-auto">{formatDate(emp.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          {selectedEmp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kfm-secondary/10 text-sm font-bold text-kfm-secondary">
                    {initials(selectedEmp.firstName, selectedEmp.lastName)}
                  </div>
                  {selectedEmp.firstName} {selectedEmp.lastName}
                </DialogTitle>
                <DialogDescription className="text-text-2">Fiche employe</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Role</p>
                    <span className={cn("mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", ROLE_COLORS[selectedEmp.role] || "")}>
                      {selectedEmp.role}
                    </span>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Statut</p>
                    <p className={cn("mt-1 text-sm font-medium", selectedEmp.isActive ? "text-kfm-success" : "text-kfm-danger")}>
                      {selectedEmp.isActive ? "Actif" : "Inactif"}
                    </p>
                  </div>
                </div>
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4 space-y-2.5">
                  <div className="flex justify-between text-sm"><span className="text-text-3">Email</span><span className="text-text">{selectedEmp.email}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Telephone</span><span className="text-text">{selectedEmp.phone || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Departement</span><span className="text-text">{DEPT_MAP[selectedEmp.role] || selectedEmp.role}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Date entree</span><span className="text-text">{formatDate(selectedEmp.createdAt)}</span></div>
                </div>
              </div>
              <DialogFooter>
                <button onClick={() => setDetailOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Fermer</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter un employe</DialogTitle>
            <DialogDescription className="text-text-2">Creez un nouveau compte employe</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Prenom *</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Prenom" />
                {formErrors.firstName && <p className="mt-1 text-xs text-kfm-danger">{formErrors.firstName}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Nom</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Nom" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="email@exemple.com" />
              {formErrors.email && <p className="mt-1 text-xs text-kfm-danger">{formErrors.email}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Mot de passe *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="Min. 6 caracteres" />
              {formErrors.password && <p className="mt-1 text-xs text-kfm-danger">{formErrors.password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Telephone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none" placeholder="+224 6XX XX XX" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none">
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>{DEPT_MAP[role]} ({role})</option>
                  ))}
                </select>
              </div>
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
    </div>
  );
}
