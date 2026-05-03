"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  UtensilsCrossed,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface ReceiptItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName?: string | null;
}

interface ReceiptStatus {
  status: string;
  notes: string | null;
  createdAt: string;
}

interface ReceiptPayment {
  id: string;
  amount: number;
  method: string;
  provider: string | null;
  status: string;
  transactionId: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface ReceiptData {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currency: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryDistrict: string | null;
  notes: string | null;
  tableNumber: number | null;
  loyaltyPointsEarned: number | null;
  createdAt: string;
  completedAt: string | null;
  items: ReceiptItem[];
  statusHistory: ReceiptStatus[];
  payments: ReceiptPayment[];
  restaurant: {
    name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
  } | null;
}

// ============================================
// Status helpers
// ============================================

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmee",
  PREPARING: "En preparation",
  READY: "Prete",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livree",
  COMPLETED: "Terminee",
  CANCELLED: "Annulee",
  REFUNDED: "Remboursee",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Especes",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte bancaire",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Sur place",
  TAKEAWAY: "A emporter",
  DELIVERY: "Livraison",
  DRIVE_THRU: "Drive",
};

// ============================================
// Component
// ============================================

export function ReceiptView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("orderNumber");
  const phone = searchParams.get("phone");

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber || !phone) {
      setError("Numero de commande et telephone requis");
      setLoading(false);
      return;
    }

    async function fetchReceipt() {
      try {
        const res = await fetch(
          `/api/public/receipt?orderNumber=${encodeURIComponent(orderNumber ?? "")}&phone=${encodeURIComponent(phone ?? "")}`
        );
        const data = await res.json();

        if (data.success) {
          setReceipt(data.data);
        } else {
          setError(data.error || "Recu introuvable");
        }
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }

    fetchReceipt();
  }, [orderNumber, phone]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNumber = () => {
    if (receipt) {
      navigator.clipboard?.writeText(receipt.orderNumber);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-kfm-secondary animate-spin" />
        <p className="mt-4 text-sm text-text-2">Chargement du recu...</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kfm-danger/10 mb-4">
          <AlertCircle className="h-8 w-8 text-kfm-danger" />
        </div>
        <p className="text-lg font-bold text-text mb-2">Recu introuvable</p>
        <p className="text-sm text-text-2 text-center max-w-sm mb-6">
          {error || "Verifiez votre numero de commande et telephone."}
        </p>
        <Button variant="outline" onClick={() => router.push("/customer/menu")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Retour au menu
        </Button>
      </div>
    );
  }

  // ── Receipt ──
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Print button (hidden when printing) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="outline" onClick={() => router.push("/customer/menu")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={handlePrint} className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white">
          <Printer className="mr-1.5 h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {/* Receipt card */}
      <Card className="border-kfm-border bg-surface print:border print:border-gray-300 print:shadow-none" id="receipt">
        <CardContent className="p-6 space-y-5">
          {/* ── Restaurant header ── */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kfm-secondary text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">{receipt.restaurant?.name || "KFM Delice"}</h1>
              </div>
            </div>
            {receipt.restaurant?.address && (
              <p className="text-xs text-text-2">
                {receipt.restaurant.address}, {receipt.restaurant.city}
              </p>
            )}
            {receipt.restaurant?.phone && (
              <p className="text-xs text-text-2 flex items-center justify-center gap-1">
                <Phone className="h-3 w-3" /> {receipt.restaurant.phone}
              </p>
            )}
          </div>

          <Separator />

          {/* ── Order info ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-3">RECU DE COMMANDE</span>
              <div className="flex items-center gap-1.5">
                <Badge
                  className={
                    receipt.status === "COMPLETED" || receipt.status === "DELIVERED"
                      ? "bg-kfm-success/10 text-kfm-success border-kfm-success/20"
                      : receipt.status === "CANCELLED"
                      ? "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20"
                      : "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20"
                  }
                  variant="outline"
                >
                  {STATUS_LABELS[receipt.status] || receipt.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-text-3">Commande</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="font-bold text-text">{receipt.orderNumber}</p>
                  <button onClick={handleCopyNumber} className="print:hidden text-text-3 hover:text-text-2">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-text-3">Date</p>
                <p className="font-semibold text-text mt-0.5">{formatDateTime(receipt.createdAt)}</p>
              </div>
              <div>
                <p className="text-text-3">Type</p>
                <p className="font-semibold text-text mt-0.5">{ORDER_TYPE_LABELS[receipt.orderType] || receipt.orderType}</p>
              </div>
              <div>
                <p className="text-text-3">Client</p>
                <p className="font-semibold text-text mt-0.5">{receipt.customerName}</p>
              </div>
            </div>

            {receipt.tableNumber && (
              <div className="text-xs">
                <span className="text-text-3">Table :</span>{" "}
                <span className="font-semibold text-text">#{receipt.tableNumber}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Items ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-3">Articles commandes</p>
            <div className="space-y-2">
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-text font-medium">
                      {item.quantity}x {item.itemName}
                    </span>
                    {item.variantName && (
                      <span className="text-text-3 text-xs ml-1">({item.variantName})</span>
                    )}
                  </div>
                  <span className="text-text font-medium ml-4">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Totals ── */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Sous-total</span>
              <span className="text-text">{formatCurrency(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-2">TVA (18%)</span>
              <span className="text-text">{formatCurrency(receipt.tax)}</span>
            </div>
            {receipt.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-2">Livraison</span>
                <span className="text-text">{formatCurrency(receipt.deliveryFee)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span className="text-text">TOTAL</span>
              <span className="text-kfm-secondary">{formatCurrency(receipt.total)}</span>
            </div>
          </div>

          {/* ── Payment info ── */}
          {receipt.payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-3">Paiement</p>
                {receipt.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {payment.status === "PAID" ? (
                        <CheckCircle2 className="h-4 w-4 text-kfm-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-kfm-warning" />
                      )}
                      <span className="text-text">
                        {PAYMENT_LABELS[payment.method] || payment.method}
                        {payment.provider && payment.method === "MOBILE_MONEY" && (
                          <span className="text-text-3 ml-1">
                            ({payment.provider.replace("_", " ")})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-text font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Delivery info ── */}
          {receipt.orderType === "DELIVERY" && receipt.deliveryAddress && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-3 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Adresse de livraison
                </p>
                <p className="text-sm text-text">
                  {receipt.deliveryAddress}
                  {receipt.deliveryCity && `, ${receipt.deliveryCity}`}
                  {receipt.deliveryDistrict && ` (${receipt.deliveryDistrict})`}
                </p>
              </div>
            </>
          )}

          {/* ── Notes ── */}
          {receipt.notes && (
            <>
              <Separator />
              <div className="text-xs text-text-2 bg-surface-2 rounded-kfm-sm p-3">
                <span className="font-semibold text-text-3">Notes :</span> {receipt.notes}
              </div>
            </>
          )}

          {/* ── Loyalty points ── */}
          {receipt.loyaltyPointsEarned && receipt.loyaltyPointsEarned > 0 && (
            <div className="text-center text-xs text-kfm-secondary bg-kfm-secondary/5 rounded-kfm-sm p-2">
              +{receipt.loyaltyPointsEarned} points de fidelite gagnes
            </div>
          )}

          {/* ── Status history ── */}
          {receipt.statusHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-3">Suivi</p>
                <div className="space-y-1.5">
                  {receipt.statusHistory.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <div className={`
                        flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 mt-0.5
                        ${h.status === "COMPLETED" || h.status === "DELIVERED" || h.status === "PAID"
                          ? "bg-kfm-success/10 text-kfm-success"
                          : "bg-surface-2 text-text-3"
                        }
                      `}>
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-medium text-text">
                          {STATUS_LABELS[h.status] || h.status}
                        </span>
                        {h.notes && <span className="text-text-3 ml-1">— {h.notes}</span>}
                        <p className="text-text-3 mt-0.5">{formatDateTime(h.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* ── Footer ── */}
          <div className="text-center space-y-1 pt-2">
            <p className="text-xs text-text-3">Merci pour votre commande !</p>
            <p className="text-[10px] text-text-3">
              KFM Delice — Restaurant africain a Conakry
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
