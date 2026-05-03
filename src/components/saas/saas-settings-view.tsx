"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Bell,
  Mail,
  MessageSquare,
  MapPin,
  Percent,
  Globe,
  Save,
  RotateCcw,
  Smartphone,
  Clock,

  Banknote,
  Truck,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PlatformSettings {
  general: {
    platformName: string;
    platformTagline: string;
    defaultCurrency: string;
    language: string;
    timezone: string;
  };
  payments: {
    cashEnabled: boolean;
    orangeMoneyEnabled: boolean;
    orangeMoneyKey: string;
    mtnMomoEnabled: boolean;
    mtnMomoKey: string;
    cinetPayEnabled: boolean;
    cinetPayApiKey: string;
    cinetPaySiteId: string;
    cinetPaySecretKey: string;
  };
  notifications: {
    smsEnabled: boolean;
    smsProvider: string;
    smsApiKey: string;
    smsSenderId: string;
    emailEnabled: boolean;
    emailProvider: string;
    emailSmtpHost: string;
    emailSmtpPort: string;
    emailSmtpUser: string;
    emailSmtpPass: string;
    emailFromName: string;
    emailFromAddress: string;
  };
  delivery: {
    zones: DeliveryZone[];
    baseDeliveryFee: number;
    perKmRate: number;
    freeDeliveryThreshold: number;
    maxDeliveryRadius: number;
  };
  finance: {
    taxRate: number;
    platformCommissionRate: number;
    vatEnabled: boolean;
    invoicePrefix: string;
    autoInvoice: boolean;
  };
}

interface DeliveryZone {
  id: string;
  name: string;
  price: number;
  estimatedTime: string;
  active: boolean;
}

// ──────────────────────────────────────────────
// Default Settings
// ──────────────────────────────────────────────

