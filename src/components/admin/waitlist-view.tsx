"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, Plus, Search, Users, X, CheckCircle, AlertCircle, Phone,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────────────

type WaitStatus = "waiting" | "seated" | "cancelled";

interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  status: WaitStatus;
  notes: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<WaitStatus, { label: string; color: string }> = {
  waiting: { label: "En attente", color: "bg-kfm-warning/10 text-kfm-warning border border-kfm-warning/20" },
  seated: { label: "Installe", color: "bg-kfm-success/10 text-kfm-success border border-kfm-success/20" },
  cancelled: { label: "Annulee", color: "bg-gray-500/10 text-gray-500 border border-gray-500/20" },
};

const FILTER_TABS: { key: "all" | WaitStatus; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "waiting", label: "En attente" },
  { key: "seated", label: "Installees" },
  { key: "cancelled", label: "Annulees" },
];

const STORAGE_KEY = "kfm_waitlist";

function formatWaitTime(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "< 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rm = min % 60;
  return `${h}h ${rm}min`;
}

function formatWaitMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminWaitlistView() {
  const [entries, setEntries] = useState<WaitlistEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | WaitStatus>("all");
  const [now, setNow] = useState(Date.now());
  const [createOpen, setCreateOpen] = useState(false);
  const [seatTarget, setSeatTarget] = useState<WaitlistEntry | null>(null);
  const [cancelTarget, setCancelTarget] = useState<WaitlistEntry | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", partySize: "2", notes: "" });

  const saveEntries = (updated: WaitlistEntry[]) => {
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Auto-refresh wait times every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search);
        const matchFilter = filter === "all" || e.status === filter;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        // Longest wait first for "waiting" entries
        if (a.status === "waiting" && b.status === "waiting") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Then by createdAt descending for others
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [entries, search, filter, now]);

  const stats = useMemo(() => {
    const waiting = entries.filter((e) => e.status === "waiting");
    const seated = entries.filter((e) => e.status === "seated");
    const avgWait = waiting.length > 0
      ? Math.round(waiting.reduce((s, e) => s + (Date.now() - new Date(e.createdAt).getTime()), 0) / waiting.length / 60000)
      : 0;
    return { waiting: waiting.length, placedToday: seated.length, avgWait };
  }, [entries, now]);

  const handleAdd = () => {
    if (!form.name || !form.phone) return;
    const entry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      name: form.name,
      phone: form.phone,
      partySize: parseInt(form.partySize) || 2,
      status: "waiting",
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    saveEntries([entry, ...entries]);
    setCreateOpen(false);
    setForm({ name: "", phone: "", partySize: "2", notes: "" });
  };

  const seatGuest = () => {
    if (!seatTarget) return;
    saveEntries(entries.map((e) => e.id === seatTarget.id ? { ...e, status: "seated" as WaitStatus } : e));
    setSeatTarget(null);
  };

  const cancelGuest = () => {
    if (!cancelTarget) return;
    saveEntries(entries.map((e) => e.id === cancelTarget.id ? { ...e, status: "cancelled" as WaitStatus } : e));
    setCancelTarget(null);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold tracking-tight text-text">Liste d&apos;attente</h2><p className="mt-1 text-sm text-text-2">Gestion des files d&apos;attente</p></div>
        <div className="grid gap-4 sm:grid-cols-3"><SkeletonTable /><SkeletonTable /><SkeletonTable /></div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Liste d&apos;attente</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des files d&apos;attente en temps reel</p>
        </div>
        <button
          onClick={() => { setForm({ name: "", phone: "", partySize: "2", notes: "" }); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="En attente" value={formatNumber(stats.waiting)} icon={Clock} className="border-l-4 border-l-kfm-warning" />
        <StatCard label="Temps moyen" value={`${stats.avgWait} min`} icon={AlertCircle} className="border-l-4 border-l-kfm-info" />
        <StatCard label="Places aujourd&apos;hui" value={formatNumber(stats.placedToday)} icon={CheckCircle} className="border-l-4 border-l-kfm-success" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-kfm-sm border border-kfm-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
            placeholder="Rechercher par nom ou telephone..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                filter === tab.key
                  ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary"
                  : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={search || filter !== "all" ? "Aucun resultat" : "File d&apos;attente vide"}
          description={search || filter !== "all" ? "Aucune entree ne correspond a vos criteres." : "Aucun client en attente actuellement."}
          action={
            search || filter !== "all"
              ? <button onClick={() => { setSearch(""); setFilter("all"); }} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2"><X className="h-4 w-4" /> Reinitialiser</button>
              : <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><Plus className="h-4 w-4" /> Ajouter</button>
          }
        />
      ) : (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[0.5fr_0.4fr_0.3fr_0.5fr_0.4fr_0.5fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase">Client</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Telephone</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-center">Personnes</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Temps d&apos;attente</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-right">Actions</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="md:grid md:grid-cols-[0.5fr_0.4fr_0.3fr_0.5fr_0.4fr_0.5fr] gap-2 items-center border-b border-kfm-border px-5 py-3 hover:bg-surface-2/40 last:border-0">
                {/* Desktop cells */}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-text">{entry.name}</p>
                  {entry.notes && <p className="text-[10px] text-text-3 truncate">{entry.notes}</p>}
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-sm text-text-2">
                  <Phone className="h-3.5 w-3.5 text-text-3" />{entry.phone}
                </div>
                <div className="hidden md:flex items-center justify-center gap-1 text-sm text-text">
                  <Users className="h-3.5 w-3.5 text-text-3" />{formatNumber(entry.partySize)}
                </div>
                <div className="hidden md:flex items-center gap-2">
                  {entry.status === "waiting" ? (
                    <>
                      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden max-w-[100px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(formatWaitMinutes(entry.createdAt) * 2, 100)}%`,
                            backgroundColor: formatWaitMinutes(entry.createdAt) > 30 ? "var(--kfm-danger)" : "var(--kfm-warning)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-text-2 whitespace-nowrap">{formatWaitTime(entry.createdAt)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-text-3">\u2014</span>
                  )}
                </div>
                <div className="hidden md:block">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold inline-block", STATUS_CONFIG[entry.status].color)}>
                    {STATUS_CONFIG[entry.status].label}
                  </span>
                </div>
                <div className="hidden md:flex justify-end gap-2">
                  {entry.status === "waiting" && (
                    <>
                      <button onClick={() => setSeatTarget(entry)} className="rounded-kfm-sm border border-kfm-success/30 bg-kfm-success/10 px-3 py-1.5 text-xs font-medium text-kfm-success hover:bg-kfm-success/20">Installer</button>
                      <button onClick={() => setCancelTarget(entry)} className="rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/10 px-3 py-1.5 text-xs font-medium text-kfm-danger hover:bg-kfm-danger/20">Annuler</button>
                    </>
                  )}
                </div>
                {/* Mobile layout */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text">{entry.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-text-2">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{entry.phone}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{entry.partySize}</span>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_CONFIG[entry.status].color)}>{STATUS_CONFIG[entry.status].label}</span>
                  </div>
                  {entry.status === "waiting" && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-2">{formatWaitTime(entry.createdAt)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setSeatTarget(entry)} className="flex-1 rounded-kfm-sm border border-kfm-success/30 bg-kfm-success/10 py-1.5 text-xs font-medium text-kfm-success text-center">Installer</button>
                        <button onClick={() => setCancelTarget(entry)} className="flex-1 rounded-kfm-sm border border-kfm-danger/30 bg-kfm-danger/10 py-1.5 text-xs font-medium text-kfm-danger text-center">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Ajouter a la liste d&apos;attente</DialogTitle>
            <DialogDescription className="text-text-2">Enregistrez un nouveau client en attente</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Nom du client *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none" placeholder="Nom complet" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Telephone *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none" placeholder="620 000 000" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Personnes</label>
                <input type="number" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none" min="1" max="20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none resize-none" placeholder="Preferences, allergenes..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleAdd} disabled={!form.name || !form.phone} className="rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">Ajouter</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seat Confirmation */}
      <AlertDialog open={!!seatTarget} onOpenChange={() => setSeatTarget(null)}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Installer {seatTarget?.name} ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Ce client sera marque comme installe et retire de la file d&apos;attente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-kfm-sm border border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={seatGuest} className="rounded-kfm-sm bg-kfm-success text-white hover:opacity-90">Installer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Annuler l&apos;attente de {cancelTarget?.name} ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              Ce client sera retire de la file d&apos;attente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-kfm-sm border border-kfm-border text-text-2 hover:bg-surface-2">Conserver</AlertDialogCancel>
            <AlertDialogAction onClick={cancelGuest} className="rounded-kfm-sm bg-kfm-danger text-white hover:opacity-90">Annuler</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
