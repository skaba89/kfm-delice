"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CalendarDays, Search, RefreshCcw, ArrowLeft, ArrowRight,
  Loader2, X, AlertCircle, Users, Clock, AlertTriangle,
  CheckCircle2, XCircle, UserX, Check, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { authHeaders } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";

// ── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface Reservation {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  partySize: number;
  date: string;
  time: string;
  duration: number;
  status: string;
  occasion: string | null;
  specialRequests: string | null;
  restaurantId: string;
  customer: Customer | null;
  createdAt: string;
  updatedAt: string;
}

interface CapacityInfo {
  totalCapacity: number;
  timeSlots: Array<{ time: string; partySize: number; available: number }>;
  restaurantHours: Array<{
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>;
}

type FilterTab = "all" | "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

// ── Constants ──────────────────────────────────────────────────────────────

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "PENDING", label: "En attente" },
  { key: "CONFIRMED", label: "Confirmee" },
  { key: "SEATED", label: "Installee" },
  { key: "COMPLETED", label: "Terminee" },
  { key: "CANCELLED", label: "Annulee" },
  { key: "NO_SHOW", label: "Absent" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20" },
  CONFIRMED: { label: "Confirmee", color: "bg-kfm-info/10 text-kfm-info border-kfm-info/20" },
  SEATED: { label: "Installee", color: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20" },
  COMPLETED: { label: "Terminee", color: "bg-kfm-success/10 text-kfm-success border-kfm-success/20" },
  CANCELLED: { label: "Annulee", color: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20" },
  NO_SHOW: { label: "Absent", color: "bg-kfm-text-3/10 text-kfm-text-3 border-kfm-text-3/20" },
};

const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const PAGE_SIZE = 12;

// ── Component ──────────────────────────────────────────────────────────────

export function AdminReservationsView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split("T")[0]);
  const [page, setPage] = useState(1);
  const [showCapacity, setShowCapacity] = useState(false);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (dateFilter) params.set("date", dateFilter);

      const res = await fetch(`/api/reservations?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        let data = json.data?.reservations || [];
        setCapacityInfo(json.data?.capacityInfo || null);
        if (search) {
          const q = search.toLowerCase();
          data = data.filter((r: Reservation) =>
            r.guestName.toLowerCase().includes(q) ||
            r.guestPhone.includes(q) ||
            r.guestEmail?.toLowerCase().includes(q)
          );
        }
        setReservations(data);
      } else {
        setError(json.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, dateFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const totalPages = Math.max(1, Math.ceil(reservations.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return reservations.slice(start, start + PAGE_SIZE);
  }, [reservations, page]);

  const today = new Date().toISOString().split("T")[0];
  const todayReservations = reservations.filter((r) => {
    const d = new Date(r.date);
    return d.toISOString().split("T")[0] === today;
  });
  const pendingToday = todayReservations.filter((r) => r.status === "PENDING").length;
  const noShowsToday = todayReservations.filter((r) => r.status === "NO_SHOW").length;

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setDateFilter(new Date().toISOString().split("T")[0]);
    setPage(1);
  };

  // ── Status Update ────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        const label = statusConfig[newStatus]?.label || newStatus;
        toast.success(`Reservation ${label.toLowerCase()} avec succes`);
        await fetchReservations();
      } else {
        toast.error(json.error || "Impossible de mettre a jour la reservation");
      }
    } catch {
      toast.error("Erreur lors de la mise a jour");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Reservation annulee avec succes");
        await fetchReservations();
      } else {
        toast.error(json.error || "Impossible d'annuler cette reservation");
      }
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Reservations</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des reservations</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kfm-skeleton h-24 rounded-kfm-md" />
          ))}
        </div>
        <div className="kfm-skeleton h-10 w-full max-w-sm rounded-kfm-sm" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="kfm-skeleton h-8 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (reservations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Reservations</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des reservations</p>
        </div>
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
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
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
          icon={CalendarDays}
          title="Aucune reservation trouvee"
          description="Aucune reservation ne correspond a vos criteres."
          action={
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              <RefreshCcw className="h-4 w-4" /> Reinitialiser
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
        <h2 className="text-2xl font-bold tracking-tight text-text">Reservations</h2>
        <p className="mt-1 text-sm text-text-2">
          {reservations.length} reservation{reservations.length !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Reservations aujourd&apos;hui</p>
          <p className="mt-1 text-xl font-bold text-text">{todayReservations.length}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">En attente de confirmation</p>
          <p className="mt-1 text-xl font-bold text-kfm-warning">{pendingToday}</p>
        </div>
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-text-3">Absents aujourd&apos;hui</p>
          <p className="mt-1 text-xl font-bold text-text-3">{noShowsToday}</p>
        </div>
      </div>

      {/* Capacity panel */}
      {capacityInfo && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2/40 transition-colors"
            onClick={() => setShowCapacity(!showCapacity)}
          >
            <span className="text-sm font-semibold text-text flex items-center gap-2">
              <Users className="h-4 w-4 text-kfm-secondary" />
              Capacite et horaires
              {capacityInfo.totalCapacity && (
                <span className="text-xs font-normal text-text-3">
                  (Capacite totale : {capacityInfo.totalCapacity} places)
                </span>
              )}
            </span>
            {showCapacity ? <ChevronUp className="h-4 w-4 text-text-3" /> : <ChevronDown className="h-4 w-4 text-text-3" />}
          </button>
          {showCapacity && (
            <div className="border-t border-kfm-border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Restaurant hours */}
                <div>
                  <p className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Horaires d&apos;ouverture</p>
                  <div className="space-y-1">
                    {capacityInfo.restaurantHours.map((h) => (
                      <div key={h.dayOfWeek} className="flex items-center justify-between text-xs">
                        <span className="text-text-2">{dayNames[h.dayOfWeek]}</span>
                        <span className={cn("font-medium", h.isClosed ? "text-kfm-danger" : "text-text")}>
                          {h.isClosed ? "Ferme" : `${h.openTime || "??:??"} - ${h.closeTime || "??:??"}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Time slot capacity */}
                <div>
                  <p className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">Occupation par creneau</p>
                  {capacityInfo.timeSlots.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {capacityInfo.timeSlots.map((slot) => {
                        const pct = Math.round((slot.partySize / capacityInfo.totalCapacity) * 100);
                        const barColor = pct >= 90 ? "bg-kfm-danger" : pct >= 60 ? "bg-kfm-warning" : "bg-kfm-success";
                        return (
                          <div key={slot.time} className="flex items-center gap-2">
                            <span className="text-xs text-text-2 w-12 flex-shrink-0">{slot.time}</span>
                            <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                              <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-text-3 w-16 text-right">{slot.partySize}/{capacityInfo.totalCapacity}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-text-3">Aucune reservation pour cette date</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
              placeholder="Rechercher par nom, telephone..."
            />
          </div>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="rounded-kfm-sm border border-kfm-border bg-surface pl-9 pr-3 py-2.5 text-xs text-text focus:border-kfm-secondary focus:outline-none"
            />
          </div>
          {(search || activeTab !== "all" || dateFilter !== today) && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-kfm-sm px-3 py-2 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/10">
              <X className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
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
        <div className="grid grid-cols-[1fr_0.6fr_0.7fr_0.5fr_0.5fr_0.5fr_1.2fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Invite</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Telephone</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Date / Heure</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-center">Personnes</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Occasion</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Statut</span>
          <span className="text-xs font-semibold text-text-3 uppercase tracking-wide text-right">Actions rapides</span>
        </div>

        {paginated.map((res, index) => {
          const cfg = statusConfig[res.status] || { label: res.status, color: "bg-surface-2 text-text-2 border-kfm-border" };
          const isUpdating = updatingId === res.id;

          return (
            <div
              key={res.id}
              className={cn(
                "grid grid-cols-[1fr_0.6fr_0.7fr_0.5fr_0.5fr_0.5fr_1.2fr] gap-2 items-center border-b border-kfm-border px-5 py-3.5 transition-colors hover:bg-surface-2/40 last:border-0",
                index % 2 === 1 && "bg-bg/40"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kfm-secondary/10 text-[10px] font-bold text-kfm-secondary">
                  {res.guestName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{res.guestName}</p>
                  {res.guestEmail && <p className="text-xs text-text-3 truncate">{res.guestEmail}</p>}
                </div>
              </div>

              <span className="text-sm text-text-2">{res.guestPhone}</span>

              <div className="flex items-center gap-1.5 text-sm text-text-2">
                <CalendarDays className="h-3.5 w-3.5 text-text-3" />
                {formatDate(res.date)} {res.time}
              </div>

              <span className="text-sm text-text text-center">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-text-3" />
                  {res.partySize}
                </span>
              </span>

              <span className="text-xs text-text-3">{res.occasion || "—"}</span>

              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", cfg.color)}>
                {cfg.label}
              </span>

              {/* Quick Actions */}
              <div className="flex items-center justify-end gap-1">
                {res.specialRequests && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-3 mr-1" title={res.specialRequests}>
                    <AlertTriangle className="h-3 w-3" />
                  </span>
                )}
                {res.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(res.id, "CONFIRMED")}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 rounded-kfm-sm bg-kfm-success/10 px-2 py-1 text-[10px] font-medium text-kfm-success hover:bg-kfm-success/20 transition-colors disabled:opacity-40"
                      title="Confirmer"
                    >
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      <span className="hidden xl:inline">Confirmer</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(res.id, "NO_SHOW")}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 rounded-kfm-sm bg-kfm-text-3/10 px-2 py-1 text-[10px] font-medium text-text-3 hover:bg-kfm-text-3/20 transition-colors disabled:opacity-40"
                      title="Absent"
                    >
                      <UserX className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 rounded-kfm-sm bg-kfm-danger/10 px-2 py-1 text-[10px] font-medium text-kfm-danger hover:bg-kfm-danger/20 transition-colors disabled:opacity-40"
                      title="Annuler"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </>
                )}
                {res.status === "CONFIRMED" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(res.id, "SEATED")}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 rounded-kfm-sm bg-kfm-info/10 px-2 py-1 text-[10px] font-medium text-kfm-info hover:bg-kfm-info/20 transition-colors disabled:opacity-40"
                      title="Installe"
                    >
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                      <span className="hidden xl:inline">Installe</span>
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 rounded-kfm-sm bg-kfm-danger/10 px-2 py-1 text-[10px] font-medium text-kfm-danger hover:bg-kfm-danger/20 transition-colors disabled:opacity-40"
                      title="Annuler"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </>
                )}
                {res.status === "SEATED" && (
                  <button
                    onClick={() => handleStatusUpdate(res.id, "COMPLETED")}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1 rounded-kfm-sm bg-kfm-success/10 px-2 py-1 text-[10px] font-medium text-kfm-success hover:bg-kfm-success/20 transition-colors disabled:opacity-40"
                    title="Terminer"
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    <span className="hidden xl:inline">Terminer</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-kfm-border px-5 py-3">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, reservations.length)} sur {reservations.length}</span>
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
        {paginated.map((res) => {
          const cfg = statusConfig[res.status] || { label: res.status, color: "bg-surface-2 text-text-2 border-kfm-border" };
          const isUpdating = updatingId === res.id;

          return (
            <div key={res.id} className="rounded-kfm-md border border-kfm-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-text">{res.guestName}</p>
                  <p className="text-xs text-text-3">{res.guestPhone}</p>
                </div>
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", cfg.color)}>
                  {cfg.label}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-text-2 mb-3">
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-text-3" />
                  {formatDate(res.date)} a {res.time}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-text-3" />
                  {res.partySize} personne{res.partySize !== 1 ? "s" : ""}
                  {res.occasion && ` · ${res.occasion}`}
                </p>
                {res.specialRequests && (
                  <p className="flex items-center gap-1.5 text-text-3">
                    <AlertTriangle className="h-3 w-3" />
                    {res.specialRequests}
                  </p>
                )}
              </div>
              {/* Quick actions */}
              <div className="flex items-center gap-2 border-t border-kfm-border pt-3">
                {res.status === "PENDING" && (
                  <>
                    <button onClick={() => handleStatusUpdate(res.id, "CONFIRMED")} disabled={isUpdating} className="flex-1 inline-flex items-center justify-center gap-1 rounded-kfm-sm bg-kfm-success/10 px-2 py-2 text-xs font-medium text-kfm-success hover:bg-kfm-success/20 disabled:opacity-40">
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Confirmer
                    </button>
                    <button onClick={() => handleStatusUpdate(res.id, "NO_SHOW")} disabled={isUpdating} className="rounded-kfm-sm bg-kfm-text-3/10 px-2 py-2 text-xs text-text-3 hover:bg-kfm-text-3/20 disabled:opacity-40" title="Absent">
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(res.id)} disabled={isUpdating} className="rounded-kfm-sm bg-kfm-danger/10 px-2 py-2 text-xs text-kfm-danger hover:bg-kfm-danger/20 disabled:opacity-40">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {res.status === "CONFIRMED" && (
                  <>
                    <button onClick={() => handleStatusUpdate(res.id, "SEATED")} disabled={isUpdating} className="flex-1 inline-flex items-center justify-center gap-1 rounded-kfm-sm bg-kfm-info/10 px-2 py-2 text-xs font-medium text-kfm-info hover:bg-kfm-info/20 disabled:opacity-40">
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                      Installe
                    </button>
                    <button onClick={() => handleDelete(res.id)} disabled={isUpdating} className="rounded-kfm-sm bg-kfm-danger/10 px-2 py-2 text-xs text-kfm-danger hover:bg-kfm-danger/20 disabled:opacity-40">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {res.status === "SEATED" && (
                  <button onClick={() => handleStatusUpdate(res.id, "COMPLETED")} disabled={isUpdating} className="w-full inline-flex items-center justify-center gap-1 rounded-kfm-sm bg-kfm-success/10 px-2 py-2 text-xs font-medium text-kfm-success hover:bg-kfm-success/20 disabled:opacity-40">
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Terminer
                  </button>
                )}
                {(res.status === "COMPLETED" || res.status === "CANCELLED" || res.status === "NO_SHOW") && (
                  <span className="flex items-center gap-1 text-xs text-text-3">
                    <Clock className="h-3 w-3" /> Duree : {res.duration} min
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-text-3">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, reservations.length)} sur {reservations.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-kfm-border p-1.5 text-text-2 hover:bg-surface-2 disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