const defaultSettings: PlatformSettings = {
  general: {
    platformName: "KFM Delice",
    platformTagline: "La meilleure plateforme de commande de repas en Guinee",
    defaultCurrency: "GNF",
    language: "fr",
    timezone: "Africa/Conakry",
  },
  payments: {
    cashEnabled: true,
    orangeMoneyEnabled: true,
    orangeMoneyKey: "om_live_xxxxxxxxxxxxxxxxxxxx",
    mtnMomoEnabled: false,
    mtnMomoKey: "",
    cinetPayEnabled: true,
    cinetPayApiKey: "cp_live_xxxxxxxxxxxxxxxxxxxx",
    cinetPaySiteId: "123456",
    cinetPaySecretKey: "xxxxxxxxxxxxxxxxxxxx",
  },
  notifications: {
    smsEnabled: true,
    smsProvider: "orange",
    smsApiKey: "xxxxxxxxxxxxxxxxxxxx",
    smsSenderId: "KFMDelice",
    emailEnabled: true,
    emailProvider: "smtp",
    emailSmtpHost: "smtp.gmail.com",
    emailSmtpPort: "587",
    emailSmtpUser: "notifications@kfmdelice.com",
    emailSmtpPass: "xxxxxxxx",
    emailFromName: "KFM Delice",
    emailFromAddress: "notifications@kfmdelice.com",
  },
  delivery: {
    zones: [
      { id: "dz-1", name: "Kaloum", price: 5_000, estimatedTime: "20-30 min", active: true },
      { id: "dz-2", name: "Dixinn", price: 5_000, estimatedTime: "20-30 min", active: true },
      { id: "dz-3", name: "Matam", price: 7_500, estimatedTime: "30-40 min", active: true },
      { id: "dz-4", name: "Matoto", price: 10_000, estimatedTime: "35-45 min", active: true },
      { id: "dz-5", name: "Ratoma", price: 10_000, estimatedTime: "35-45 min", active: true },
      { id: "dz-6", name: "Kipe", price: 7_500, estimatedTime: "25-35 min", active: true },
      { id: "dz-7", name: "Madina", price: 12_500, estimatedTime: "40-50 min", active: true },
      { id: "dz-8", name: "Hamdallaye", price: 15_000, estimatedTime: "45-60 min", active: false },
    ],
    baseDeliveryFee: 5_000,
    perKmRate: 500,
    freeDeliveryThreshold: 25_000,
    maxDeliveryRadius: 25,
  },
  finance: {
    taxRate: 18,
    platformCommissionRate: 10,
    vatEnabled: true,
    invoicePrefix: "KFM-INV",
    autoInvoice: true,
  },
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

const STORAGE_KEY = "kfm_saas_platform_settings";

export function SaasSettingsView() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Save handler
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Reset handler
  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ── Update helpers ──
  const updateGeneral = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, general: { ...prev.general, [key]: value } }));

  const updatePayments = (key: string, value: boolean | string) =>
    setSettings((prev) => ({ ...prev, payments: { ...prev.payments, [key]: value } }));

  const updateNotifications = (key: string, value: boolean | string) =>
    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));

  const updateFinance = (key: string, value: number | boolean | string) =>
    setSettings((prev) => ({ ...prev, finance: { ...prev.finance, [key]: value } }));

  const updateDelivery = (key: string, value: number) =>
    setSettings((prev) => ({ ...prev, delivery: { ...prev.delivery, [key]: value } }));

  const toggleZone = (id: string) =>
    setSettings((prev) => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        zones: prev.delivery.zones.map((z) => (z.id === id ? { ...z, active: !z.active } : z)),
      },
    }));

  return (
    <div className="space-y-6">
      {/* Save Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saved && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Parametres enregistres
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reinitialiser
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4" />Paiements</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2"><Truck className="h-4 w-4" />Livraison</TabsTrigger>
          <TabsTrigger value="finance" className="gap-2"><Percent className="h-4 w-4" />Finance</TabsTrigger>
        </TabsList>

        {/* ── General Settings ── */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-orange-500" /> Informations generales</CardTitle>
              <CardDescription>Configurez les informations de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom de la plateforme</Label>
                  <Input value={settings.general.platformName} onChange={(e) => updateGeneral("platformName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Slogan</Label>
                  <Input value={settings.general.platformTagline} onChange={(e) => updateGeneral("platformTagline", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Devise par defaut</Label>
                  <Select value={settings.general.defaultCurrency} onValueChange={(v) => updateGeneral("defaultCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GNF">GNF - Franc guineen</SelectItem>
                      <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
                      <SelectItem value="USD">USD - Dollar americain</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Langue par defaut</Label>
                  <Select value={settings.general.language} onValueChange={(v) => updateGeneral("language", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Francais</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select value={settings.general.timezone} onValueChange={(v) => updateGeneral("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Conakry">Africa/Conakry (GMT+0)</SelectItem>
                      <SelectItem value="Africa/Dakar">Africa/Dakar (GMT+0)</SelectItem>
                      <SelectItem value="Africa/Abidjan">Africa/Abidjan (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payment Settings ── */}
        <TabsContent value="payments" className="space-y-6">
          {/* Cash */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Banknote className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Paiement en especes</CardTitle>
                    <CardDescription>Paiement a la livraison ou au comptoir</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.payments.cashEnabled}
                  onCheckedChange={(v) => updatePayments("cashEnabled", v)}
                />
              </div>
            </CardHeader>
          </Card>

          {/* Orange Money */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Smartphone className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Orange Money</CardTitle>
                    <CardDescription>Paiement mobile via Orange Money Guinee</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.payments.orangeMoneyEnabled}
                  onCheckedChange={(v) => updatePayments("orangeMoneyEnabled", v)}
                />
              </div>
            </CardHeader>
            {settings.payments.orangeMoneyEnabled && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cle API Orange Money</Label>
                    <Input type="password" value={settings.payments.orangeMoneyKey} onChange={(e) => updatePayments("orangeMoneyKey", e.target.value)} placeholder="om_live_xxxxxxxxxxxxxxxx" />
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
                    <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-3">Obtenez votre cle API depuis le portail developpeur Orange Money Guinee.</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* MTN MoMo */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Smartphone className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">MTN Mobile Money</CardTitle>
                    <CardDescription>Paiement mobile via MTN MoMo</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.payments.mtnMomoEnabled}
                  onCheckedChange={(v) => updatePayments("mtnMomoEnabled", v)}
                />
              </div>
            </CardHeader>
            {settings.payments.mtnMomoEnabled && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cle API MTN MoMo</Label>
                    <Input type="password" value={settings.payments.mtnMomoKey} onChange={(e) => updatePayments("mtnMomoKey", e.target.value)} placeholder="mtn_live_xxxxxxxxxxxxxxxx" />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* CinetPay */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">CinetPay</CardTitle>
                    <CardDescription>Passerelle de paiement multi-operateurs</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.payments.cinetPayEnabled}
                  onCheckedChange={(v) => updatePayments("cinetPayEnabled", v)}
                />
              </div>
            </CardHeader>
            {settings.payments.cinetPayEnabled && (
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cle API</Label>
                    <Input type="password" value={settings.payments.cinetPayApiKey} onChange={(e) => updatePayments("cinetPayApiKey", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Site ID</Label>
                    <Input value={settings.payments.cinetPaySiteId} onChange={(e) => updatePayments("cinetPaySiteId", e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Cle secrete</Label>
                    <Input type="password" value={settings.payments.cinetPaySecretKey} onChange={(e) => updatePayments("cinetPaySecretKey", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* ── Notification Settings ── */}
        <TabsContent value="notifications" className="space-y-6">
          {/* SMS */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Notifications SMS</CardTitle>
                    <CardDescription>Envoyez des SMS pour les commandes, livraisons et alertes</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.smsEnabled}
                  onCheckedChange={(v) => updateNotifications("smsEnabled", v)}
                />
              </div>
            </CardHeader>
            {settings.notifications.smsEnabled && (
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fournisseur SMS</Label>
                    <Select value={settings.notifications.smsProvider} onValueChange={(v) => updateNotifications("smsProvider", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orange">Orange SMS API</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="africastalking">Africa&apos;s Talking</SelectItem>
                        <SelectItem value="bulksms">BulkSMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cle API SMS</Label>
                    <Input type="password" value={settings.notifications.smsApiKey} onChange={(e) => updateNotifications("smsApiKey", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label> Expediteur (Sender ID)</Label>
                    <Input value={settings.notifications.smsSenderId} onChange={(e) => updateNotifications("smsSenderId", e.target.value)} placeholder="KFMDelice" maxLength={11} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Email */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Notifications Email</CardTitle>
                    <CardDescription>Envoyez des emails pour les commandes, factures et alertes</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(v) => updateNotifications("emailEnabled", v)}
                />
              </div>
            </CardHeader>
            {settings.notifications.emailEnabled && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fournisseur Email</Label>
                    <Select value={settings.notifications.emailProvider} onValueChange={(v) => updateNotifications("emailProvider", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP personnalise</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Hote SMTP</Label>
                      <Input value={settings.notifications.emailSmtpHost} onChange={(e) => updateNotifications("emailSmtpHost", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Port SMTP</Label>
                      <Input value={settings.notifications.emailSmtpPort} onChange={(e) => updateNotifications("emailSmtpPort", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Utilisateur SMTP</Label>
                      <Input value={settings.notifications.emailSmtpUser} onChange={(e) => updateNotifications("emailSmtpUser", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mot de passe SMTP</Label>
                      <Input type="password" value={settings.notifications.emailSmtpPass} onChange={(e) => updateNotifications("emailSmtpPass", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom de l&apos;expediteur</Label>
                      <Input value={settings.notifications.emailFromName} onChange={(e) => updateNotifications("emailFromName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email de l&apos;expediteur</Label>
                      <Input type="email" value={settings.notifications.emailFromAddress} onChange={(e) => updateNotifications("emailFromAddress", e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* ── Delivery Settings ── */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-orange-500" /> Zones de livraison</CardTitle>
              <CardDescription>Configurez les zones de livraison et leurs tarifs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.delivery.zones.map((zone) => (
                <div key={zone.id} className={cn("flex items-center justify-between rounded-lg border p-4 transition-colors", zone.active ? "border-kfm-border" : "border-kfm-border opacity-60")}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <MapPin className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{zone.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-text-3 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {zone.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-text">
                      {new Intl.NumberFormat("fr-GN").format(zone.price)} FG
                    </span>
                    <Switch checked={zone.active} onCheckedChange={() => toggleZone(zone.id)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tarification de livraison</CardTitle>
              <CardDescription>Parametres de calcul des frais de livraison</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Frais de base (FG)</Label>
                <Input type="number" value={settings.delivery.baseDeliveryFee} onChange={(e) => updateDelivery("baseDeliveryFee", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Tarif par km (FG)</Label>
                <Input type="number" value={settings.delivery.perKmRate} onChange={(e) => updateDelivery("perKmRate", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Seuil livraison gratuite (FG)</Label>
                <Input type="number" value={settings.delivery.freeDeliveryThreshold} onChange={(e) => updateDelivery("freeDeliveryThreshold", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Rayon maximal (km)</Label>
                <Input type="number" value={settings.delivery.maxDeliveryRadius} onChange={(e) => updateDelivery("maxDeliveryRadius", Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Finance Settings ── */}
        <TabsContent value="finance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-orange-500" /> Taux et taxes</CardTitle>
              <CardDescription>Configurez les taux de taxes et commissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Taux de TVA (%)</Label>
                  <Input type="number" value={settings.finance.taxRate} onChange={(e) => updateFinance("taxRate", Number(e.target.value))} min={0} max={100} step={0.5} />
                  <p className="text-xs text-text-3">TVA actuelle en Guinee: 18%</p>
                </div>
                <div className="space-y-2">
                  <Label>Commission plateforme (%)</Label>
                  <Input type="number" value={settings.finance.platformCommissionRate} onChange={(e) => updateFinance("platformCommissionRate", Number(e.target.value))} min={0} max={50} step={0.5} />
                  <p className="text-xs text-text-3">Prelevee sur chaque transaction</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-kfm-border p-4">
                  <div>
                    <p className="text-sm font-medium text-text">TVA activee</p>
                    <p className="text-xs text-text-3">Appliquer la TVA sur les commandes</p>
                  </div>
                  <Switch
                    checked={settings.finance.vatEnabled}
                    onCheckedChange={(v) => updateFinance("vatEnabled", v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-kfm-border p-4">
                  <div>
                    <p className="text-sm font-medium text-text">Facturation automatique</p>
                    <p className="text-xs text-text-3">Generer les factures automatiquement</p>
                  </div>
                  <Switch
                    checked={settings.finance.autoInvoice}
                    onCheckedChange={(v) => updateFinance("autoInvoice", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prefixe des factures</Label>
                  <Input value={settings.finance.invoicePrefix} onChange={(e) => updateFinance("invoicePrefix", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
