"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Crown, Plus, RefreshCcw, AlertCircle, Users, Check, Star, Zap,
  Trash2, Loader2,
} from "lucide-react";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { SkeletonStatCard, SkeletonTable } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { StatCard } from "@/components/kfm-ui/stat-card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
}

interface Subscriber {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["1 restaurant", "50 commandes/mois", "Support email"],
    isActive: true,
    isDefault: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49900,
    features: [
      "5 restaurants",
      "Commandes illimitees",
      "Support prioritaire",
      "Livraisons",
      "Rapports avances",
    ],
    isActive: true,
    isDefault: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 149900,
    features: [
      "Restaurants illimites",
      "Toutes les fonctionnalites",
      "Support dedie 24/7",
      "API access",
      "Personnalisation",
    ],
    isActive: true,
    isDefault: false,
  },
];

const PLAN_COLORS: Record<string, string> = {
  free: "bg-kfm-text-3",
  pro: "bg-kfm-secondary",
  enterprise: "bg-purple-600",
  custom: "bg-kfm-accent",
};

const STORAGE_KEY = "kfm_subscription_plans";

// ── Component ──────────────────────────────────────────────────────────────

export function AdminSubscriptionsView() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create plan dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", price: "", features: "" });
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});

  // ── Load plans from localStorage ─────────────────────────────────────────
  const loadPlans = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlans(JSON.parse(stored));
      } else {
        setPlans(DEFAULT_PLANS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLANS));
      }
    } catch {
      setPlans(DEFAULT_PLANS);
    }
  }, []);

  // ── Fetch subscribers ────────────────────────────────────────────────────
  const fetchSubscribers = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=ADMIN&limit=500", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const admins = (json.data.users || []).filter(
          (u: Subscriber) => ["ADMIN", "SUPER_ADMIN"].includes(u.role?.toUpperCase())
        );
        setSubscribers(admins);
      }
    } catch {
      setError("Erreur de chargement des abonnes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    fetchSubscribers();
  }, [loadPlans, fetchSubscribers]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSubscribers = subscribers.length;
    const monthlyRevenue = plans.reduce(
      (sum, p) => sum + (p.price > 0 ? p.price * Math.ceil(totalSubscribers / plans.length) : 0),
      0
    );
    const activePlans = plans.filter((p) => p.isActive).length;
    return { totalSubscribers, monthlyRevenue, activePlans };
  }, [plans, subscribers]);

  // ── Create plan ──────────────────────────────────────────────────────────
  const handleCreatePlan = () => {
    const errors: Record<string, string> = {};
    if (!newPlan.name.trim()) errors.name = "Requis";
    if (!newPlan.price || isNaN(Number(newPlan.price)) || Number(newPlan.price) < 0) errors.price = "Prix invalide";
    if (Object.keys(errors).length > 0) { setPlanErrors(errors); return; }

    const plan: SubscriptionPlan = {
      id: `custom-${Date.now()}`,
      name: newPlan.name,
      price: parseInt(newPlan.price),
      features: newPlan.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      isActive: true,
      isDefault: false,
    };
    const updated = [...plans, plan];
    setPlans(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCreateOpen(false);
    setNewPlan({ name: "", price: "", features: "" });
    setPlanErrors({});
  };

  // ── Delete plan ──────────────────────────────────────────────────────────
  const handleDeletePlan = (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Abonnements</h2>
          <p className="mt-1 text-sm text-text-2">Gestion des forfaits</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="kfm-skeleton h-72 rounded-kfm-md" />
          <div className="kfm-skeleton h-72 rounded-kfm-md" />
          <div className="kfm-skeleton h-72 rounded-kfm-md" />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Abonnements</h2>
          <p className="mt-1 text-sm text-text-2">
            {plans.length} forfaits disponibles
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Creer un forfait
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total abonnes" value={String(stats.totalSubscribers)} icon={Users} />
        <StatCard label="Revenu mensuel estime" value={formatCurrency(stats.monthlyRevenue)} icon={Crown} className="border-l-4 border-l-kfm-success" />
        <StatCard label="Plans actifs" value={String(stats.activePlans)} icon={Star} className="border-l-4 border-l-kfm-secondary" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm border border-kfm-warning/30 bg-kfm-warning/5 px-4 py-2 text-sm text-kfm-warning">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Plan comparison cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "rounded-kfm-md border bg-surface shadow-sm overflow-hidden transition-all",
              plan.isActive ? "border-kfm-secondary/30" : "border-kfm-border opacity-50"
            )}
          >
            {/* Color strip */}
            <div className={cn("h-2", PLAN_COLORS[plan.isDefault ? plan.id : "custom"] || PLAN_COLORS.custom)} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-text">{plan.name}</h3>
                {plan.id === "pro" && <Star className="h-4 w-4 text-yellow-500" />}
              </div>
              <p className="text-2xl font-bold text-text mb-1">
                {plan.price === 0 ? "Gratuit" : formatCurrency(plan.price)}
              </p>
              {plan.price > 0 && <p className="text-xs text-text-3 mb-4">par mois</p>}

              {/* Feature list */}
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-2">
                    <Check className="h-3.5 w-3.5 text-kfm-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-kfm-border pt-3">
                <span className="text-xs text-text-3 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {stats.totalSubscribers} abonnes
                </span>
                {!plan.isDefault && (
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-xs text-kfm-danger hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscriber list */}
      <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-kfm-border">
          <h3 className="text-sm font-semibold text-text">
            Abonnes ({subscribers.length})
          </h3>
        </div>
        {subscribers.length > 0 ? (
          <div className="divide-y divide-kfm-border max-h-96 overflow-y-auto">
            {subscribers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/40 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary">
                  {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-text-3 truncate">{user.email}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  user.isActive ? "bg-kfm-success/10 text-kfm-success" : "bg-kfm-danger/10 text-kfm-danger"
                )}>
                  {user.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Aucun abonne"
            description="Aucun administrateur n'est encore inscrit."
            className="border-0 py-8"
          />
        )}
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface border-kfm-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text">Creer un forfait</DialogTitle>
            <DialogDescription className="text-text-2">Definissez un nouveau plan d&apos;abonnement</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Nom du forfait *</label>
              <input
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: Premium"
              />
              {planErrors.name && <p className="mt-1 text-xs text-kfm-danger">{planErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Prix mensuel (FG) *</label>
              <input
                type="number"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none"
                placeholder="Ex: 29900"
                min="0"
              />
              {planErrors.price && <p className="mt-1 text-xs text-kfm-danger">{planErrors.price}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 mb-1 block">Fonctionnalites (separees par virgule)</label>
              <textarea
                value={newPlan.features}
                onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                rows={4}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text placeholder-text-3 focus:border-kfm-secondary focus:outline-none resize-none"
                placeholder="Fonctionnalite 1, Fonctionnalite 2, ..."
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setCreateOpen(false); setPlanErrors({}); }} className="rounded-kfm-sm border border-kfm-border px-4 py-2 text-sm font-medium text-text-2 hover:bg-surface-2">
              Annuler
            </button>
            <button
              onClick={handleCreatePlan}
              disabled={!newPlan.name.trim() || !newPlan.price}
              className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {false && <Loader2 className="h-4 w-4 animate-spin" />} Creer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
