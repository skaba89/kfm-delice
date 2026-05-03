"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Truck, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, PackageSearch, Filter,
  MapPin, Phone, MoreVertical, ChevronRight, Clock,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime, formatRelativeTime, initials } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleType: string | null;
  vehiclePlate: string | null;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
}

interface Delivery {
  id: string;
  status: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  dropoffLandmark: string | null;
  deliveryFee: number;
  driverEarning: number;
  estimatedTime: number;
  notes: string | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  driver: Driver | null;
  order: Order;
}

type FilterTab = "all" | "PENDING" | "SEARCHING_DRIVER" | "DRIVER_ASSIGNED" | "PICKED_UP" | "DELIVERED" | "FAILED";

// ── Constants ──────────────────────────────────────────────────────────────

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "PENDING", label: "En attente" },
  { key: "SEARCHING_DRIVER", label: "Recherche livreur" },
  { key: "DRIVER_ASSIGNED", label: "Livreur assigne" },
  { key: "PICKED_UP", label: "Recuperee" },
  { key: "DELIVERED", label: "Livree" },
  { key: "FAILED", label: "Echouee" },
];

const deliveryStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20" },
  SEARCHING_DRIVER: { label: "Recherche livreur", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20" },
  DRIVER_ASSIGNED: { label: "Livreur assigne", color: "bg-kfm-info/10 text-kfm-info border-kfm-info/20" },
  PICKED_UP: { label: "Recuperee", color: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20" },
  DELIVERED: { label: "Livree", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20" },
  FAILED: { label: "Echouee", color: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20" },
};

const nextStatusOptions: Record<string, { key: string; label: string }[]> = {
  PENDING: [{ key: "SEARCHING_DRIVER", label: "Rechercher livreur" }],
  SEARCHING_DRIVER: [{ key: "DRIVER_ASSIGNED", label: "Assigner livreur" }, { key: "FAILED", label: "Marquer echouee" }],
  DRIVER_ASSIGNED: [{ key: "PICKED_UP", label: "Marquer recuperee" }, { key: "FAILED", label: "Marquer echouee" }],
  PICKED_UP: [{ key: "DELIVERED", label: "Marquer livree" }, { key: "FAILED", label: "Marquer echouee" }],
};

const PAGE_SIZE = 12;

// ── Component ──────────────────────────────────────────────────────────────

export function AdminDeliveriesView() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);

      const res = await fetch(`/api/deliveries?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        let data = json.data || [];
        if (search) {
          const q = search.toLowerCase();
          data = data.filter((d: Delivery) =>
            d.order?.orderNumber?.toLowerCase().includes(q) ||
            d.order?.customerName?.toLowerCase().includes(q) ||
            d.dropoffAddress?.toLowerCase().includes(q) ||
            d.driver?.firstName?.toLowerCase().includes(q) ||
            d.driver?.lastName?.toLowerCase().includes(q)
          );
        }
        setDeliveries(data);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const totalPages = Math.max(1, Math.ceil(deliveries.length / PAGE_SIZE));
  const paginatedDeliveries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return deliveries.slice(start, start + PAGE_SIZE);
  }, [deliveries, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setPage(1);
  };

  const handleStatusUpdate = async (deliveryId: string, newStatus: string) => {
    try {
      setUpdatingStatus(deliveryId);
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === deliveryId ? { ...d, status: newStatus } : d))
        );
      }
    } catch { /* silent */ }
    finally { setUpdatingStatus(null); }
  };

  const totalDeliveries = deliveries.length;
  const deliveredCount = deliveries.filter(d => d.status === "DELIVERED").length;
  const pendingCount = deliveries.filter(d => d.status === "PENDING" || d.status === "SEARCHING_DRIVER").length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Livraisons</h2>
          <p className="mt-1 text-sm text-text-2">Livraisons globales</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />
          ))}
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="kfm-skeleton h-8 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (deliveries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Livraisons</h2>
          <p className="mt-1 text-sm text-text-2">Livraisons globales</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher une livraison..."
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <EmptyState
          icon={Truck}
          title="Aucune livraison trouvee"
          description="Aucune livraison ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser les filtres
            </button>
          }
        />
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text">Livraisons</h2>
        <p className="mt-1 text-sm text-text-2">
          {totalDeliveries} livraison{totalDeliveries !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Total livraisons</p>
          <p className="mt-1 text-xl font-bold text-text">{totalDeliveries}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">En cours</p>
          <p className="mt-1 text-xl font-bold text-kfm-warning">{pendingCount}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Livrees</p>
          <p className="mt-1 text-xl font-bold text-kfm-success">{deliveredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher par commande, client..."
            />
          </div>
          {(search || activeTab !== "all") && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
              <X className="h-3 w-3" /> Reinitialiser
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Desktop Table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="grid grid-cols-[0.8fr_0.8fr_1fr_1fr_0.9fr_0.7fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Commande</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Client</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Livreur</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Adresses</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Date</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions</span>
        </div>

        {paginatedDeliveries.map((delivery, index) => {
          const isUpdating = updatingStatus === delivery.id;
          const statusCfg = deliveryStatusConfig[delivery.status] || { label: delivery.status, color: "bg-surface-2 text-text-2 border-kfm-border" };
          const nextOptions = nextStatusOptions[delivery.status] || [];

          return (
            <div
              key={delivery.id}
              className={cn(
                "grid grid-cols-[0.8fr_0.8fr_1fr_1fr_0.9fr_0.7fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                index % 2 === 1 && "bg-bg/40"
              )}
            >
              <span className="text-sm font-semibold text-text truncate">
                {delivery.order?.orderNumber || "—"}
              </span>

              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-[10px] font-bold text-kfm-secondary">
                  {initials(delivery.order?.customerName || "—")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{delivery.order?.customerName || "—"}</p>
                  <p className="text-xs text-text-3 truncate">{delivery.order?.customerPhone || "—"}</p>
                </div>
              </div>

              <div className="min-w-0">
                {delivery.driver ? (
                  <>
                    <p className="text-sm text-text truncate">
                      {delivery.driver.firstName} {delivery.driver.lastName}
                    </p>
                    <p className="text-xs text-text-3 truncate">
                      {delivery.driver.vehicleType} {delivery.driver.vehiclePlate ? `· ${delivery.driver.vehiclePlate}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-text-3 italic">Non assigne</p>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-text-2 truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-text-3" />
                  {delivery.dropoffAddress || "—"}
                </p>
              </div>

              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusCfg.color)}>
                {statusCfg.label}
              </span>

              <span className="text-xs text-text-3 whitespace-nowrap">{formatRelativeTime(delivery.createdAt)}</span>

              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => { setSelectedDelivery(delivery); setDetailOpen(true); }}
                  className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2 hover:text-text disabled:opacity-40" disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {nextOptions.map((opt) => (
                      <DropdownMenuItem key={opt.key} onClick={() => handleStatusUpdate(delivery.id, opt.key)}>
                        <RefreshCcw className="h-4 w-4" />
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                    {nextOptions.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-text-3">Aucune action disponible</div>
                    )}
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
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalDeliveries)} sur {totalDeliveries}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === p ? "bg-kfm-secondary text-white" : "text-text-2 hover:bg-surface-2")}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {paginatedDeliveries.map((delivery) => {
          const isUpdating = updatingStatus === delivery.id;
          const statusCfg = deliveryStatusConfig[delivery.status] || { label: delivery.status, color: "bg-surface-2 text-text-2 border-kfm-border" };
          const nextOptions = nextStatusOptions[delivery.status] || [];

          return (
            <div key={delivery.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-text">{delivery.order?.orderNumber || "—"}</p>
                  <p className="text-xs text-text-2">{delivery.order?.customerName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusCfg.color)}>
                    {statusCfg.label}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2" disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {nextOptions.map((opt) => (
                        <DropdownMenuItem key={opt.key} onClick={() => handleStatusUpdate(delivery.id, opt.key)}>
                          <RefreshCcw className="h-4 w-4" /> {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-text-2 mb-3">
                {delivery.driver ? (
                  <p className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-text-3" />
                    {delivery.driver.firstName} {delivery.driver.lastName} — {delivery.driver.vehicleType}
                  </p>
                ) : (
                  <p className="italic text-text-3">Aucun livreur assigne</p>
                )}
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-text-3" />
                  {delivery.dropoffAddress || "—"}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-kfm-border pt-3">
                <span className="text-sm font-bold text-text">{formatCurrency(delivery.order?.total || 0)}</span>
                <span className="text-xs text-text-3 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatRelativeTime(delivery.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalDeliveries)} sur {totalDeliveries}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedDelivery && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text flex items-center gap-2">
                  Livraison #{selectedDelivery.order?.orderNumber}
                </DialogTitle>
                <DialogDescription className="text-text-2">
                  {formatDateTime(selectedDelivery.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Status */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Statut</h4>
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                    deliveryStatusConfig[selectedDelivery.status]?.color || "bg-surface-2 text-text-2 border-kfm-border"
                  )}>
                    {deliveryStatusConfig[selectedDelivery.status]?.label || selectedDelivery.status}
                  </span>
                </div>

                {/* Client */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Client</h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-text">{selectedDelivery.order?.customerName}</p>
                    <p className="text-xs text-text-2 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedDelivery.order?.customerPhone}
                    </p>
                  </div>
                </div>

                {/* Driver */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Livreur</h4>
                  {selectedDelivery.driver ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-text">
                        {selectedDelivery.driver.firstName} {selectedDelivery.driver.lastName}
                      </p>
                      <p className="text-xs text-text-2 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedDelivery.driver.phone}
                      </p>
                      {selectedDelivery.driver.vehicleType && (
                        <p className="text-xs text-text-3">
                          Vehicule: {selectedDelivery.driver.vehicleType}
                          {selectedDelivery.driver.vehiclePlate ? ` (${selectedDelivery.driver.vehiclePlate})` : ""}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-text-3 italic">Aucun livreur assigne</p>
                  )}
                </div>

                {/* Addresses */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Adresses</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-kfm-success mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-text-2">Depart</p>
                        <p className="text-sm text-text">{selectedDelivery.pickupAddress || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-kfm-danger mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-text-2">Destination</p>
                        <p className="text-sm text-text">{selectedDelivery.dropoffAddress || "—"}</p>
                        {selectedDelivery.dropoffLandmark && (
                          <p className="text-xs text-text-3 mt-0.5">Point de repere: {selectedDelivery.dropoffLandmark}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fees */}
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-3">Montants</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-2">Montant commande</span>
                      <span className="text-text">{formatCurrency(selectedDelivery.order?.total || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-2">Frais de livraison</span>
                      <span className="text-text">{formatCurrency(selectedDelivery.deliveryFee)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-2">Gain livreur</span>
                      <span className="text-kfm-secondary">{formatCurrency(selectedDelivery.driverEarning)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-2">Temps estime</span>
                      <span className="text-text">{selectedDelivery.estimatedTime} min</span>
                    </div>
                  </div>
                </div>

                {selectedDelivery.notes && (
                  <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4">
                    <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Notes</h4>
                    <p className="text-sm text-text-2">{selectedDelivery.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
