"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Star,
  Crown,
  Gift,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { authHeaders } from "@/lib/constants";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

/* ──────────────── Types ──────────────── */
interface ProfileData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  loyaltyPoints: number;
  loyaltyLevel: number;
  isVip: boolean;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
}

/* ──────────────── Loyalty levels ──────────────── */
const loyaltyLevels = [
  {
    level: 1,
    name: "Bronze",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
    iconBg: "bg-amber-500/10",
    minPoints: 0,
    maxPoints: 500,
    benefits: ["1 point pour chaque 100 FG depenses", "Offre d'anniversaire", "Acces aux promotions"],
  },
  {
    level: 2,
    name: "Argent",
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    iconBg: "bg-gray-400/10",
    minPoints: 500,
    maxPoints: 2000,
    benefits: ["1.5 point pour chaque 100 FG", "Reduction de 5% sur les commandes", "Livraison gratuite une fois par mois", "Menu secret exclusif"],
  },
  {
    level: 3,
    name: "Or",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    iconBg: "bg-yellow-500/10",
    minPoints: 2000,
    maxPoints: 5000,
    benefits: ["2 points pour chaque 100 FG", "Reduction de 10% sur les commandes", "Livraison gratuite illimitee", "Acces prioritaire aux evenements", "Surprise trimestrielle"],
  },
  {
    level: 4,
    name: "Platine",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    iconBg: "bg-cyan-500/10",
    minPoints: 5000,
    maxPoints: 10000,
    benefits: ["3 points pour chaque 100 FG", "Reduction de 15% sur les commandes", "Livraison gratuite illimitee", "Invite aux degustations privees", "Conseiller personnel dedie", "Cadeaux exclusifs"],
  },
  {
    level: 5,
    name: "Diamant",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    iconBg: "bg-purple-500/10",
    minPoints: 10000,
    maxPoints: Infinity,
    benefits: ["5 points pour chaque 100 FG", "Reduction de 20% sur les commandes", "Livraison express gratuite", "Acces VIP a tous les evenements", "Menu chef personnalise", "Priorite absolue", "Cadeaux premium mensuels"],
  },
];

/* ──────────────── Component ──────────────── */
export function LoyaltyView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/customer/profile", {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (data.success) setProfile(data.data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleRedeem = async () => {
    if (redeemPoints < 100) {
      toast.error("Minimum 100 points pour utiliser");
      return;
    }
    setRedeeming(true);
    try {
      localStorage.setItem('kfm_loyalty_discount', String(redeemPoints));
      toast.success(`${redeemPoints} points appliques ! Remise de ${formatCurrency(redeemPoints)} sur votre prochaine commande.`);
    } catch {
      toast.error("Erreur lors de l'application");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="kfm-skeleton h-48 w-full rounded-xl" />
        <div className="kfm-skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  const currentLevel = loyaltyLevels.find((l) => l.level === (profile?.loyaltyLevel || 1)) || loyaltyLevels[0];
  const nextLevel = loyaltyLevels.find((l) => l.level === (profile?.loyaltyLevel || 1) + 1);
  const points = profile?.loyaltyPoints || 0;
  const progressPercent = nextLevel
    ? Math.min(100, ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
    : 100;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-text">Programme de fidelite</h2>

      {/* Points display card */}
      <Card className={cn("border-0 overflow-hidden", currentLevel.bgColor)}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-2">Vos points de fidelite</p>
              <p className={cn("mt-2 text-4xl font-bold", currentLevel.color)}>
                {formatNumber(points)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={cn("border-0", currentLevel.iconBg, currentLevel.color)}>
                  <Star className="mr-1 h-3 w-3" />
                  {currentLevel.name}
                </Badge>
                {profile?.isVip && (
                  <Badge className="bg-kfm-accent/10 text-kfm-accent border-0">
                    <Crown className="mr-1 h-3 w-3" />
                    VIP
                  </Badge>
                )}
              </div>
            </div>
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", currentLevel.iconBg)}>
              <Award className={cn("h-7 w-7", currentLevel.color)} />
            </div>
          </div>

          {/* Progress to next level */}
          {nextLevel && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-2">{currentLevel.name}</span>
                <span className="text-text-2">
                  Encore {formatNumber(nextLevel.minPoints - points)} points pour {nextLevel.name}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Commandes totales"
          value={formatNumber(profile?.totalOrders || 0)}
          icon={TrendingUp}
        />
        <StatCard
          label="Total depense"
          value={`${formatNumber(Math.round(profile?.totalSpent || 0))} FG`}
          icon={Gift}
        />
      </div>

      {/* Use Points */}
      {profile && (
        <div className="rounded-kfm-md border border-kfm-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-3">Utiliser vos points</h3>
          <p className="text-xs text-text-3 mb-3">
            100 points = 100 FG de remise sur votre prochaine commande
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-text-2 mb-1 block">Points a utiliser</label>
              <input
                type="number"
                min={0}
                max={profile.loyaltyPoints || 0}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Math.min(Number(e.target.value), profile.loyaltyPoints || 0))}
                className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                placeholder="0"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-text-3">Remise</p>
              <p className="text-sm font-bold text-kfm-success">{formatCurrency(redeemPoints)}</p>
            </div>
          </div>
          <button
            onClick={handleRedeem}
            disabled={redeemPoints < 100 || redeeming}
            className="mt-3 w-full rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {redeeming ? "Application..." : "Appliquer la remise"}
          </button>
        </div>
      )}

      {/* Current level benefits */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-kfm-accent" />
            Avantages {currentLevel.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {currentLevel.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-kfm-success flex-shrink-0" />
                <span className="text-sm text-text-2">{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* All levels preview */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text">Tous les niveaux</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {loyaltyLevels.map((level) => {
              const isCurrent = level.level === currentLevel.level;
              const isLocked = points < level.minPoints && !isCurrent;
              return (
                <div
                  key={level.level}
                  className={cn(
                    "flex items-center gap-3 rounded-kfm-sm p-3 transition-colors",
                    isCurrent && "bg-kfm-secondary/5 ring-1 ring-kfm-secondary/20",
                    isLocked && "opacity-50"
                  )}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", level.iconBg)}>
                    <Star className={cn("h-5 w-5", level.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-semibold", level.color)}>
                        {level.name}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-kfm-secondary text-white text-[10px] px-1.5 py-0">
                          Actuel
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-3 mt-0.5">
                      {level.minPoints === 0
                        ? "Inscription"
                        : `${formatNumber(level.minPoints)}+ points`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text">Comment ca marche ?</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-text">Commandez</p>
              <p className="text-xs text-text-3">Passez vos commandes normalement.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-text">Gagnez des points</p>
              <p className="text-xs text-text-3">Recevez 1 point pour chaque 100 FG depenses.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kfm-secondary/10 text-xs font-bold text-kfm-secondary flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-text">Montez en grade</p>
              <p className="text-xs text-text-3">Debloquez de nouveaux avantages a chaque niveau.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kfm-success/10 text-xs font-bold text-kfm-success flex-shrink-0">
              4
            </div>
            <div>
              <p className="text-sm font-medium text-text">Profitez des avantages</p>
              <p className="text-xs text-text-3">Reductions, livraisons gratuites et surprises.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
