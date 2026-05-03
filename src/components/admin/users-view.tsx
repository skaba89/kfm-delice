"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Plus, Search, Filter, MoreVertical, Pencil, Trash2, Lock, Unlock, RefreshCcw,
  ArrowLeft, ArrowRight, Loader2, X, UserPlus, Eye, Shield, AlertCircle,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate, initials, isValidEmail } from "@/lib/utils";
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

interface User {
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
  updatedAt: string;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
}

interface EditUserData {
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  isActive: boolean;
  isLocked: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "KITCHEN", label: "Cuisine" },
  { value: "DRIVER", label: "Livreur" },
  { value: "CUSTOMER", label: "Client" },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20",
  ADMIN: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20",
  MANAGER: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  STAFF: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  KITCHEN: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DRIVER: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  CUSTOMER: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const PAGE_SIZE = 10;

const emptyCreateForm = (): CreateUserData => ({
  email: "", password: "", firstName: "", lastName: "", role: "CUSTOMER", phone: "",
});

const emptyEditForm = (user: User): EditUserData => ({
  firstName: user.firstName || "", lastName: user.lastName || "",
  role: user.role, phone: user.phone || "",
  isActive: user.isActive, isLocked: user.isLocked,
});

// ── Component ──────────────────────────────────────────────────────────────

