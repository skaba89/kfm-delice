"use client";

import { useState, useMemo } from "react";
import {
  Gift, Plus, Search, Copy, CreditCard,
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

type GiftCardStatus = "active" | "redeemed" | "expired";

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  initialAmount: number;
  status: GiftCardStatus;
  purchaser: string;
  recipient: string;
  message: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<GiftCardStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-kfm-success/10 text-kfm-success border border-kfm-success/20" },
  redeemed: { label: "Utilisee", color: "bg-kfm-info/10 text-kfm-info border border-kfm-info/20" },
  expired: { label: "Expiree", color: "bg-gray-500/10 text-gray-500 border border-gray-500/20" },
};

const FILTER_TABS: { key: "all" | GiftCardStatus; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actives" },
  { key: "redeemed", label: "Utilisees" },
  { key: "expired", label: "Expirees" },
];

const STORAGE_KEY = "kfm_gift_cards";

function generateCode(): string {
  const hex4 = () => Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
  return `KFM-${hex4()}-${hex4()}-${hex4()}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminGiftCardsView() {
  const [cards, setCards] = useState<GiftCard[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GiftCardStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<GiftCard | null>(null);
  const [form, setForm] = useState({ amount: "", purchaser: "", recipient: "", message: "" });

  const saveCards = (updated: GiftCard[]) => {
    setCards(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch = !search
        || c.code.toLowerCase().includes(search.toLowerCase())
        || c.purchaser.toLowerCase().includes(search.toLowerCase())
        || c.recipient.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cards, search, statusFilter]);

  const stats = useMemo(() => {
    const activeValue = cards.filter((c) => c.status === "active").reduce((s, c) => s + c.amount, 0);
    const redeemedValue = cards.filter((c) => c.status === "redeemed").reduce((s, c) => s + c.initialAmount, 0);
    return { total: cards.length, activeValue, redeemedValue };
  }, [cards]);

  const handleCreate = () => {
    if (!form.amount || !form.purchaser || !form.recipient) return;
    const card: GiftCard = {
      id: `gc-${Date.now()}`,
      code: generateCode(),
      amount: parseFloat(form.amount),
      initialAmount: parseFloat(form.amount),
      status: "active",
      purchaser: form.purchaser,
      recipient: form.recipient,
      message: form.message,
      createdAt: new Date().toISOString(),
    };
    saveCards([card, ...cards]);
    setCreateOpen(false);
    setForm({ amount: "", purchaser: "", recipient: "", message: "" });
  };

  const redeemCard = () => {
    if (!redeemTarget) return;
    saveCards(cards.map((c) => c.id === redeemTarget.id ? { ...c, status: "redeemed" as GiftCardStatus, amount: 0 } : c));
    setRedeemTarget(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Cartes cadeaux</h2>
          <p className="mt-1 text-sm text-text-2">{formatNumber(stats.total)} carte{stats.total !== 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => { setForm({ amount: "", purchaser: "", recipient: "", message: "" }); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Creer une carte
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total cartes" value={formatNumber(stats.total)} icon={Gift} />
        <StatCard label="Valeur active" value={formatCurrency(stats.activeValue)} icon={CreditCard} className="border-l-4 border-l-kfm-success" />
        <StatCard label="Valeur utilisee" value={formatCurrency(stats.redeemedValue)} icon={CreditCard} className="border-l-4 border-l-kfm-info" />
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
            placeholder="Rechercher par code, nom..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                statusFilter === tab.key
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
      {filteredCards.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Aucune carte cadeau"
          description={search || statusFilter !== "all" ? "Aucune carte ne correspond a vos criteres." : "Creez votre premiere carte cadeau."}
          action={
            !search && statusFilter === "all"
              ? <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"><Plus className="h-4 w-4" /> Creer</button>
              : <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Reinitialiser</button>
          }
        />
      ) : (
        <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.6fr_0.8fr_0.8fr_0.5fr_0.4fr] gap-2 border-b border-kfm-border bg-surface-2/60 px-5 py-3">
            <span className="text-xs font-semibold text-text-3 uppercase">Code</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-right">Montant</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Statut</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Acheteur</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Beneficiaire</span>
            <span className="text-xs font-semibold text-text-3 uppercase">Date creation</span>
            <span className="text-xs font-semibold text-text-3 uppercase text-right">Actions</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredCards.map((card) => (
              <div key={card.id} className="md:grid md:grid-cols-[1.2fr_0.6fr_0.6fr_0.8fr_0.8fr_0.5fr_0.4fr] gap-2 items-center border-b border-kfm-border px-5 py-3 hover:bg-surface-2/40 last:border-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-semibold text-kfm-secondary">{card.code}</code>
                  <button onClick={() => copyCode(card.code)} className="text-text-3 hover:text-text"><Copy className="h-3.5 w-3.5" /></button>
                </div>
                <span className="text-sm font-semibold text-text text-right hidden md:block">{formatCurrency(card.amount)}</span>
                <div className="hidden md:block">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold inline-block", STATUS_CONFIG[card.status].color)}>{STATUS_CONFIG[card.status].label}</span>
                </div>
                <span className="text-sm text-text truncate hidden md:block">{card.purchaser}</span>
                <span className="text-sm text-text truncate hidden md:block">{card.recipient}</span>
                <span className="text-xs text-text-3 hidden md:block">{formatDate(card.createdAt)}</span>
                <div className="hidden md:flex justify-end">
                  {card.status === "active" && (
                    <button onClick={() => setRedeemTarget(card)} className="text-xs text-kfm-info hover:underline font-medium">Utiliser</button>
                  )}
                </div>
                {/* Mobile layout */}
                <div className="md:hidden flex items-start justify-between">
                  <div>
                    <code className="text-sm font-mono font-bold text-kfm-secondary">{card.code}</code>
                    <p className="text-lg font-bold text-text mt-1">{formatCurrency(card.amount)}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", STATUS_CONFIG[card.status].color)}>{STATUS_CONFIG[card.status].label}</span>
                </div>
                <div className="md:hidden space-y-1 text-xs text-text-2 mt-2">
                  <p>Acheteur : {card.purchaser}</p>
                  <p>Beneficiaire : {card.recipient}</p>
                  <p className="text-text-3">Creee le {formatDate(card.createdAt)}</p>
                </div>
                {card.status === "active" && (
                  <button onClick={() => setRedeemTarget(card)} className="md:hidden mt-2 text-xs text-kfm-info hover:underline font-medium">Marquer comme utilisee</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Creer une carte cadeau</DialogTitle>
            <DialogDescription className="text-text-2">Un code unique sera genere automatiquement</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Montant (FG) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                placeholder="5000"
                min="1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Nom de l&apos;acheteur *</label>
              <input
                value={form.purchaser}
                onChange={(e) => setForm({ ...form, purchaser: e.target.value })}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                placeholder="Nom de l&apos;acheteur"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Nom du beneficiaire *</label>
              <input
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                placeholder="Nom du beneficiaire"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Message (optionnel)</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={2}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none resize-none"
                placeholder="Joyeux anniversaire..."
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">Annuler</button>
            <button
              onClick={handleCreate}
              disabled={!form.amount || !form.purchaser || !form.recipient}
              className="rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              Creer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Confirmation */}
      <AlertDialog open={!!redeemTarget} onOpenChange={() => setRedeemTarget(null)}>
        <AlertDialogContent className="bg-surface border-kfm-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text">Utiliser cette carte cadeau ?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-2">
              La carte <span className="font-mono font-semibold">{redeemTarget?.code}</span> d&apos;une valeur de {redeemTarget ? formatCurrency(redeemTarget.amount) : ""} sera marquee comme utilisee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-kfm-sm border border-kfm-border text-text-2 hover:bg-surface-2">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={redeemCard} className="rounded-kfm-sm bg-kfm-info text-white hover:opacity-90">Utiliser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
