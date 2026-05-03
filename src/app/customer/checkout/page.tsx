import type { Metadata } from "next";
import { CheckoutView } from "@/components/customer/checkout-view";

export const metadata: Metadata = {
  title: "Paiement — Finaliser la commande",
  description: "Finalisez votre commande KFM Delice. Paiement securise par Orange Money, MTN MoMo ou especes. Livraison a domicile ou retrait au restaurant a Conakry.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
