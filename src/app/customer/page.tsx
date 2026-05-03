import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mon Espace Client",
  description: "Accédez à votre espace client KFM Delice : menu, commandes, réservations et profil.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomerPage() {
  redirect("/customer/menu");
}
