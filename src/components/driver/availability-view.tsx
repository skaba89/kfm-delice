"use client";

import { useEffect, useState } from "react";
import { Power, Wifi, WifiOff, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authHeaders } from "@/lib/constants";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { SkeletonStatCard } from "@/components/kfm-ui/skeletons";

/* ──────────────── Types ──────────────── */
interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  isAvailable: boolean;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  createdAt: string;
}

/* ──────────────── Component ──────────────── */
export function AvailabilityView() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/driver/profile", {
          headers: authHeaders(),
        });
        const result = await res.json();
        if (cancelled) return;
        if (result.success) setProfile(result.data);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const newAvailability = !profile.isAvailable;
      const res = await fetch("/api/driver/availability", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isAvailable: newAvailability }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  isAvailable: result.data.isAvailable,
                  status: result.data.status,
                }
              : prev
          );
        }
      }
    } catch {
      // Silently fail
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <Card className="border-kfm-border bg-surface">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="kfm-skeleton h-32 w-32 rounded-full" />
            <div className="kfm-skeleton mt-6 h-8 w-48" />
            <div className="kfm-skeleton mt-3 h-5 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  const isOnline = profile.isAvailable;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total livraisons"
          value={String(profile.totalDeliveries)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Note moyenne"
          value={`${profile.rating.toFixed(1)} / 5`}
          icon={Clock}
        />
        <StatCard
          label="Statut actuel"
          value={isOnline ? "En ligne" : "Hors ligne"}
          icon={isOnline ? Wifi : WifiOff}
        />
      </div>

      {/* Toggle card */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
          {/* Big status indicator */}
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full transition-colors duration-500 ${
              isOnline
                ? "bg-kfm-success/10 text-kfm-success"
                : "bg-kfm-text-3/10 text-kfm-text-3"
            }`}
          >
            {isOnline ? (
              <Wifi className="h-16 w-16" />
            ) : (
              <WifiOff className="h-16 w-16" />
            )}
          </div>

          {/* Status text */}
          <h2
            className={`mt-6 text-2xl font-bold ${
              isOnline ? "text-kfm-success" : "text-text-3"
            }`}
          >
            {isOnline ? "Vous etes en ligne" : "Vous etes hors ligne"}
          </h2>
          <p className="mt-2 text-sm text-text-2">
            {isOnline
              ? "Vous recevez des notifications de nouvelles livraisons."
              : "Activez votre disponibilite pour recevoir des commandes."}
          </p>

          {/* Toggle button */}
          <Button
            size="lg"
            className={`mt-8 min-w-[200px] text-base font-semibold transition-colors ${
              isOnline
                ? "bg-kfm-danger hover:bg-kfm-danger/90 text-white"
                : "bg-kfm-success hover:bg-kfm-success/90 text-white"
            }`}
            disabled={toggling}
            onClick={handleToggle}
          >
            {toggling ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Power className="mr-2 h-5 w-5" />
            )}
            {isOnline ? "Se mettre hors ligne" : "Se mettre en ligne"}
          </Button>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-text-3">
              Quand vous etes en ligne
            </h3>
            <ul className="space-y-2 text-sm text-text-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-kfm-success" />
                <span>Vous etes visible dans la liste des livreurs disponibles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-kfm-success" />
                <span>Vous recevez les nouvelles demandes de livraison</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-kfm-success" />
                <span>Votre statut passe automatiquement a &quot;occupe&quot; lors d&apos;une livraison</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-text-3">
              Quand vous etes hors ligne
            </h3>
            <ul className="space-y-2 text-sm text-text-2">
              <li className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-3" />
                <span>Vous n&apos;apparaissez pas dans les recherches de livreurs</span>
              </li>
              <li className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-3" />
                <span>Aucune nouvelle livraison ne vous est assignee</span>
              </li>
              <li className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-3" />
                <span>Vous ne pouvez pas vous deconnecter avec une livraison en cours</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
