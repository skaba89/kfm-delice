"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  ChefHat,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authHeaders } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/kfm-ui/empty-state";

/* ──────────────── Types ──────────────── */
interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  KITCHEN: "Cuisinier",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  STAFF: "Personnel",
  DRIVER: "Livreur",
  CUSTOMER: "Client",
};

/* ──────────────── Component ──────────────── */
export function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth", {
          headers: authHeaders(),
        });
        const result = await res.json();
        if (result.success) {
          setProfile(result.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="kfm-skeleton h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="kfm-skeleton h-6 w-48" />
                <div className="kfm-skeleton h-4 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-kfm-border bg-surface">
              <CardContent className="p-4">
                <div className="kfm-skeleton h-4 w-24" />
                <div className="kfm-skeleton mt-2 h-5 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Impossible de charger le profil"
        description="Une erreur est survenue. Reessayez plus tard."
      />
    );
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—";
  const initials = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .map((n) => n?.[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "?";

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Profile header card */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kfm-accent text-xl font-bold text-white">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-text">{fullName}</h2>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-text-2 sm:justify-start">
                <ChefHat className="h-4 w-4 text-kfm-accent" />
                {roleLabels[profile.role] || profile.role}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                {profile.isActive ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-kfm-success/30 bg-kfm-success/10 text-kfm-success"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Compte actif
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-kfm-danger/30 bg-kfm-danger/10 text-kfm-danger"
                  >
                    <XCircle className="h-3 w-3" />
                    Compte desactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailCard
          icon={Mail}
          label="Adresse email"
          value={profile.email}
        />
        <DetailCard
          icon={User}
          label="Telephone"
          value={profile.phone || "Non renseigne"}
        />
        <DetailCard
          icon={Shield}
          label="Role"
          value={roleLabels[profile.role] || profile.role}
        />
        <DetailCard
          icon={Calendar}
          label="Date d'inscription"
          value={formatDate(profile.createdAt)}
        />
        <DetailCard
          icon={ChefHat}
          label="Derniere connexion"
          value={
            profile.lastLoginAt
              ? formatDateTime(profile.lastLoginAt)
              : "Premiere connexion"
          }
        />
      </div>
    </div>
  );
}

/* ──────────────── Detail Card ──────────────── */
function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-kfm-border bg-surface">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 rounded-kfm-sm bg-kfm-accent/10 p-2 text-kfm-accent">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-3">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-text truncate">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
