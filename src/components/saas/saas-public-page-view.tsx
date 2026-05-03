"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  Save,
  RotateCcw,
  LayoutGrid,
  Smartphone,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  CheckCircle2,
  Code,

  ArrowUp,
  ArrowDown,

  Sparkles,
  UtensilsCrossed,
  Truck,
  HelpCircle,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface SectionToggle {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  order: number;
}

interface HeroContent {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  backgroundColor: string;
  showBadge: boolean;
  badgeText: string;
}

interface FeaturedDish {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  image: string;
  featured: boolean;
}

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  twitter: string;
  address: string;
}

interface PublicPageConfig {
  sections: SectionToggle[];
  hero: HeroContent;
  featuredDishes: FeaturedDish[];
  businessHours: BusinessHours[];
  contact: ContactInfo;
  footerText: string;
  metaTitle: string;
  metaDescription: string;
  primaryColor: string;
  secondaryColor: string;
}

// ──────────────────────────────────────────────
// Default Config
// ──────────────────────────────────────────────

const defaultSections: SectionToggle[] = [
  { id: "hero", label: "Banniere Hero", description: "Section principale avec titre, sous-titre et boutons CTA", icon: Sparkles, enabled: true, order: 1 },
  { id: "featured", label: "Plats populaires", description: "Grille des plats les plus commandes", icon: UtensilsCrossed, enabled: true, order: 2 },
  { id: "how-it-works", label: "Comment ca marche", description: "Etapes pour commander en ligne", icon: HelpCircle, enabled: true, order: 3 },
  { id: "delivery-zones", label: "Zones de livraison", description: "Liste des zones avec tarifs et delais", icon: Truck, enabled: true, order: 4 },
  { id: "whatsapp-cta", label: "CTA WhatsApp", description: "Bouton flottant pour commande via WhatsApp", icon: MessageCircle, enabled: true, order: 5 },
  { id: "testimonials", label: "Temoignages", description: "Avis et commentaires des clients", icon: Heart, enabled: false, order: 6 },
  { id: "app-download", label: "Telecharger l'app", description: "Liens vers l'application mobile", icon: Smartphone, enabled: false, order: 7 },
  { id: "footer", label: "Pied de page", description: "Liens, contact et informations legales", icon: LayoutGrid, enabled: true, order: 8 },
];

const defaultHero: HeroContent = {
  title: "Commandez vos repas prefere en ligne",
  subtitle: "Livraison rapide a Conakry. Plats guineens traditionnels et internationaux.",
  ctaText: "Voir le menu",
  ctaLink: "/customer/menu",
  secondaryCtaText: "Commander par WhatsApp",
  secondaryCtaLink: "https://wa.me/224622112233",
  backgroundColor: "orange",
  showBadge: true,
  badgeText: "Livraison gratuite des 25 000 FG",
};

const defaultFeaturedDishes: FeaturedDish[] = [
  { id: "fd-1", name: "Plat de Riz sauce arachide", restaurant: "Le Jardin de Conakry", price: 15_000, image: "/images/dishes/arachide.jpg", featured: true },
  { id: "fd-2", name: "Thieboudienne", restaurant: "Saveurs du Fouta", price: 12_000, image: "/images/dishes/thieboudienne.jpg", featured: true },
  { id: "fd-3", name: "Grilled Fish Special", restaurant: "Restaurant Petit Bateau", price: 18_000, image: "/images/dishes/fish.jpg", featured: true },
  { id: "fd-4", name: "Tô Sauce Feuille", restaurant: "Chez Maman Aminata", price: 8_000, image: "/images/dishes/to.jpg", featured: true },
  { id: "fd-5", name: "Poulet Braise", restaurant: "Chez Karamoko", price: 10_000, image: "/images/dishes/poulet.jpg", featured: true },
  { id: "fd-6", name: "Brochettes Mixtes", restaurant: "La Terrasse de Kaloum", price: 14_000, image: "/images/dishes/brochettes.jpg", featured: true },
];

