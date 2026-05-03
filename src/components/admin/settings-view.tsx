"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, RotateCcw, Bell, Shield, Palette, Globe,
  Loader2, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──────────────────────────────────────────────────────────────────

interface KfmSettings {
  general: {
    platformName: string;
    defaultCurrency: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    twoFactorEnabled: boolean;
  };
  appearance: {
    theme: string;
    primaryColor: string;
  };
}

// ── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: KfmSettings = {
  general: {
    platformName: "KFM Restaurant OS",
    defaultCurrency: "GNF",
    timezone: "Africa/Dakar",
    language: "fr",
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 60,
    twoFactorEnabled: false,
  },
  appearance: {
    theme: "auto",
    primaryColor: "indigo",
  },
};

const STORAGE_KEY = "kfm_settings";

const CURRENCIES = [
  { value: "XOF", label: "XOF (Franc CFA)" },
  { value: "EUR", label: "EUR (Euro)" },
  { value: "USD", label: "USD (Dollar US)" },
];

const TIMEZONES = [
  { value: "Africa/Dakar", label: "Conakry (GMT+0)" },
  { value: "Africa/Conakry", label: "Conakry (GMT+0)" },
  { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
  { value: "Europe/Paris", label: "Paris (GMT+1/+2)" },
];

const LANGUAGES = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
];

const THEMES = [
  { value: "clair", label: "Clair" },
  { value: "sombre", label: "Sombre" },
  { value: "auto", label: "Automatique" },
];

const PRIMARY_COLORS = [
  { value: "indigo", label: "Indigo" },
  { value: "blue", label: "Bleu" },
  { value: "green", label: "Vert" },
  { value: "purple", label: "Violet" },
];

