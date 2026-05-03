"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  UtensilsCrossed,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ──────────────── Component ──────────────── */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setSent(true);
        toast.success(data.data?.message || "Email envoye");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Back button */}
      <Link
        href="/customer/login"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-text-2 hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la connexion
      </Link>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kfm-secondary text-white mb-3">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-text">KFM Delice</h1>
        <p className="text-sm text-text-3 mt-1">
          {sent
            ? "Verification de votre email"
            : "Reinitialiser votre mot de passe"}
        </p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md border-kfm-border bg-surface">
        <CardContent className="p-6">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-kfm-success/10">
                <Check className="h-6 w-6 text-kfm-success" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text">
                  Email envoye !
                </h2>
                <p className="mt-2 text-sm text-text-3">
                  Si un compte existe avec l&apos;adresse{" "}
                  <span className="font-medium text-text-2">{email}</span>,
                  vous recevrez un lien de reinitialisation.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/customer/login">
                  <Button className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white h-11 font-semibold">
                    Retour a la connexion
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-kfm-sm bg-kfm-secondary/5 p-3 text-sm text-text-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-kfm-secondary" />
                <p>
                  Entrez l&apos;adresse email associee a votre compte. Nous vous
                  enverrons un lien pour reinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-sm font-medium text-text">
                    Adresse email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10 border-kfm-border"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white h-11 font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien"
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <p className="text-sm text-text-3">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <Link
                    href="/customer/login"
                    className="text-kfm-secondary font-semibold hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
