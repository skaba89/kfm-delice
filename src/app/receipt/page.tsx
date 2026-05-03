import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceiptView } from "@/components/customer/receipt-view";

export const metadata: Metadata = {
  title: "Recu de commande",
  description: "Consultez et imprimez votre recu de commande KFM Delice.",
  robots: { index: false, follow: false },
};

function ReceiptContent() {
  return <ReceiptView />;
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-text-2">Chargement...</p>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