const COLOR_SWATCHES: Record<string, string> = {
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminSettingsView() {
  const [settings, setSettings] = useState<KfmSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load settings from API on mount, fall back to localStorage, then defaults
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data?.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...json.data.settings });
        setLoaded(true);
        return;
      }
    } catch { /* API failed, try localStorage */ }

    // Fallback: localStorage
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      }
    } catch { /* use defaults */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save to API + localStorage
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        toast.success("Parametres sauvegardes avec succes !");
      } else {
        toast.error(json.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      // Fallback: save to localStorage only
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Parametres sauvegardes localement (API indisponible)");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Parametres reinitialises par defaut");
  };

  // Updaters
  const updateGeneral = (key: keyof KfmSettings["general"], value: string) => {
    setSettings((prev) => ({ ...prev, general: { ...prev.general, [key]: value } }));
  };

  const updateNotifications = (key: keyof KfmSettings["notifications"], value: boolean) => {
    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
  };

  const updateSecurity = (key: keyof KfmSettings["security"], value: number | boolean) => {
    setSettings((prev) => ({ ...prev, security: { ...prev.security, [key]: value } }));
  };

  const updateAppearance = (key: keyof KfmSettings["appearance"], value: string) => {
    setSettings((prev) => ({ ...prev, appearance: { ...prev.appearance, [key]: value } }));
  };

  // Toggle component
  const renderToggle = (enabled: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors focus:outline-none",
        enabled ? "bg-kfm-secondary" : "bg-kfm-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5 left-0.5" : "left-0.5"
        )}
      />
    </button>
  );

  // Select component
  const renderSelect = (
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void,
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Parametres</h2>
          <p className="mt-1 text-sm text-text-2">Configuration de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="inline-flex items-center gap-2 rounded-kfm-sm border border-kfm-border px-3 py-2 text-sm font-medium text-text-2 hover:bg-surface-2 transition">
            <RotateCcw className="h-4 w-4" /> Reinitialiser
          </button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-kfm-sm bg-kfm-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-surface border border-kfm-border rounded-kfm-sm p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="general" className="rounded-kfm-sm data-[state=active]:bg-kfm-secondary data-[state=active]:text-white gap-1.5 text-xs font-medium px-3 py-2">
            <Globe className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-kfm-sm data-[state=active]:bg-kfm-secondary data-[state=active]:text-white gap-1.5 text-xs font-medium px-3 py-2">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-kfm-sm data-[state=active]:bg-kfm-secondary data-[state=active]:text-white gap-1.5 text-xs font-medium px-3 py-2">
            <Shield className="h-3.5 w-3.5" /> Securite
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-kfm-sm data-[state=active]:bg-kfm-secondary data-[state=active]:text-white gap-1.5 text-xs font-medium px-3 py-2">
            <Palette className="h-3.5 w-3.5" /> Apparence
          </TabsTrigger>
        </TabsList>

        {/* ── General Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="general">
          <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Globe className="h-4 w-4 text-kfm-secondary" /> Parametres generaux
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Nom de la plateforme</label>
                <input
                  value={settings.general.platformName}
                  onChange={(e) => updateGeneral("platformName", e.target.value)}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                  placeholder="KFM Restaurant OS"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Devise par defaut</label>
                {renderSelect(settings.general.defaultCurrency, CURRENCIES, (v) => updateGeneral("defaultCurrency", v))}
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Fuseau horaire</label>
                {renderSelect(settings.general.timezone, TIMEZONES, (v) => updateGeneral("timezone", v))}
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Langue</label>
                {renderSelect(settings.general.language, LANGUAGES, (v) => updateGeneral("language", v))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications Tab ───────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Bell className="h-4 w-4 text-kfm-secondary" /> Notifications
            </h3>
            <div className="space-y-4">
              {[
                { key: "emailEnabled" as const, label: "Notifications email", desc: "Recevoir les notifications par email" },
                { key: "smsEnabled" as const, label: "Notifications SMS", desc: "Recevoir les alertes par SMS" },
                { key: "pushEnabled" as const, label: "Notifications push", desc: "Recevoir les notifications dans le navigateur" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-kfm-sm border border-kfm-border bg-bg p-4">
                  <div>
                    <p className="text-sm font-medium text-text">{item.label}</p>
                    <p className="text-xs text-text-3 mt-0.5">{item.desc}</p>
                  </div>
                  {renderToggle(
                    settings.notifications[item.key],
                    () => updateNotifications(item.key, !settings.notifications[item.key])
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Security Tab ────────────────────────────────────────────────── */}
        <TabsContent value="security">
          <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Shield className="h-4 w-4 text-kfm-secondary" /> Securite
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Longueur min. mot de passe (6-20)</label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => {
                    const val = Math.min(20, Math.max(6, parseInt(e.target.value) || 6));
                    updateSecurity("passwordMinLength", val);
                  }}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                  min={6}
                  max={20}
                />
                <p className="mt-1 text-xs text-text-3">Entre 6 et 20 caracteres</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Delai d&apos;expiration session (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSecurity("sessionTimeout", parseInt(e.target.value) || 60)}
                  className="w-full rounded-kfm-sm border border-kfm-border bg-bg px-3 py-2.5 text-sm text-text focus:border-kfm-secondary focus:outline-none"
                  min={5}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-kfm-sm border border-kfm-border bg-bg p-4">
              <div>
                <p className="text-sm font-medium text-text">Authentification 2FA</p>
                <p className="text-xs text-text-3 mt-0.5">Activer l&apos;authentification a deux facteurs pour tous les comptes</p>
              </div>
              {renderToggle(
                settings.security.twoFactorEnabled,
                () => updateSecurity("twoFactorEnabled", !settings.security.twoFactorEnabled)
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Appearance Tab ──────────────────────────────────────────────── */}
        <TabsContent value="appearance">
          <div className="rounded-kfm-md border border-kfm-border bg-surface shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Palette className="h-4 w-4 text-kfm-secondary" /> Apparence
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateAppearance("theme", t.value)}
                      className={cn(
                        "rounded-kfm-sm border px-3 py-2 text-xs font-medium transition",
                        settings.appearance.theme === t.value
                          ? "border-kfm-secondary bg-kfm-secondary/10 text-kfm-secondary"
                          : "border-kfm-border bg-bg text-text-2 hover:bg-surface-2"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-3 mb-1.5 block">Couleur principale</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIMARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateAppearance("primaryColor", c.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-kfm-sm border px-3 py-2 text-xs font-medium transition",
                        settings.appearance.primaryColor === c.value
                          ? "border-kfm-secondary bg-kfm-secondary/10 text-kfm-secondary"
                          : "border-kfm-border bg-bg text-text-2 hover:bg-surface-2"
                      )}
                    >
                      <span className={cn("h-3 w-3 rounded-full", COLOR_SWATCHES[c.value])} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
