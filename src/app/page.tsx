"use client";

import Link from "next/link";
import Image from "next/image";
import {
  UtensilsCrossed,
  ShoppingCart,
  Truck,
  MapPin,
  Clock,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Star,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

/* ─── Data ──────────────────────────────────────────────── */

const featuredDishes = [
  {
    name: "Thiéboudienne",
    description: "Riz au poisson avec légumes, sauce tomate parfumée au tamarin",
    price: 35000,
    image: "/images/menu/thieboudienne.png",
    badge: "Populaire",
  },
  {
    name: "Yassa Poulet",
    description: "Poulet mariné au citron, oignons caramélisés, servi avec riz blanc",
    price: 30000,
    image: "/images/menu/yassa-poulet.png",
    badge: "Favori",
  },
  {
    name: "Mafé",
    description: "Ragoût de bœuf dans une sauce onctueuse à la pâte d'arachide",
    price: 30000,
    image: "/images/menu/mafe.png",
    badge: null,
  },
  {
    name: "Poulet Braisé",
    description: "Poulet entier mariné aux épices, grillé au charbon de bois",
    price: 25000,
    image: "/images/menu/poulet-brase.png",
    badge: "Populaire",
  },
  {
    name: "Brochette de Bœuf",
    description: "Bœuf mariné aux épices, grillé au charbon avec oignons et poivrons",
    price: 20000,
    image: "/images/menu/brochette-boeuf.png",
    badge: null,
  },
  {
    name: "Poisson Grillé",
    description: "Poisson grillé assaisonné, servi avec sauce pimentée et salade",
    price: 25000,
    image: "/images/menu/poisson-grille.png",
    badge: null,
  },
];

const steps = [
  {
    icon: UtensilsCrossed,
    title: "Choisissez vos plats",
    description:
      "Parcourez notre menu de plats traditionnels guinéens et sélectionnez vos favoris",
  },
  {
    icon: ShoppingCart,
    title: "Passez commande",
    description:
      "Ajoutez vos plats au panier et commandez facilement en ligne ou via WhatsApp",
  },
  {
    icon: Truck,
    title: "Livraison rapide",
    description:
      "Recevez votre commande chez vous en 30-45 minutes dans tout Conakry",
  },
];

const neighborhoods = [
  "Kaloum",
  "Dixinn",
  "Matam",
  "Ratoma",
  "Matoto",
];

/* ─── Component ─────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ═══════ Hero Section ═══════ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-[#1a1a1a]">
        <div className="absolute inset-0 bg-[url('/images/banner/banner1.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border-0">
              <Star className="mr-1 size-3" />
              N°1 de la livraison à Conakry
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              KFM Délice
            </h1>
            <p className="mt-4 text-xl font-medium text-orange-100 sm:text-2xl">
              La cuisine africaine livrée chez vous à Conakry
            </p>
            <p className="mt-3 max-w-lg text-base text-orange-200/80 sm:text-lg">
              Plots traditionnels guinéens préparés avec amour. Thieboudienne,
              Mafé, Yassa et bien plus — livrés à votre porte.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 bg-white px-8 text-base font-semibold text-orange-600 hover:bg-orange-50"
              >
                <Link href="/customer/menu">
                  Voir le menu
                  <ChevronRight className="ml-1 size-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-2 border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <a
                  href="https://wa.me/224622112233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 size-5" />
                  Commander via WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 38.3C1248 33.3 1344 26.7 1392 23.3L1440 20V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z"
              fill="#F8FAFC"
            />
          </svg>
        </div>
      </header>

      {/* ═══════ Popular Dishes Section ═══════ */}
      <section className="bg-[#F8FAFC] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Nos plats populaires
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
              Découvrez nos saveurs
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#475569]">
              Des plats traditionnels préparés frais chaque jour avec des
              ingrédients locaux de qualité.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDishes.map((dish) => (
              <Card
                key={dish.name}
                className="group overflow-hidden border-0 py-0 shadow-md transition-shadow hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-orange-50">
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {dish.badge && (
                    <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0">
                      {dish.badge}
                    </Badge>
                  )}
                </div>
                {/* Content */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1a1a1a]">
                        {dish.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[#475569]">
                        {dish.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-base font-bold text-orange-600">
                      {formatCurrency(dish.price)}
                    </span>
                  </div>
                  <Button
                    asChild
                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Link href="/customer/menu">Commander</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Link href="/customer/menu">
                Voir tout le menu
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ How It Works Section ═══════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Comment ça marche
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
              Commander en 3 étapes
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-orange-100">
                  <step.icon className="size-8 text-orange-600" />
                </div>
                <div className="mt-2 text-sm font-bold text-orange-500">
                  Étape {index + 1}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WhatsApp CTA Section ═══════ */}
      <section className="bg-gradient-to-r from-[#25D366] to-[#128C7E] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Préférez commander via WhatsApp ?
              </h2>
              <p className="mt-2 text-base text-white/90">
                Envoyez-nous votre commande directement par message. Rapide,
                simple et direct.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 bg-white px-8 text-base font-semibold text-[#25D366] hover:bg-green-50"
            >
              <a
                href="https://wa.me/224622112233"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 size-5" />
                Commander via WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ Location / Delivery Section ═══════ */}
      <section className="bg-[#F8FAFC] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              <MapPin className="mr-1 size-3" />
              Zones de livraison
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
              Livraison dans tout Conakry
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#475569]">
              Nous livrons dans les 5 communes de Conakry. Commandez où que vous
              soyez dans la capitale.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {neighborhoods.map((n) => (
              <div
                key={n}
                className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-3 shadow-sm transition-colors hover:border-orange-400 hover:bg-orange-50"
              >
                <MapPin className="size-4 text-orange-500" />
                <span className="text-sm font-medium text-[#1a1a1a]">{n}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-[#475569]">
              <Truck className="size-4 text-orange-500" />
              Livraison en 30-45 minutes
            </div>
            <div className="flex items-center gap-2 text-sm text-[#475569]">
              <Clock className="size-4 text-orange-500" />
              Ouvert tous les jours de 10h à 23h
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Footer ═══════ */}
      <footer className="bg-[#1a1a1a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold text-orange-400">KFM Délice</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                Restaurant de cuisine africaine à Conakry, Guinée. Plots
                traditionnels livrés chez vous avec amour et authenticité.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="https://wa.me/224622112233"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-[#94A3B8] transition-colors hover:bg-[#25D366] hover:text-white"
                >
                  <MessageCircle className="size-4" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-[#94A3B8] transition-colors hover:bg-[#E1306C] hover:text-white"
                >
                  <Instagram className="size-4" />
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-[#94A3B8] transition-colors hover:bg-[#1877F2] hover:text-white"
                >
                  <Facebook className="size-4" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#CBD5E1]">
                Navigation
              </h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/customer/menu"
                    className="text-sm text-[#94A3B8] transition-colors hover:text-orange-400"
                  >
                    Notre menu
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/login"
                    className="text-sm text-[#94A3B8] transition-colors hover:text-orange-400"
                  >
                    Mon compte
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/orders"
                    className="text-sm text-[#94A3B8] transition-colors hover:text-orange-400"
                  >
                    Mes commandes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Horaires */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#CBD5E1]">
                Horaires
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" />
                  Lun - Sam : 10h - 23h
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" />
                  Dimanche : Fermé
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#CBD5E1]">
                Contact
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" />
                  <a
                    href="tel:+224622112233"
                    className="transition-colors hover:text-orange-400"
                  >
                    +224 622 11 22 33
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" />
                  <a
                    href="mailto:contact@kfmdelice.com"
                    className="transition-colors hover:text-orange-400"
                  >
                    contact@kfmdelice.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  Conakry, Guinée
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-[#64748B]">
              © {new Date().getFullYear()} KFM Délice. Tous droits réservés.
              Conakry, Guinée.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