export function AdminUsersView() {
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [createForm, setCreateForm] = useState<CreateUserData>(emptyCreateForm());
  const [editForm, setEditForm] = useState<EditUserData>({ firstName: "", lastName: "", role: "CUSTOMER", phone: "", isActive: true, isLocked: false });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch users ─────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users || []);
        setTotal(json.data.total || 0);
      } else {
        setError(json.error || "Failed to fetch users");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const getRoleLabel = (role: string) =>
    ROLES.find((r) => r.value === role)?.label || role;

  const getStatusLabel = (user: User) => {
    if (user.isLocked) return { label: "Verrouillé", color: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20" };
    if (!user.isActive) return { label: "Inactif", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
    return { label: "Actif", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20" };
  };

  // ── Create user ─────────────────────────────────────────────────────────
  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.email || !isValidEmail(createForm.email)) errors.email = "Email invalide";
    if (!createForm.password || createForm.password.length < 6) errors.password = "Minimum 6 caractères";
    if (!createForm.firstName.trim()) errors.firstName = "Requis";
    if (!createForm.lastName.trim()) errors.lastName = "Requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setCreateForm(emptyCreateForm());
        setFormErrors({});
        fetchUsers();
      } else {
        setFormErrors({ submit: json.error || "Failed to create user" });
      }
    } catch {
      setFormErrors({ submit: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit user ───────────────────────────────────────────────────────────
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm(emptyEditForm(user));
    setFormErrors({});
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setEditOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        setFormErrors({ submit: json.error || "Failed to update user" });
      }
    } catch {
      setFormErrors({ submit: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle lock ─────────────────────────────────────────────────────────
  const handleToggleLock = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isLocked: !user.isLocked }),
      });
      if (res.ok) fetchUsers();
    } catch { /* silent */ }
  };

  // ── Delete user ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch { /* silent */ }
    finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Utilisateurs</h2>
            <p className="mt-1 text-sm text-text-2">Gestion de tous les utilisateurs</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="kfm-skeleton h-10 w-full max-w-xs rounded-kfm-sm" />
          <div className="kfm-skeleton h-10 w-40 rounded-kfm-sm" />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Utilisateurs</h2>
            <p className="mt-1 text-sm text-text-2">Gestion de tous les utilisateurs</p>
          </div>
          <button onClick={fetchUsers} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Utilisateurs</h2>
          <p className="mt-1 text-sm text-text-2">
            {total} utilisateur{total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => { setCreateForm(emptyCreateForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" /> Ajouter un utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom, email, telephone..."
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-[42px] rounded-kfm-sm border border-kfm-border bg-surface px-3 text-sm text-text focus:border-kfm-secondary focus:outline-none"
        >
          <option value="">Tous les roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-[42px] rounded-kfm-sm border border-kfm-border bg-surface px-3 text-sm text-text focus:border-kfm-secondary focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="locked">Verrouille</option>
          <option value="inactive">Inactif</option>
        </select>
        {(search || roleFilter || statusFilter) && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reinitialiser
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && users.length > 0 && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {users.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun utilisateur trouve"
          description={
            search || roleFilter || statusFilter
              ? "Aucun utilisateur ne correspond a vos filtres. Essayez de modifier vos criteres."
              : "Commencez par ajouter votre premier utilisateur."
          }
          action={
            <div className="flex gap-2">
              {(search || roleFilter || statusFilter) && (
                <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                  <RefreshCcw className="h-4 w-4" /> Reinitialiser les filtres
                </button>
              )}
              {!search && !roleFilter && !statusFilter && (
                <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  <UserPlus className="h-4 w-4" /> Ajouter un utilisateur
                </button>
              )}
            </div>
          }
        />
      )}

      {/* Users table - Desktop */}
      {users.length > 0 && (
        <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[0.8fr_1.5fr_1.2fr_0.8fr_0.7fr_0.8fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Utilisateur</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Email</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Role</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Inscrit le</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Derniere connexion</span>
            <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
          </div>

          {/* Table rows */}
          {users.map((user, index) => {
            const statusInfo = getStatusLabel(user);
            return (
              <div
                key={user.id}
                className={cn(
                  "grid grid-cols-[0.8fr_1.5fr_1.2fr_0.8fr_0.7fr_0.8fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                  index % 2 === 1 && "bg-bg/40"
                )}
              >
                {/* User name + avatar */}
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary">
                    {initials(user.firstName, user.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {user.firstName || ""} {user.lastName || ""}
                    </p>
                    {user.phone && (
                      <p className="text-xs text-text-3">{user.phone}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <span className="text-sm text-text-2 truncate">{user.email}</span>

                {/* Role */}
                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap", ROLE_COLORS[user.role] || ROLE_COLORS.CUSTOMER)}>
                  {getRoleLabel(user.role)}
                </span>

                {/* Status */}
                <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap", statusInfo.color)}>
                  {statusInfo.label}
                </span>

                {/* Created */}
                <span className="text-xs text-text-3 whitespace-nowrap">{formatDate(user.createdAt)}</span>

                {/* Last login */}
                <span className="text-xs text-text-3 whitespace-nowrap">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text transition">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(user)}>
                        {user.isLocked ? (
                          <><Unlock className="h-4 w-4" /> Deverrouiller</>
                        ) : (
                          <><Lock className="h-4 w-4" /> Verrouiller</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-kfm-danger focus:text-kfm-danger"
                        onClick={() => { setSelectedUser(user); setDeleteOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
              <span className="text-xs text-text-3">
                {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} sur {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-0.5 mx-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "h-8 w-8 rounded-lg text-xs font-medium transition",
                          page === pageNum
                            ? "bg-kfm-secondary text-white"
                            : "text-text-2 hover:bg-surface-2"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Cards */}
      {users.length > 0 && (
        <div className="md:hidden space-y-3">
          {users.map((user) => {
            const statusInfo = getStatusLabel(user);
            return (
              <div key={user.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-sm font-bold text-kfm-secondary">
                      {initials(user.firstName, user.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-text-2">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(user)}>
                        {user.isLocked ? <><Unlock className="h-4 w-4" /> Deverrouiller</> : <><Lock className="h-4 w-4" /> Verrouiller</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-kfm-danger" onClick={() => { setSelectedUser(user); setDeleteOpen(true); }}>
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", ROLE_COLORS[user.role] || ROLE_COLORS.CUSTOMER)}>
                    {getRoleLabel(user.role)}
                  </span>
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-kfm-border pt-3">
                  <span className="text-xs text-text-3">Inscrit: {formatDate(user.createdAt)}</span>
                  {user.phone && <span className="text-xs text-text-3">{user.phone}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create User Dialog ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter un utilisateur</DialogTitle>
            <DialogDescription className="text-text-2">Remplissez les informations pour creer un nouveau compte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Prenom *</label>
                <input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Prenom"
                />
                {formErrors.firstName && <p className="mt-1 text-xs text-kfm-danger">{formErrors.firstName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Nom *</label>
                <input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Nom"
                />
                {formErrors.lastName && <p className="mt-1 text-xs text-kfm-danger">{formErrors.lastName}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Email *</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="email@exemple.com"
              />
              {formErrors.email && <p className="mt-1 text-xs text-kfm-danger">{formErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Mot de passe *</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Minimum 6 caracteres"
              />
              {formErrors.password && <p className="mt-1 text-xs text-kfm-danger">{formErrors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Telephone</label>
              <input
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="+224 6XX XX XX XX"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Role *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full h-[38px] rounded-kfm-sm border border-kfm-border bg-bg px-3 text-sm text-text focus:border-kfm-secondary focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Creer l&apos;utilisateur
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ───────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription className="text-text-2">
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Prenom</label>
                <input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Nom</label>
                <input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Telephone</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full h-[38px] rounded-kfm-sm border border-kfm-border bg-bg px-3 text-sm text-text focus:border-kfm-secondary focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-kfm-border accent-kfm-secondary"
                />
                <span className="text-sm text-text-2">Actif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isLocked}
                  onChange={(e) => setEditForm((f) => ({ ...f, isLocked: e.target.checked }))}
                  className="h-4 w-4 rounded border-kfm-border accent-kfm-secondary"
                />
                <span className="text-sm text-text-2">Verrouille</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"
            >
              Annuler
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Supprimer l&apos;utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Cette action est irreversible. L&apos;utilisateur <strong className="text-text">{selectedUser?.firstName} {selectedUser?.lastName}</strong> ({selectedUser?.email}) sera desactive.
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
