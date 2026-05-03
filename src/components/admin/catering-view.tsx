"use client";

import { useState, useMemo } from "react";
import {
  Briefcase, Plus, Search, Calendar, Users,
  DollarSign, Clock, Eye, MoreVertical, Filter,
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────

type CateringEventType = "mariage" | "anniversaire" | "entreprise" | "soiree" | "autre";
type CateringStatus = "en_attente" | "confirme" | "en_preparation" | "livre" | "annule";

interface CateringOrder {
  id: string;
  client: string;
  eventType: CateringEventType;
  date: string;
  guestCount: number;
  menu: string;
  status: CateringStatus;
  total: number;
  notes: string;
  createdAt: string;
}

const EVENT_TYPE_LABELS: Record<CateringEventType, string> = {
  mariage: "Mariage",
  anniversaire: "Anniversaire",
  entreprise: "Entreprise",
  soiree: "Soiree",
  autre: "Autre",
};

const EVENT_TYPES: CateringEventType[] = ["mariage", "anniversaire", "entreprise", "soiree", "autre"];

const STATUS_LABELS: Record<CateringStatus, string> = {
  en_attente: "En attente",
  confirme: "Confirme",
  en_preparation: "En preparation",
  livre: "Livre",
  annule: "Annule",
};

const STATUS_COLORS: Record<CateringStatus, string> = {
  en_attente: "bg-kfm-warning/10 text-kfm-warning border border-kfm-warning/20",
  confirme: "bg-kfm-info/10 text-kfm-info border border-kfm-info/20",
  en_preparation: "bg-kfm-secondary/10 text-kfm-secondary border border-kfm-secondary/20",
  livre: "bg-kfm-success/10 text-kfm-success border border-kfm-success/20",
  annule: "bg-kfm-danger/10 text-kfm-danger border border-kfm-danger/20",
};

const EVENT_TYPE_COLORS: Record<CateringEventType, string> = {
  mariage: "bg-pink-500/10 text-pink-600 border border-pink-500/20",
  anniversaire: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
  entreprise: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  soiree: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
  autre: "bg-gray-500/10 text-gray-600 border border-gray-500/20",
};

const STORAGE_KEY = "kfm_catering";

// ── Component ──────────────────────────────────────────────────────────────

export function AdminCateringView() {
  const [orders, setOrders] = useState<CateringOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CateringStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CateringOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CateringOrder | null>(null);
  const [form, setForm] = useState({ client: "", eventType: "autre" as CateringEventType, date: "", guestCount: "", menu: "", total: "", notes: "" });

  const saveOrders = (updated: CateringOrder[]) => {
    setOrders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search || o.client.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchDateFrom = !dateFrom || o.date >= dateFrom;
      const matchDateTo = !dateTo || o.date <= dateTo;
      return matchSearch && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const enCours = orders.filter((o) => ["en_attente", "confirme", "en_preparation"].includes(o.status)).length;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const revenueMonth = orders.filter((o) => {
      const d = new Date(o.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && o.status === "livre";
    }).reduce((s, o) => s + o.total, 0);
    return { total: orders.length, enCours, revenueMonth };
  }, [orders]);

  const handleCreate = () => {
    if (!form.client || !form.date || !form.guestCount) return;
    const order: CateringOrder = {
      id: `cat-${Date.now()}`,
      client: form.client,
      eventType: form.eventType,
      date: form.date,
      guestCount: parseInt(form.guestCount),
      menu: form.menu,
      status: "en_attente",
      total: form.total ? parseInt(form.total) : 0,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    saveOrders([order, ...orders]);
    setCreateOpen(false);
    setForm({ client: "", eventType: "autre", date: "", guestCount: "", menu: "", total: "", notes: "" });
  };

  const updateStatus = (id: string, status: CateringStatus) => {
    saveOrders(orders.map((o) => o.id === id ? { ...o, status } : o));
  };

  const cancelOrder = () => {
    if (!cancelTarget) return;
    updateStatus(cancelTarget.id, "annule");
    setCancelTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Traiteur</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des services de traiteur</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Nouvelle commande
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total commandes" value={formatNumber(stats.total)} icon={Briefcase} />
        <StatCard label="En cours" value={formatNumber(stats.enCours)} icon={Clock} className="border-l-4 border-l-kfm-warning" />
        <StatCard label="CA du mois" value={formatCurrency(stats.revenueMonth)} icon={DollarSign} className="border-l-4 border-l-kfm-success" />
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
            placeholder="Rechercher par client..."
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Filter className="h-4 w-4 text-text-3" />
          <button onClick={() => setStatusFilter("all")} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", statusFilter === "all" ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2")}>Tous</button>
          {(Object.keys(STATUS_LABELS) as CateringStatus[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", statusFilter === s ? "border-kfm-secondary/30 bg-kfm-secondary/10 text-kfm-secondary" : "border-kfm-border bg-surface text-text-2 hover:bg-surface-2")}>{STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="h-4 w-4 text-text-3" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
        <span className="text-xs text-text-3">au</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-kfm-sm border border-kfm-border bg-surface px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-kfm-secondary hover:underline">Reinitialiser</button>
        )}
      </div>

      {/* List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucune commande traiteur"
          description={search || statusFilter !== "all" || dateFrom || dateTo ? "Aucune commande ne correspond a vos criteres." : "Creez votre premiere commande de traiteur."}
          action={
            !search && statusFilter === "all" && !dateFrom && !dateTo
              ? <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><Plus className="h-4 w-4" /> Creer</button>
              : <button onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Reinitialiser</button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kfm-secondary/10 text-sm font-bold text-kfm-secondary">{order.client.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-semibold text-text">{order.client}</p>
                    <p className="text-xs text-text-3">{EVENT_TYPE_LABELS[order.eventType]} &middot; {formatDate(order.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold hidden sm:inline-block", EVENT_TYPE_COLORS[order.eventType])}>{EVENT_TYPE_LABELS[order.eventType]}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", STATUS_COLORS[order.status])}>{STATUS_LABELS[order.status]}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="rounded-lg p-1.5 text-text-3 hover:bg-surface-2"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-surface border-kfm-border">
                      <DropdownMenuItem onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}><Eye className="h-4 w-4 mr-2" /> Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {(Object.keys(STATUS_LABELS) as CateringStatus[]).filter((s) => s !== order.status && s !== "annule").map((s) => (
                        <DropdownMenuItem key={s} onClick={() => updateStatus(order.id, s)}>{STATUS_LABELS[s]}</DropdownMenuItem>
                      ))}
                      {order.status !== "annule" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-kfm-danger" onClick={() => setCancelTarget(order)}>Annuler</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-text-2"><Users className="h-3.5 w-3.5 text-text-3" />{formatNumber(order.guestCount)} invites</div>
                <div className="flex items-center gap-1.5 text-text-2"><Calendar className="h-3.5 w-3.5 text-text-3" />{formatDate(order.date)}</div>
                <div className="flex items-center gap-1.5 text-text-2 truncate"><Briefcase className="h-3.5 w-3.5 text-text-3" />{order.menu || "\u2014"}</div>
                <div className="text-sm font-bold text-kfm-secondary text-right">{order.total > 0 ? formatCurrency(order.total) : "\u2014"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-text">Commande traiteur - {selectedOrder.client}</DialogTitle>
                <DialogDescription className="text-text-2">{EVENT_TYPE_LABELS[selectedOrder.eventType]} &middot; {formatDate(selectedOrder.date)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-kfm-sm border border-kfm-border bg-bg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-text-3">Client</span><span className="text-text">{selectedOrder.client}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Evenement</span><span className="text-text">{EVENT_TYPE_LABELS[selectedOrder.eventType]}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Date</span><span className="text-text">{formatDate(selectedOrder.date)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Invites</span><span className="text-text">{formatNumber(selectedOrder.guestCount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Menu</span><span className="text-text">{selectedOrder.menu || "\u2014"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Total</span><span className="text-kfm-secondary font-bold">{selectedOrder.total > 0 ? formatCurrency(selectedOrder.total) : "\u2014"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Statut</span><span className={cn("font-medium rounded-full px-2 py-0.5", STATUS_COLORS[selectedOrder.status])}>{STATUS_LABELS[selectedOrder.status]}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-3">Creee le</span><span className="text-text">{formatDate(selectedOrder.createdAt)}</span></div>
                  {selectedOrder.notes && <div className="pt-2 border-t border-kfm-border text-sm"><span className="text-text-3">Notes : </span><span className="text-text">{selectedOrder.notes}</span></div>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text">Nouvelle commande traiteur</DialogTitle>
            <DialogDescription className="text-text-2">Creez une commande de service traiteur</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Client *</label>
              <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" placeholder="Nom du client" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Type d&apos;evenement</label>
                <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as CateringEventType })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none">
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Nb invites *</label>
                <input type="number" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" placeholder="50" min="1" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1 block">Total (FG)</label>
                <input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Menu</label>
              <textarea value={form.menu} onChange={(e) => setForm({ ...form, menu: e.target.value })} rows={2} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none resize-none" placeholder="Description du menu..." />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none resize-none" placeholder="Notes supplementaires..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button onClick={handleCreate} disabled={!form.client || !form.date || !form.guestCount} className="rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">Creer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Annuler cette commande ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              La commande de traiteur pour {cancelTarget?.client} sera annulee. Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-kfm-sm border border-kfm-border text-text-2 hover:bg-surface-2">Conserver</AlertDialogCancel>
            <AlertDialogAction onClick={cancelOrder} className="rounded-kfm-sm bg-kfm-danger text-white hover:opacity-90">Annuler la commande</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
