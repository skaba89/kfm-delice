"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  Loader2,
  Shield,
  Leaf,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/kfm-ui/stat-card";
import { getAuthHeaders } from "@/lib/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ──────────────── Types ──────────────── */
interface ProfileData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  dietaryPreferences: string[];
  allergies: string[];
  addresses: { label: string; address: string; city: string }[];
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
  loyaltyPoints: number;
  loyaltyLevel: number;
  isVip: boolean;
  createdAt: string;
}

/* ──────────────── Component ──────────────── */
export function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/customer/profile", {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setFirstName(data.data.firstName || "");
          setLastName(data.data.lastName || "");
          setPhone(data.data.phone || "");
          setEmail(data.data.email || "");
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email: email || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditing(false);
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setPhone(profile?.phone || "");
    setEmail(profile?.email || "");
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="kfm-skeleton h-24 w-full rounded-xl" />
        <div className="kfm-skeleton h-48 w-full rounded-xl" />
        <div className="kfm-skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-text-3 mx-auto" />
        <p className="mt-3 text-sm text-text-2">Profil introuvable</p>
      </div>
    );
  }

  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Client";

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-text">Mon profil</h2>

      {/* Profile header card */}
      <Card className="border-kfm-border bg-surface overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-kfm-secondary/10 text-xl font-bold text-kfm-secondary flex-shrink-0">
              {fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-text">{fullName}</h3>
                {profile.isVip && (
                  <Badge className="bg-kfm-accent/10 text-kfm-accent border-0">
                    <Shield className="mr-1 h-3 w-3" />
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-2 mt-0.5">{profile.phone}</p>
              {profile.email && (
                <p className="text-xs text-text-3 mt-0.5">{profile.email}</p>
              )}
              <p className="text-xs text-text-3 mt-1">
                Client depuis le {formatDate(profile.createdAt)}
              </p>
            </div>

            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="border-kfm-border flex-shrink-0"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Modifier
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Commandes"
          value={String(profile.totalOrders)}
          icon={Shield}
          className="!p-3"
        />
        <StatCard
          label="Total depense"
          value={formatCurrency(Math.round(profile.totalSpent))}
          icon={Shield}
          className="!p-3"
        />
        <StatCard
          label="Panier moyen"
          value={formatCurrency(Math.round(profile.avgOrderValue))}
          icon={Shield}
          className="!p-3"
        />
      </div>

      {/* Edit form */}
      {editing && (
        <Card className="border-kfm-secondary/30 bg-surface ring-1 ring-kfm-secondary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-text">Modifier mes informations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-text-2">Prenom</Label>
                <Input
                  placeholder="Prenom"
                  className="border-kfm-border"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-2">Nom</Label>
                <Input
                  placeholder="Nom"
                  className="border-kfm-border"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-2">Telephone</Label>
              <Input
                placeholder="+224 6XX XX XX XX"
                className="border-kfm-border"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-2">Email</Label>
              <Input
                type="email"
                placeholder="votre@email.com"
                className="border-kfm-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Enregistrer
              </Button>
              <Button size="sm" variant="outline" className="border-kfm-border" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dietary preferences */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text flex items-center gap-2">
            <Leaf className="h-4 w-4 text-kfm-success" />
            Preferences alimentaires
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.dietaryPreferences.map((pref, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-kfm-success/30 text-kfm-success bg-kfm-success/5"
                >
                  {pref}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-3">Aucune preference alimentaire definie.</p>
          )}
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-kfm-warning" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {profile.allergies && profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((allergy, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-kfm-danger/30 text-kfm-danger bg-kfm-danger/5"
                >
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-3">Aucune allergie signalee.</p>
          )}
        </CardContent>
      </Card>

      {/* Saved addresses */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text flex items-center gap-2">
            <MapPin className="h-4 w-4 text-kfm-danger" />
            Adresses enregistrees
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {profile.addresses && profile.addresses.length > 0 ? (
            <div className="space-y-2">
              {profile.addresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-kfm-sm border border-kfm-border p-3"
                >
                  <MapPin className="h-4 w-4 text-text-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text">
                      {addr.label || `Adresse ${idx + 1}`}
                    </p>
                    <p className="text-xs text-text-2 mt-0.5">{addr.address}</p>
                    <p className="text-xs text-text-3">{addr.city}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-3">Aucune adresse enregistree.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