const defaultBusinessHours: BusinessHours[] = [
  { day: "Lundi", open: "08:00", close: "23:00", isOpen: true },
  { day: "Mardi", open: "08:00", close: "23:00", isOpen: true },
  { day: "Mercredi", open: "08:00", close: "23:00", isOpen: true },
  { day: "Jeudi", open: "08:00", close: "23:00", isOpen: true },
  { day: "Vendredi", open: "08:00", close: "00:00", isOpen: true },
  { day: "Samedi", open: "09:00", close: "00:00", isOpen: true },
  { day: "Dimanche", open: "10:00", close: "22:00", isOpen: true },
];

const defaultContact: ContactInfo = {
  phone: "+224 622 11 22 33",
  whatsapp: "+224 622 11 22 33",
  email: "contact@kfmdelice.com",
  instagram: "@kfmdelice",
  facebook: "KFM Delice",
  twitter: "@kfmdelice",
  address: "45 Avenue de la Republique, Almamya, Conakry, Guinee",
};

const defaultConfig: PublicPageConfig = {
  sections: defaultSections,
  hero: defaultHero,
  featuredDishes: defaultFeaturedDishes,
  businessHours: defaultBusinessHours,
  contact: defaultContact,
  footerText: "2025 KFM Delice. Tous droits reserves. Plateforme de commande de repas en Guinee.",
  metaTitle: "KFM Delice - Commandez vos repas en ligne a Conakry",
  metaDescription: "Commandez vos plats guineens prefere en ligne. Livraison rapide a Conakry. Riz, poulet, poisson, et bien plus.",
  primaryColor: "#F97316",
  secondaryColor: "#1E293B",
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

const STORAGE_KEY = "kfm_saas_public_page_config";

export function SaasPublicPageView() {
  const [config, setConfig] = useState<PublicPageConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("sections");

  // Load config from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch {
      // Use defaults
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ── Section toggles ──
  const toggleSection = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    setConfig((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.sections.length - 1) return prev;
      const newSections = [...prev.sections];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
      return { ...prev, sections: newSections };
    });
  };

  // ── Hero update ──
  const updateHero = (key: keyof HeroContent, value: string | boolean) =>
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }));

  // ── Featured dishes ──
  const toggleFeaturedDish = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      featuredDishes: prev.featuredDishes.map((d) => (d.id === id ? { ...d, featured: !d.featured } : d)),
    }));
  };

  // ── Business hours ──
  const updateBusinessHours = (day: string, key: string, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((h) => (h.day === day ? { ...h, [key]: value } : h)),
    }));
  };

  // ── Contact ──
  const updateContact = (key: keyof ContactInfo, value: string) =>
    setConfig((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } }));

  const activeSectionCount = config.sections.filter((s) => s.enabled).length;

  // ── Preview Mode ──
  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Apercu de la page publique</h2>
          <Button variant="outline" onClick={() => setPreviewMode(false)}>
            Fermer l&apos;apercu
          </Button>
        </div>
        <div className="rounded-xl border border-kfm-border bg-white dark:bg-gray-900 p-6 space-y-8 overflow-auto max-h-[75vh]">
          {/* Hero Preview */}
          {config.sections.find((s) => s.id === "hero")?.enabled && (
            <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white text-center">
              {config.hero.showBadge && (
                <Badge className="bg-white/20 text-white border-0 mb-3">{config.hero.badgeText}</Badge>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold">{config.hero.title}</h1>
              <p className="mt-2 text-orange-100">{config.hero.subtitle}</p>
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <Button className="bg-white text-orange-600 hover:bg-orange-50">{config.hero.ctaText}</Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">{config.hero.secondaryCtaText}</Button>
              </div>
            </div>
          )}

          {/* Featured Dishes Preview */}
          {config.sections.find((s) => s.id === "featured")?.enabled && (
            <div>
              <h2 className="text-lg font-semibold text-text mb-4 text-center">Plats populaires</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {config.featuredDishes.filter((d) => d.featured).map((dish) => (
                  <div key={dish.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-24 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{dish.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{dish.restaurant}</p>
                      <p className="text-xs font-bold text-orange-500 mt-1">{new Intl.NumberFormat("fr-GN").format(dish.price)} FG</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How it Works Preview */}
          {config.sections.find((s) => s.id === "how-it-works")?.enabled && (
            <div>
              <h2 className="text-lg font-semibold text-text mb-4 text-center">Comment ca marche</h2>
              <div className="grid grid-cols-3 gap-4">
                {["Choisissez votre plat", "Passez votre commande", "Recevez votre livraison"].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-bold mb-2">{i + 1}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp CTA Preview */}
          {config.sections.find((s) => s.id === "whatsapp-cta")?.enabled && (
            <div className="rounded-xl bg-green-500 p-6 text-white text-center">
              <MessageCircle className="mx-auto h-8 w-8 mb-2" />
              <p className="text-lg font-semibold">Commandez par WhatsApp</p>
              <p className="text-sm text-green-100 mt-1">{config.contact.whatsapp}</p>
              <Button className="mt-3 bg-white text-green-600 hover:bg-green-50">Ouvrir WhatsApp</Button>
            </div>
          )}

          {/* Footer Preview */}
          {config.sections.find((s) => s.id === "footer")?.enabled && (
            <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{config.footerText}</p>
              <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                <span>{config.contact.phone}</span>
                <span>{config.contact.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {saved && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Enregistre
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <LayoutGrid className="h-3 w-3" />
            {activeSectionCount}/{config.sections.length} sections actives
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Apercu
          </Button>
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
          <TabsTrigger value="sections" className="gap-2"><LayoutGrid className="h-4 w-4" />Sections</TabsTrigger>
          <TabsTrigger value="hero" className="gap-2"><Sparkles className="h-4 w-4" />Hero</TabsTrigger>
          <TabsTrigger value="dishes" className="gap-2"><UtensilsCrossed className="h-4 w-4" />Plats</TabsTrigger>
          <TabsTrigger value="hours" className="gap-2"><Clock className="h-4 w-4" />Horaires</TabsTrigger>
          <TabsTrigger value="contact" className="gap-2"><Phone className="h-4 w-4" />Contact</TabsTrigger>
          <TabsTrigger value="seo" className="gap-2"><Code className="h-4 w-4" />SEO</TabsTrigger>
        </TabsList>

        {/* ── Sections Tab ── */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gestion des sections</CardTitle>
              <CardDescription>Activez, desactivez et reordonnez les sections de la page publique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.sections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 transition-all",
                      section.enabled ? "border-kfm-border" : "border-kfm-border opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveSection(section.id, "up")}
                          disabled={idx === 0}
                          className="text-text-3 hover:text-text disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(section.id, "down")}
                          disabled={idx === config.sections.length - 1}
                          className="text-text-3 hover:text-text disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", section.enabled ? "bg-orange-500/10 text-orange-500" : "bg-surface-2 text-text-3")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{section.label}</p>
                        <p className="text-xs text-text-3">{section.description}</p>
                      </div>
                    </div>
                    <Switch checked={section.enabled} onCheckedChange={() => toggleSection(section.id)} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Hero Tab ── */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-500" /> Banniere Hero</CardTitle>
              <CardDescription>Personnalisez la section principale de la page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Titre principal</Label>
                <Input value={config.hero.title} onChange={(e) => updateHero("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sous-titre</Label>
                <Textarea value={config.hero.subtitle} onChange={(e) => updateHero("subtitle", e.target.value)} rows={2} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Texte du bouton CTA</Label>
                  <Input value={config.hero.ctaText} onChange={(e) => updateHero("ctaText", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Lien du bouton CTA</Label>
                  <Input value={config.hero.ctaLink} onChange={(e) => updateHero("ctaLink", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Texte du bouton secondaire</Label>
                  <Input value={config.hero.secondaryCtaText} onChange={(e) => updateHero("secondaryCtaText", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Lien du bouton secondaire</Label>
                  <Input value={config.hero.secondaryCtaLink} onChange={(e) => updateHero("secondaryCtaLink", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-kfm-border p-4">
                <div>
                  <p className="text-sm font-medium text-text">Afficher le badge</p>
                  <p className="text-xs text-text-3">Badge promo au-dessus du titre</p>
                </div>
                <Switch checked={config.hero.showBadge} onCheckedChange={(v) => updateHero("showBadge", v)} />
              </div>
              {config.hero.showBadge && (
                <div className="space-y-2">
                  <Label>Texte du badge</Label>
                  <Input value={config.hero.badgeText} onChange={(e) => updateHero("badgeText", e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Couleur de fond</Label>
                <Select value={config.hero.backgroundColor} onValueChange={(v) => updateHero("backgroundColor", v)}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Rouge</SelectItem>
                    <SelectItem value="green">Vert</SelectItem>
                    <SelectItem value="blue">Bleu</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Featured Dishes Tab ── */}
        <TabsContent value="dishes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plats mis en avant</CardTitle>
              <CardDescription>Selectionnez les plats a afficher sur la page publique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.featuredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-all",
                    dish.featured ? "border-orange-500/50 bg-orange-500/5" : "border-kfm-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2">
                      <UtensilsCrossed className="h-5 w-5 text-text-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{dish.name}</p>
                      <p className="text-xs text-text-3">{dish.restaurant}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-text">
                      {new Intl.NumberFormat("fr-GN").format(dish.price)} FG
                    </span>
                    <Switch checked={dish.featured} onCheckedChange={() => toggleFeaturedDish(dish.id)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Business Hours Tab ── */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-orange-500" /> Horaires d&apos;ouverture</CardTitle>
              <CardDescription>Configurez les horaires d&apos;ouverture affiches sur la page publique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.businessHours.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-all sm:flex-row flex-col gap-3",
                    day.isOpen ? "border-kfm-border" : "border-kfm-border opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold", day.isOpen ? "bg-orange-500/10 text-orange-500" : "bg-surface-2 text-text-3")}>
                      {day.day.slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-text min-w-[80px]">{day.day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {day.isOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={day.open}
                          onChange={(e) => updateBusinessHours(day.day, "open", e.target.value)}
                          className="w-[120px]"
                        />
                        <span className="text-text-3">-</span>
                        <Input
                          type="time"
                          value={day.close}
                          onChange={(e) => updateBusinessHours(day.day, "close", e.target.value)}
                          className="w-[120px]"
                        />
                      </div>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-600 border-0">Ferme</Badge>
                    )}
                    <Switch checked={day.isOpen} onCheckedChange={(v) => updateBusinessHours(day.day, "isOpen", v)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Contact Tab ── */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-orange-500" /> Informations de contact</CardTitle>
              <CardDescription>Coordonnees affichees sur la page publique</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telephone</Label>
                <Input value={config.contact.phone} onChange={(e) => updateContact("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Label>
                <Input value={config.contact.whatsapp} onChange={(e) => updateContact("whatsapp", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
                <Input type="email" value={config.contact.email} onChange={(e) => updateContact("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Adresse</Label>
                <Input value={config.contact.address} onChange={(e) => updateContact("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                <Input value={config.contact.instagram} onChange={(e) => updateContact("instagram", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</Label>
                <Input value={config.contact.facebook} onChange={(e) => updateContact("facebook", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter / X</Label>
                <Input value={config.contact.twitter} onChange={(e) => updateContact("twitter", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Texte du pied de page</Label>
                <Input value={config.footerText} onChange={(e) => setConfig((prev) => ({ ...prev, footerText: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SEO Tab ── */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-orange-500" /> SEO & Meta</CardTitle>
              <CardDescription>Optimisez le referencement de la page publique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={config.metaTitle} onChange={(e) => setConfig((prev) => ({ ...prev, metaTitle: e.target.value }))} />
                <p className="text-xs text-text-3">{config.metaTitle.length}/60 caracteres recommandes</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={config.metaDescription} onChange={(e) => setConfig((prev) => ({ ...prev, metaDescription: e.target.value }))} rows={3} />
                <p className="text-xs text-text-3">{config.metaDescription.length}/160 caracteres recommandes</p>
              </div>
              <div className="rounded-lg border border-kfm-border p-4 bg-surface-2">
                <p className="text-xs font-semibold text-text-3 uppercase mb-2">Apercu Google</p>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer truncate">{config.metaTitle}</p>
                <p className="text-xs text-green-700 mt-1">kfmdelice.com/customer/menu</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{config.metaDescription}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
