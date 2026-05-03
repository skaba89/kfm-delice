import type { Metadata } from "next";
import { MenuView } from "@/components/customer/menu-view";

export const metadata: Metadata = {
  title: "Notre Menu — Plats guineens",
  description:
    "Decouvrez notre carte de plats guineens authentiques a Conakry : Thiep bou dien, Yassa poulet, Mafe, Grillades, Bissap et Ataya. Commandez en ligne pour livraison ou a emporter.",
  keywords: [
    "menu restaurant conakry",
    "plat guineen",
    "thiep bou dien",
    "yassa poulet",
    "mafe guinee",
    "cuisine guineenne",
    "commander en ligne conakry",
    "restaurant africain conakry",
    "grillades guinee",
    "bissap",
    "ataya",
    "livraison conakry",
  ],
  openGraph: {
    title: "Notre Menu — Plats guineens | KFM Delice",
    description:
      "Thiep bou dien, Yassa poulet, Mafe, Grillades et plus. Cuisine guineenne authentique a Conakry. Commandez en ligne !",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notre Menu — Plats guineens | KFM Delice",
    description: "Cuisine guineenne authentique a Conakry. Commandez en ligne !",
  },
  alternates: {
    canonical: "/customer/menu",
  },
};

export default function MenuPage() {
  return <MenuView />;
}
