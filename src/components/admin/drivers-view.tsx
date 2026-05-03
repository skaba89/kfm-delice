"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Truck, Plus, Search, Filter, RefreshCcw, X, AlertCircle,
  Loader2, ArrowLeft, ArrowRight, Eye, Phone, Mail, Star,
  MoreVertical, ChevronDown, Bike, Car,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatNumber, initials } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  vehicleType: string;
  vehiclePlate: string | null;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  status: string;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  restaurant: { id: string; name: string } | null;
  createdAt: string;
}

interface CreateFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const VEHICLE_TYPES = [
  { value: "motorcycle", label: "Moto-taxi" },
  { value: "bicycle", label: "Velo" },
  { value: "car", label: "Voiture" },
  { value: "scooter", label: "Scooter" },
];

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  motorcycle: <Bike className="h-3.5 w-3.5" />,
  car: <Car className="h-3.5 w-3.5" />,
  bicycle: <Bike className="h-3.5 w-3.5" />,
  scooter: <Bike className="h-3.5 w-3.5" />,
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto-taxi",
  bicycle: "Velo",
  car: "Voiture",
  scooter: "Scooter",
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  offline: "bg-kfm-text-3/10 text-text-3 border-kfm-text-3/20",
  busy: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
};

const STATUS_LABELS: Record<string, string> = {
  online: "En ligne",
  offline: "Hors ligne",
  busy: "Occupe",
};

const STATUS_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "online", label: "En ligne" },
  { key: "offline", label: "Hors ligne" },
  { key: "busy", label: "Occupe" },
];

const emptyForm = (): CreateFormData => ({
  firstName: "", lastName: "", phone: "", email: "", vehicleType: "motorcycle", vehiclePlate: "",
});

// ── Component ──────────────────────────────────────────────────────────────

