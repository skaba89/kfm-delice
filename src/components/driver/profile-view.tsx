"use client";

import { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Truck,
  Star,
  MapPin,
  Calendar,
  Shield,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { authHeaders } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { SkeletonStatCard } from "@/components/kfm-ui/skeletons";
import { EmptyState } from "@/components/kfm-ui/empty-state";

/* ──────────────── Types ──────────────── */
interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  avatar: string | null;
  vehicleType: string;
  vehiclePlate: string | null;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  status: string;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
  } | null;
}

const vehicleLabels: Record<string, string> = {
  motorcycle: "Moto-taxi",
  bicycle: "Velo",
  car: "Voiture",
  scooter: "Scooter",
};

function StarRating({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-kfm-border"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-text">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ──────────────── Component ──────────────── */
export function ProfileView() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="kfm-skeleton h-64 w-full rounded-[var(--radius)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Profil introuvable"
        description="Impossible de charger votre profil. Reessayez plus tard."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-kfm-secondary/10 text-2xl font-bold text-kfm-secondary">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h2 className="text-xl font-bold text-text">
                  {profile.firstName} {profile.lastName}
                </h2>
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-kfm-success/20 bg-kfm-success/10 px-2.5 py-0.5 text-xs font-semibold text-kfm-success">
                    <Shield className="h-3 w-3" />
                    Verifie
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-3">
                Livreur depuis le {formatDate(profile.createdAt)}
              </p>
              <div className="mt-3">
                <StarRating rating={profile.rating} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Contact info */}
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-3">
              Informations de contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-text-3" />
                <span className="text-sm text-text">{profile.phone}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-3" />
                  <span className="text-sm text-text">{profile.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle info */}
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-3">
              Vehicule
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-text-3" />
                <span className="text-sm text-text">
                  {vehicleLabels[profile.vehicleType] || profile.vehicleType}
                </span>
              </div>
              {profile.vehiclePlate && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-text-3" />
                  <span className="text-sm text-text">{profile.vehiclePlate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-3">
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-text-3" />
                <span className="text-sm text-text">
                  {profile.totalDeliveries} livraisons effectuees
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-text-3" />
                <span className="text-sm text-text">
                  Note : {profile.rating.toFixed(1)} / 5
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant */}
        {profile.restaurant && (
          <Card className="border-kfm-border bg-surface">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-3">
                Restaurant assigne
              </h3>
              <div className="space-y-3">
                <p className="text-sm font-medium text-text">
                  {profile.restaurant.name}
                </p>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-text-3" />
                  <span className="text-sm text-text-2">
                    {profile.restaurant.address}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-3" />
                  <span className="text-sm text-text-2">
                    {profile.restaurant.phone}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-3">
            Statut du compte
          </h3>
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                profile.isActive
                  ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                  : "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
              }`}
            >
              {profile.isActive ? "Compte actif" : "Compte inactif"}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                profile.isAvailable
                  ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                  : "bg-kfm-text-3/10 text-kfm-text-3 border-kfm-text-3/20"
              }`}
            >
              {profile.isAvailable ? "En ligne" : "Hors ligne"}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                profile.isVerified
                  ? "bg-kfm-info/10 text-kfm-info border-kfm-info/20"
                  : "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20"
              }`}
            >
              {profile.isVerified ? "Profil verifie" : "Profil non verifie"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
