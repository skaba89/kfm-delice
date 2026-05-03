"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, Crown, Lock, Unlock, Eye, Mail, Phone,
  Calendar, ShieldCheck,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface Customer {
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

// ── Component ──────────────────────────────────────────────────────────────

export function AdminCustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const PAGE_SIZE = 20;

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("role", "CUSTOMER");
      params.set("limit", String(100));
      if (search) params.set("search", search);

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        let data = json.data?.users || [];
        if (vipOnly) {
          // VIP = customers with more than 5 orders or early adopters (simplified)
          data = data.filter((c: Customer) => {
            const created = new Date(c.createdAt);
            const now = new Date();
            const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince > 180; // Registered > 6 months ago
          });
        }
        setCustomers(data);
        setTotal(json.data?.total || data.length);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, vipOnly]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return customers.slice(start, start + PAGE_SIZE);
  }, [customers, page]);

  const getDisplayName = (c: Customer) => {
    if (c.firstName && c.lastName) return `${c.firstName} ${c.lastName}`;
    if (c.firstName) return c.firstName;
    if (c.lastName) return c.lastName;
    return c.email.split("@")[0];
  };

  const getInitials = (c: Customer) => {
    if (c.firstName && c.lastName) return `${c.firstName[0]}${c.lastName[0]}`.toUpperCase();
    if (c.firstName) return c.firstName[0].toUpperCase();
    if (c.lastName) return c.lastName[0].toUpperCase();
    return c.email[0].toUpperCase();
  };

  const isVip = (c: Customer) => {
    const created = new Date(c.createdAt);
    const now = new Date();
    const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 180;
  };

  const totalCustomers = customers.length;
  const vipCount = customers.filter(isVip).length;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const newThisMonth = customers.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const resetFilters = () => {
    setSearch("");
    setVipOnly(false);
    setPage(1);
  };

  // Actions
  const handleToggleLock = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/users/${customer.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !customer.isLocked }),
      });
      const json = await res.json();
      if (json.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isLocked: !customer.isLocked } : c))
        );
        if (selectedCustomer?.id === customer.id) {
          setSelectedCustomer((prev) => prev ? { ...prev, isLocked: !prev.isLocked } : null);
        }
        toast.success(customer.isLocked ? "Compte deverrouille" : "Compte verrouille");
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur reseau");
    }
  };

  const handleToggleActive = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/users/${customer.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: !customer.isActive } : c))
        );
        if (selectedCustomer?.id === customer.id) {
          setSelectedCustomer((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
        }
        toast.success(customer.isActive ? "Compte desactive" : "Compte active");
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur reseau");
    }
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Clients</h2>
          <p className="mt-1 text-sm text-text-2">Base de clients globale</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />
          ))}
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Clients</h2>
            <p className="mt-1 text-sm text-text-2">Base de clients globale</p>
          </div>
          <button onClick={fetchCustomers} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text">Clients</h2>
        <p className="mt-1 text-sm text-text-2">{totalCustomers} client{totalCustomers !== 1 ? "s" : ""} au total</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Total clients</p>
          <p className="mt-1 text-xl font-bold text-text">{totalCustomers}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3 flex items-center gap-1">
            <Crown className="h-3 w-3 text-kfm-warning" />
            Clients VIP
          </p>
          <p className="mt-1 text-xl font-bold text-kfm-warning">{vipCount}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Nouveaux ce mois</p>
          <p className="mt-1 text-xl font-bold text-kfm-success">{newThisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom, email, telephone..."
          />
        </div>
        <button
          onClick={() => { setVipOnly(!vipOnly); setPage(1); }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-kfm-sm border px-3 py-2.5 text-xs font-medium transition",
            vipOnly
              ? "border-kfm-warning/30 bg-kfm-warning/10 text-kfm-warning"
              : "border-kfm-border text-text-2 hover:bg-surface-2"
          )}
        >
          <Crown className="h-3.5 w-3.5" /> VIP uniquement
        </button>
        {(search || vipOnly) && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Empty */}
      {customers.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucun client trouve"
          description="Aucun client ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser
            </button>
          }
        />
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="grid grid-cols-[0.5fr_1.2fr_1fr_0.8fr_0.7fr_0.7fr_0.6fr_0.4fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Client</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Nom</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Email</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Derniere connexion</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Inscrit le</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
        </div>

        {paginated.map((customer, index) => {
          const vip = isVip(customer);

          return (
            <div
              key={customer.id}
              className={cn(
                "grid grid-cols-[0.5fr_1.2fr_1fr_0.8fr_0.7fr_0.7fr_0.6fr_0.4fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                index % 2 === 1 && "bg-bg/40"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  vip ? "bg-kfm-warning/10 text-kfm-warning" : "bg-kfm-secondary/10 text-kfm-secondary"
                )}>
                  {getInitials(customer)}
                </div>
                {vip && (
                  <Crown className="h-3.5 w-3.5 text-kfm-warning" />
                )}
              </div>

              <button onClick={() => openDetail(customer)} className="text-sm font-medium text-text truncate hover:text-kfm-secondary transition text-left">
                {getDisplayName(customer)}
              </button>

              <span className="text-sm text-text-2 truncate">{customer.email}</span>

              <span className="text-sm text-text-2">{customer.phone || "—"}</span>

              <div className="flex items-center gap-1.5">
                {!customer.isActive && (
                  <span className="inline-flex items-center rounded-full border border-kfm-danger/20 bg-kfm-danger/10 px-2 py-0.5 text-[10px] font-semibold text-kfm-danger">
                    Inactif
                  </span>
                )}
                {customer.isLocked && (
                  <span className="inline-flex items-center rounded-full border border-kfm-danger/20 bg-kfm-danger/10 px-2 py-0.5 text-[10px] font-semibold text-kfm-danger">
                    Verrouille
                  </span>
                )}
                {customer.isActive && !customer.isLocked && (
                  <span className="inline-flex items-center rounded-full border border-kfm-success/20 bg-kfm-success/10 px-2 py-0.5 text-[10px] font-semibold text-kfm-success">
                    Actif
                  </span>
                )}
              </div>

              <span className="text-xs text-text-3">{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : "—"}</span>
              <span className="text-xs text-text-3">{formatDate(customer.createdAt)}</span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => openDetail(customer)}
                  className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-kfm-secondary"
                  title="Voir le detail"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleLock(customer)}
                  className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-kfm-warning"
                  title={customer.isLocked ? "Deverrouiller" : "Verrouiller"}
                >
                  {customer.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, customers.length)} sur {customers.length}</span>
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
        {paginated.map((customer) => {
          const vip = isVip(customer);

          return (
            <div key={customer.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <button onClick={() => openDetail(customer)} className="flex items-center gap-2.5 text-left">
                  <div className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    vip ? "bg-kfm-warning/10 text-kfm-warning" : "bg-kfm-secondary/10 text-kfm-secondary"
                  )}>
                    {getInitials(customer)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-text">{getDisplayName(customer)}</p>
                      {vip && <Crown className="h-3.5 w-3.5 text-kfm-warning" />}
                    </div>
                    <p className="text-xs text-text-3">{customer.email}</p>
                  </div>
                </button>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  customer.isActive && !customer.isLocked ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20" : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                )}>
                  {customer.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-kfm-border pt-2">
                <span className="text-xs text-text-3">{customer.phone || "—"}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openDetail(customer)} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleToggleLock(customer)} className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2">
                    {customer.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, customers.length)} sur {customers.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Customer Detail Dialog ─────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Detail du client</DialogTitle>
            <DialogDescription className="text-text-2">
              Informations et actions sur le compte client
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-2">
              {/* Profile header */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isVip(selectedCustomer) ? "bg-kfm-warning/10 text-kfm-warning" : "bg-kfm-secondary/10 text-kfm-secondary"
                )}>
                  {getInitials(selectedCustomer)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text truncate">{getDisplayName(selectedCustomer)}</p>
                    {isVip(selectedCustomer) && <Crown className="h-4 w-4 text-kfm-warning flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      selectedCustomer.isActive && !selectedCustomer.isLocked
                        ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                        : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                    )}>
                      {selectedCustomer.isLocked ? "Verrouille" : selectedCustomer.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-text-3 flex-shrink-0" />
                  <span className="text-text-2 truncate">{selectedCustomer.email}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-text-3 flex-shrink-0" />
                    <span className="text-text-2">{selectedCustomer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-text-3 flex-shrink-0" />
                  <span className="text-text-2">Inscrit le {formatDate(selectedCustomer.createdAt)}</span>
                </div>
                {selectedCustomer.lastLoginAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-text-3 flex-shrink-0" />
                    <span className="text-text-2">Derniere connexion : {formatDate(selectedCustomer.lastLoginAt)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-kfm-border">
                <button
                  onClick={() => handleToggleLock(selectedCustomer)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-kfm-sm px-3 py-2.5 text-xs font-semibold transition",
                    selectedCustomer.isLocked
                      ? "bg-kfm-success/10 text-kfm-success border border-kfm-success/20 hover:bg-kfm-success/20"
                      : "bg-kfm-warning/10 text-kfm-warning border border-kfm-warning/20 hover:bg-kfm-warning/20"
                  )}
                >
                  {selectedCustomer.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {selectedCustomer.isLocked ? "Deverrouiller" : "Verrouiller"}
                </button>
                <button
                  onClick={() => handleToggleActive(selectedCustomer)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-kfm-sm px-3 py-2.5 text-xs font-semibold transition",
                    selectedCustomer.isActive
                      ? "bg-kfm-danger/10 text-kfm-danger border border-kfm-danger/20 hover:bg-kfm-danger/20"
                      : "bg-kfm-success/10 text-kfm-success border border-kfm-success/20 hover:bg-kfm-success/20"
                  )}
                >
                  {selectedCustomer.isActive ? "Desactiver" : "Activer"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