export function AdminDriversView() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [form, setForm] = useState<CreateFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", String(100));

      const res = await fetch(`/api/drivers?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        let data = json.data || [];
        if (statusFilter !== "all") {
          data = data.filter((d: Driver) => d.status === statusFilter);
        }
        setDrivers(data);
        setTotal(json.data?.length || data.length);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const totalPages = Math.max(1, Math.ceil(drivers.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return drivers.slice(start, start + PAGE_SIZE);
  }, [drivers, page]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const onlineCount = drivers.filter(d => d.status === "online").length;
    const unavailable = drivers.filter(d => !d.isAvailable).length;
    const avgRating = drivers.length > 0
      ? drivers.reduce((s, d) => s + (d.rating || 0), 0) / drivers.length
      : 0;
    return { onlineCount, unavailable, avgRating };
  }, [drivers]);

  // ── Create ──────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "Requis";
    if (!form.lastName.trim()) errors.lastName = "Requis";
    if (!form.phone.trim()) errors.phone = "Requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setForm(emptyForm());
        setFormErrors({});
        fetchDrivers();
      } else {
        setFormErrors({ submit: json.error || "Erreur lors de la creation" });
      }
    } catch {
      setFormErrors({ submit: "Erreur reseau" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle availability ────────────────────────────────────────────────
  const toggleAvailability = async (driver: Driver) => {
    try {
      await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isAvailable: !driver.isAvailable }),
      });
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, isAvailable: !d.isAvailable } : d));
    } catch { /* silent */ }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Livreurs</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des livreurs</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />)}
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <SkeletonTable />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && drivers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Livreurs</h2>
            <p className="mt-1 text-sm text-text-2">Gestion des livreurs</p>
          </div>
          <button onClick={fetchDrivers} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
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
          <h2 className="text-2xl font-bold tracking-tight text-text">Livreurs</h2>
          <p className="mt-1 text-sm text-text-2">{drivers.length} livreur{drivers.length !== 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setFormErrors({}); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter un livreur
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total livreurs" value={formatNumber(drivers.length)} icon={Truck} />
        <StatCard label="En ligne" value={formatNumber(stats.onlineCount)} icon={Phone} changeType="positive" />
        <StatCard label="Indisponibles" value={formatNumber(stats.unavailable)} icon={X} changeType="negative" />
        <StatCard label="Note moyenne" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) + " / 5" : "—"} icon={Star} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom, telephone..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.key}
              onClick={() => { setStatusFilter(sf.key); setPage(1); }}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === sf.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {sf.label}
            </button>
          ))}
        </div>
        {(search || statusFilter !== "all") && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Empty */}
      {drivers.length === 0 && (
        <EmptyState
          icon={Truck}
          title="Aucun livreur trouve"
          description={search || statusFilter !== "all" ? "Aucun livreur ne correspond a vos criteres." : "Commencez par ajouter votre premier livreur."}
          action={
            search || statusFilter !== "all" ? (
              <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                <RefreshCcw className="h-4 w-4" /> Reinitialiser
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                <Plus className="h-4 w-4" /> Ajouter un livreur
              </button>
            )
          }
        />
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr_0.8fr_0.6fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Livreur</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Vehicule</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Restaurant</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Livraisons</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Note</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
        </div>

        {paginated.map((driver, index) => (
          <div
            key={driver.id}
            className={cn(
              "grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr_0.8fr_0.6fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
              index % 2 === 1 && "bg-bg/40"
            )}
          >
            {/* Driver name */}
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                driver.isAvailable
                  ? "bg-kfm-success/10 text-kfm-success"
                  : "bg-kfm-text-3/10 text-text-3"
              )}>
                {initials(driver.firstName, driver.lastName)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-text truncate">{driver.firstName} {driver.lastName}</p>
                  {driver.isVerified && (
                    <span className="inline-flex items-center rounded-full border border-kfm-info/20 bg-kfm-info/10 px-1.5 py-0 text-[8px] font-bold text-kfm-info">V</span>
                  )}
                </div>
                {driver.email && <p className="text-xs text-text-3 truncate">{driver.email}</p>}
              </div>
            </div>

            <span className="text-sm text-text-2">{driver.phone || "—"}</span>

            {/* Vehicle */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-kfm-border bg-surface-2/50 px-2 py-0.5 text-xs text-text-2">
                {VEHICLE_ICONS[driver.vehicleType]}
                {VEHICLE_LABELS[driver.vehicleType] || driver.vehicleType}
              </span>
              {driver.vehiclePlate && (
                <span className="text-xs text-text-3 font-mono">{driver.vehiclePlate}</span>
              )}
            </div>

            <span className="text-sm text-text-2 truncate">{driver.restaurant?.name || "—"}</span>

            {/* Status */}
            <span className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold w-fit",
              STATUS_COLORS[driver.status] || STATUS_COLORS.offline
            )}>
              {STATUS_LABELS[driver.status] || driver.status}
            </span>

            <span className="text-sm font-medium text-text">{formatNumber(driver.totalDeliveries)}</span>

            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-kfm-warning fill-kfm-warning" />
              <span className="text-sm font-medium text-text">
                {driver.rating > 0 ? driver.rating.toFixed(1) : "—"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => { setSelectedDriver(driver); setDetailOpen(true); }}
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
                  <DropdownMenuItem onClick={() => toggleAvailability(driver)}>
                    {driver.isAvailable ? "Rendre indisponible" : "Rendre disponible"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedDriver(driver); setDetailOpen(true); }}>
                    Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, drivers.length)} sur {drivers.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>{p}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {paginated.map(driver => (
          <div key={driver.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  driver.isAvailable ? "bg-kfm-success/10 text-kfm-success" : "bg-kfm-text-3/10 text-text-3"
                )}>
                  {initials(driver.firstName, driver.lastName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{driver.firstName} {driver.lastName}</p>
                  <p className="text-xs text-text-3">{driver.phone || "—"}</p>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                STATUS_COLORS[driver.status] || STATUS_COLORS.offline
              )}>
                {STATUS_LABELS[driver.status] || driver.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-kfm-border pt-3 text-xs text-text-3">
              <span className="inline-flex items-center gap-1">
                {VEHICLE_ICONS[driver.vehicleType]}
                {VEHICLE_LABELS[driver.vehicleType] || driver.vehicleType}
                {driver.vehiclePlate ? ` · ${driver.vehiclePlate}` : ""}
              </span>
              <div className="flex items-center gap-3">
                <span>{driver.totalDeliveries} livr.</span>
                <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-kfm-warning fill-kfm-warning" />{driver.rating > 0 ? driver.rating.toFixed(1) : "—"}</span>
              </div>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, drivers.length)} sur {drivers.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter un livreur</DialogTitle>
            <DialogDescription className="text-text-2">Remplissez les informations du livreur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {formErrors.submit && (
              <div className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/5 px-3 py-2 text-xs text-kfm-danger">{formErrors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Prenom *</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Prenom" />
                {formErrors.firstName && <p className="mt-1 text-xs text-kfm-danger">{formErrors.firstName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-2">Nom *</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                  placeholder="Nom" />
                {formErrors.lastName && <p className="mt-1 text-xs text-kfm-danger">{formErrors.lastName}</p>}
              </div>
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
                  placeholder="email@exemple.com" />
                {formErrors.email && <p className="mt-1 text-xs text-kfm-danger">{formErrors.email}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Type de vehicule</label>
              <select
                value={form.vehicleType}
                onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none"
              >
                {VEHICLE_TYPES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-2">Immatriculation</label>
              <input value={form.vehiclePlate} onChange={e => setForm(f => ({ ...f, vehiclePlate: e.target.value }))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: CG-123-AB" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleCreate} disabled={submitting}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajouter le livreur
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg">
          {selectedDriver && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">{selectedDriver.firstName} {selectedDriver.lastName}</DialogTitle>
                <DialogDescription className="text-text-2">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mr-2", STATUS_COLORS[selectedDriver.status] || STATUS_COLORS.offline)}>
                    {STATUS_LABELS[selectedDriver.status] || selectedDriver.status}
                  </span>
                  {VEHICLE_LABELS[selectedDriver.vehicleType] || selectedDriver.vehicleType}
                  {selectedDriver.vehiclePlate ? ` · ${selectedDriver.vehiclePlate}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Livraisons</p>
                    <p className="mt-1 text-lg font-bold text-text">{formatNumber(selectedDriver.totalDeliveries)}</p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Revenus totaux</p>
                    <p className="mt-1 text-lg font-bold text-kfm-success">{formatCurrency(selectedDriver.totalEarnings)}</p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Note</p>
                    <p className="mt-1 text-lg font-bold text-text">{selectedDriver.rating > 0 ? selectedDriver.rating.toFixed(1) + " / 5" : "—"}</p>
                  </div>
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-3">
                    <p className="text-xs text-text-3">Disponible</p>
                    <p className={cn("mt-1 text-sm font-medium", selectedDriver.isAvailable ? "text-kfm-success" : "text-kfm-danger")}>
                      {selectedDriver.isAvailable ? "Oui" : "Non"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedDriver.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-text">
                      <Phone className="h-4 w-4 text-text-3" /> {selectedDriver.phone}
                    </div>
                  )}
                  {selectedDriver.email && (
                    <div className="flex items-center gap-2.5 text-sm text-text">
                      <Mail className="h-4 w-4 text-text-3" /> {selectedDriver.email}
                    </div>
                  )}
                  {selectedDriver.restaurant && (
                    <div className="flex items-center gap-2.5 text-sm text-text-2">
                      <Truck className="h-4 w-4 text-text-3" /> Restaurant: {selectedDriver.restaurant.name}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => toggleAvailability(selectedDriver)}
                  className={cn(
                    "rounded-kfm-sm px-4 py-2 text-sm font-semibold transition hover:opacity-90",
                    selectedDriver.isAvailable
                      ? "bg-kfm-danger text-white"
                      : "bg-kfm-success text-white"
                  )}
                >
                  {selectedDriver.isAvailable ? "Rendre indisponible" : "Rendre disponible"}
                </button>
                <button onClick={() => setDetailOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
                  Fermer
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
