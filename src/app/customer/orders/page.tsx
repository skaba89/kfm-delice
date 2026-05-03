import type { Metadata } from "next";
import { OrdersView } from "@/components/customer/orders-view";

export const metadata: Metadata = {
  title: "Mes Commandes",
  description: "Consultez l'historique de vos commandes KFM Delice, suivez leur statut en temps réel et accédez aux détails de chaque commande.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage() {
  return <OrdersView />;
}
