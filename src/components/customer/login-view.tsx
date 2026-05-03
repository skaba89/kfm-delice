"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  UtensilsCrossed,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

/* ──────────────── Component ──────────────── */
export function LoginView() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    const result = await login(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (result.success) {
      // Redirect based on user role
      const role = result.user?.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER" || role === "STAFF") {
        router.push("/admin/dashboard");
      } else if (role === "KITCHEN") {
        router.push("/kitchen/orders");
      } else if (role === "DRIVER") {
        router.push("/driver/dashboard");
      } else {
        router.push("/customer/menu");
      }
    } else {
      setError(result.error || "Erreur de connexion.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (regPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const result = await register({
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim() || undefined,
      password: regPassword,
    });
    setLoading(false);

    if (result.success) {
      setSuccess("Compte cree avec succes ! Redirection...");
      setTimeout(() => router.push("/customer/menu"), 1200);
    } else {
      setError(result.error || "Erreur lors de l'inscription.");
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Back button */}
      <button
        onClick={() => router.push("/customer/menu")}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-text-2 hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au menu
      </button>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kfm-secondary text-white mb-3">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-text">KFM Delice</h1>
        <p className="text-sm text-text-3 mt-1">
          {mode === "login" ? "Connectez-vous a votre compte" : "Creez votre compte"}
        </p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md border-kfm-border bg-surface">
        <CardContent className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-kfm-sm bg-kfm-danger/10 p-3 text-sm text-kfm-danger">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-kfm-sm bg-kfm-success/10 p-3 text-sm text-kfm-success">
              <Check className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm font-medium text-text">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10 border-kfm-border"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-sm font-medium text-text">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    className="pl-10 pr-10 border-kfm-border"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-text-3">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-kfm-secondary font-semibold hover:underline"
                  >
                    Creer un compte
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-firstname" className="text-sm font-medium text-text">
                    Prenom *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                    <Input
                      id="reg-firstname"
                      placeholder="Prenom"
                      className="pl-10 border-kfm-border"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-lastname" className="text-sm font-medium text-text">
                    Nom *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                    <Input
                      id="reg-lastname"
                      placeholder="Nom"
                      className="pl-10 border-kfm-border"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-sm font-medium text-text">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10 border-kfm-border"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone" className="text-sm font-medium text-text">
                  Telephone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+224 6XX XX XX XX"
                    className="pl-10 border-kfm-border"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm font-medium text-text">
                  Mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6 caracteres minimum"
                    className="pl-10 pr-10 border-kfm-border"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-sm font-medium text-text">
                  Confirmer le mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
                    className={cn(
                      "pl-10 border-kfm-border",
                      regConfirmPassword && regPassword !== regConfirmPassword
                        ? "border-kfm-danger"
                        : ""
                    )}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-xs text-kfm-danger">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white h-11 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creation en cours...
                  </>
                ) : (
                  "Creer mon compte"
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-text-3">
                  Deja un compte ?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-kfm-secondary font-semibold hover:underline"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Guest ordering notice */}
          <div className="mt-4 pt-4 border-t border-kfm-border">
            <p className="text-xs text-text-3 text-center">
              Pas envie de creer un compte ? Vous pouvez commander{" "}
              <button
                onClick={() => router.push("/customer/checkout")}
                className="text-kfm-secondary font-semibold hover:underline"
              >
                en tant qu&apos;invite
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
