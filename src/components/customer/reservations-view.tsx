"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Users,
  Clock,
  X,
  Loader2,
  PartyPopper,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/kfm-ui/status-badge";
import { EmptyState } from "@/components/kfm-ui/empty-state";
import { authHeaders } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ──────────────── Types ──────────────── */
interface ReservationData {
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
  confirmedAt: string | null;
  seatedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

/* ──────────────── Status helpers ──────────────── */
const reservationStatusMap: Record<string, string> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SEATED: "preparing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "cancelled",
};

const occasionLabels: Record<string, string> = {
  birthday: "Anniversaire",
  anniversary: "Anniversaire de mariage",
  business: "Repas d'affaires",
  date: "Rendez-vous",
  other: "Autre",
};

/* ──────────────── Component ──────────────── */
export function ReservationsView() {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formPartySize, setFormPartySize] = useState("2");
  const [formOccasion, setFormOccasion] = useState("");
  const [formRequests, setFormRequests] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/reservations", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setReservations(data.data || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!formName || !formPhone || !formDate || !formTime) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/customer/reservations", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          guestName: formName,
          guestPhone: formPhone,
          guestEmail: formEmail || undefined,
          partySize: parseInt(formPartySize, 10),
          date: formDate,
          time: formTime,
          occasion: formOccasion || undefined,
          specialRequests: formRequests || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        resetForm();
        await loadReservations();
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/customer/reservations/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reservation annulee avec succes");
        await loadReservations();
      } else {
        toast.error(data.error || "Impossible d'annuler cette reservation");
      }
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setCancellingId(null);
    }
  };

  const resetForm = () => {
    setFormDate("");
    setFormTime("");
    setFormPartySize("2");
    setFormOccasion("");
    setFormRequests("");
    setFormName("");
    setFormPhone("");
    setFormEmail("");
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">Mes reservations</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white">
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-text">Nouvelle reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Nom complet *</Label>
                  <Input
                    placeholder="Votre nom"
                    className="border-kfm-border"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Telephone *</Label>
                  <Input
                    placeholder="+224 6XX XX XX XX"
                    className="border-kfm-border"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-2">Email (optionnel)</Label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  className="border-kfm-border"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Date *</Label>
                  <Input
                    type="date"
                    min={today}
                    className="border-kfm-border"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Heure *</Label>
                  <Input
                    type="time"
                    className="border-kfm-border"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Nombre de convives</Label>
                  <Select value={formPartySize} onValueChange={setFormPartySize}>
                    <SelectTrigger className="border-kfm-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} {i === 0 ? "personne" : "personnes"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Occasion (optionnel)</Label>
                  <Select value={formOccasion} onValueChange={setFormOccasion}>
                    <SelectTrigger className="border-kfm-border">
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Anniversaire</SelectItem>
                      <SelectItem value="anniversary">Anniversaire de mariage</SelectItem>
                      <SelectItem value="business">Repas d'affaires</SelectItem>
                      <SelectItem value="date">Rendez-vous</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-2">Demandes speciales (optionnel)</Label>
                <Textarea
                  placeholder="Allergies, preferences de table, decoration..."
                  className="border-kfm-border resize-none"
                  rows={3}
                  value={formRequests}
                  onChange={(e) => setFormRequests(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
                onClick={handleSubmit}
                disabled={submitting || !formName || !formPhone || !formDate || !formTime}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reservation en cours...
                  </>
                ) : (
                  "Confirmer la reservation"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-kfm-border">
              <CardContent className="p-4">
                <div className="kfm-skeleton h-5 w-3/4" />
                <div className="kfm-skeleton mt-2 h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucune reservation"
          description="Reservez une table pour votre prochain repas au restaurant."
          action={
            <Button
              size="sm"
              className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Reservez maintenant
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => {
            const reservationDate = new Date(res.date);
            const isUpcoming = reservationDate >= new Date() && res.status !== "CANCELLED";

            return (
              <Card
                key={res.id}
                className={cn(
                  "border-kfm-border bg-surface transition-shadow hover:shadow-md",
                  isUpcoming && "ring-1 ring-kfm-secondary/20"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">
                          {formatDate(res.date)} a {res.time}
                        </h3>
                        <StatusBadge type="order" status={reservationStatusMap[res.status] || "pending"} />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {res.partySize} personne{res.partySize > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {res.duration} min
                        </span>
                        {res.occasion && (
                          <span className="flex items-center gap-1 text-kfm-accent">
                            <PartyPopper className="h-3 w-3" />
                            {occasionLabels[res.occasion] || res.occasion}
                          </span>
                        )}
                      </div>

                      {res.specialRequests && (
                        <p className="mt-1.5 text-xs text-text-3 truncate">
                          {res.specialRequests}
                        </p>
                      )}
                    </div>

                    {/* Cancel button for PENDING or CONFIRMED */}
                    {(res.status === "PENDING" || res.status === "CONFIRMED") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-3 flex-shrink-0 bg-kfm-danger/10 text-kfm-danger border border-kfm-danger/20 hover:bg-kfm-danger/20 h-8 px-2.5 text-xs"
                        disabled={cancellingId === res.id}
                        onClick={() => handleCancelReservation(res.id)}
                      >
                        {cancellingId === res.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                        )}
                        Annuler
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
