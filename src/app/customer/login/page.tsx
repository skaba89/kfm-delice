import type { Metadata } from "next";
import { LoginView } from "@/components/customer/login-view";

export const metadata: Metadata = {
  title: "Connexion — Mon compte",
  description: "Connectez-vous à votre compte KFM Delice pour suivre vos commandes, gérer vos réservations et personnaliser votre profil.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <LoginView />;
}
