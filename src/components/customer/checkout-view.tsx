"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Banknote,
  Smartphone,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Copy,
  User,
  Phone,
  Mail,
  LogIn,
  ShoppingBag,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  getCart,
  clearCart,
  getOrderType,
  getDeliveryAddress,
  type CartItem,
  type OrderType,
} from "@/lib/cart";
import { useAuth, getAuthHeaders } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import {
  type PaymentMethod,
  type MobileMoneyProvider,
  PAYMENT_METHODS,
  MOBILE_MONEY_PROVIDERS,
  getPaymentMethodLabel,
} from "@/lib/payments/types";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface OrderResult {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  estimatedTime?: number;
  message?: string;
  createdAt: string;
}

interface PaymentResult {
  success: boolean;
  paymentId: string;
  transactionId: string | null;
  status: string;
  amount: number;
  message: string;
  providerRef?: string | null;
}

// ============================================
// Component
// ============================================

type CheckoutStep = "info" | "payment" | "processing" | "waiting_payment" | "success";

export function CheckoutView() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("info");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setLocalOrderType] = useState<OrderType>("TAKEAWAY");
  const [deliveryAddr, setDeliveryAddr] = useState({ address: "", city: "", district: "", notes: "" });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [error, setError] = useState("");

  // Guest form
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider>("orange_money");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  // Results
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // CinetPay redirect + polling
  const [cinetpayPaymentId, setCinetpayPaymentId] = useState<string | null>(null);
  const [pollingTimeout, setPollingTimeout] = useState(false);

  // Pre-fill from user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      setGuestName(
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || ""
      );
      if (user.phone) setGuestPhone(user.phone);
      if (user.email) setGuestEmail(user.email);
    }
  }, [isAuthenticated, user]);

  // Load cart and settings
  useEffect(() => {
    const handleUpdate = () => {
      setCart(getCart());
      setLocalOrderType(getOrderType());
      const addr = getDeliveryAddress();
      if (addr) setDeliveryAddr({ address: addr.address || "", city: addr.city || "", district: addr.district || "", notes: addr.notes || "" });
    };
    const id = requestAnimationFrame(handleUpdate);
    window.addEventListener("cart-updated", handleUpdate);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("cart-updated", handleUpdate);
    };
  }, []);

  // Fetch delivery fee
  useEffect(() => {
    async function fetchDeliveryFee() {
      try {
        const res = await fetch("/api/customer/menu");
        const data = await res.json();
        if (data.success && data.data?.restaurant) {
          setDeliveryFee(data.data.restaurant.deliveryFee || 0);
        }
      } catch { /* silently */ }
    }
    fetchDeliveryFee();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const fee = orderType === "DELIVERY" ? deliveryFee : 0;
  const total = subtotal + tax + fee;

  // ── Step 1: Place Order ──
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setError("");

    // Validate delivery
    if (orderType === "DELIVERY" && (!deliveryAddr.address || !deliveryAddr.city)) {
      setError("Veuillez renseigner l'adresse de livraison.");
      return;
    }

    // Validate guest fields
    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Votre nom et numero de telephone sont requis.");
      return;
    }
    if (guestPhone.trim().replace(/\s/g, "").length < 8) {
      setError("Numero de telephone invalide.");
      return;
    }

    setSubmitting(true);

    try {
      let res: Response;

      if (isAuthenticated) {
        res = await fetch("/api/customer/orders", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            items: cart.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
            orderType,
            deliveryAddress: orderType === "DELIVERY" ? deliveryAddr.address : undefined,
            deliveryCity: orderType === "DELIVERY" ? deliveryAddr.city : undefined,
            deliveryDistrict: orderType === "DELIVERY" ? deliveryAddr.district : undefined,
            deliveryNotes: deliveryAddr.notes || undefined,
            notes: specialNotes || undefined,
            paymentMethod,
          }),
        });
      } else {
        res = await fetch("/api/public/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: guestName.trim(),
            customerPhone: guestPhone.trim(),
            customerEmail: guestEmail.trim() || undefined,
            items: cart.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
            orderType,
            deliveryAddress: orderType === "DELIVERY" ? deliveryAddr.address : undefined,
            deliveryCity: orderType === "DELIVERY" ? deliveryAddr.city : undefined,
            deliveryDistrict: orderType === "DELIVERY" ? deliveryAddr.district : undefined,
            deliveryNotes: deliveryAddr.notes || undefined,
            notes: specialNotes || undefined,
            paymentMethod,
          }),
        });
      }

      const data = await res.json();

      if (data.success) {
        setOrderResult(data.data);
        // Move to payment step
        setStep("payment");
      } else {
        setError(data.error || "Erreur lors de la commande.");
      }
    } catch {
      setError("Erreur de connexion. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: Process Payment ──
  const handleProcessPayment = async () => {
    if (!orderResult) return;
    setError("");

    // Validate mobile money phone
    if (paymentMethod === "mobile_money" && !paymentPhone.trim()) {
      setError("Numero de telephone pour Mobile Money requis.");
      return;
    }

    setProcessingPayment(true);

    try {
      // 1. Create payment intent
      const intentRes = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderResult.id,
          amount: total,
          method: paymentMethod,
          provider: paymentMethod === "mobile_money" ? mobileProvider : null,
          phoneNumber: paymentMethod === "mobile_money" ? paymentPhone.trim() : null,
        }),
      });
      const intentData = await intentRes.json();

      if (!intentData.success) {
        setError(intentData.error || "Erreur lors de l'initialisation du paiement.");
        setProcessingPayment(false);
        return;
      }

      const paymentId = intentData.data.id;
      const paymentUrl = intentData.data.paymentUrl;

      // 2. If CinetPay returns a paymentUrl, redirect and poll
      if (paymentUrl) {
        setCinetpayPaymentId(paymentId);
        setPollingTimeout(false);
        setStep("waiting_payment");
        setProcessingPayment(false);

        // Open CinetPay payment page in a new tab
        window.open(paymentUrl, "_blank");
        return;
      }

      // 3. Process the payment (dev/no-redirect flow)
      setStep("processing");

      const processRes = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          method: paymentMethod,
          provider: paymentMethod === "mobile_money" ? mobileProvider : null,
          phoneNumber: paymentMethod === "mobile_money" ? paymentPhone.trim() : null,
        }),
      });
      const processData = await processRes.json();

      if (processData.success) {
        setPaymentResult(processData.data);
        setStep("success");
        clearCart();
      } else {
        setError(processData.error || "Erreur lors du paiement.");
        setStep("payment");
      }
    } catch {
      setError("Erreur de connexion. Veuillez reessayer.");
      setStep("payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  // ── Poll payment status after CinetPay redirect ──
  useEffect(() => {
    if (step !== "waiting_payment" || !cinetpayPaymentId) return;

    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const POLL_INTERVAL_MS = 3000; // 3 seconds

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status?id=${cinetpayPaymentId}`);
        const data = await res.json();

        if (data.success && data.data?.status === "PAID") {
          setPaymentResult({
            success: true,
            paymentId: cinetpayPaymentId,
            transactionId: data.data.transactionId || null,
            status: "PAID",
            amount: data.data.amount || total,
            message: "Paiement confirme",
          });
          setStep("success");
          clearCart();
        }
      } catch {
        // Silently retry on next interval
      }
    };

    // Start polling
    pollStatus();
    intervalId = setInterval(pollStatus, POLL_INTERVAL_MS);

    // Timeout after 5 minutes
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setPollingTimeout(true);
    }, TIMEOUT_MS);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [step, cinetpayPaymentId, total]);

  // ── Success screen ──
  if (step === "success" && orderResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kfm-success/10">
          <CheckCircle2 className="h-8 w-8 text-kfm-success" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-text">Commande confirmee !</h2>
        <p className="mt-2 text-sm text-text-2">
          Votre commande a ete enregistree avec succes.
        </p>

        <Card className="mt-6 w-full max-w-sm border-kfm-border">
          <CardContent className="p-4 text-center space-y-3">
            <div>
              <p className="text-xs text-text-3">Numero de commande</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-lg font-bold text-kfm-secondary">{orderResult.orderNumber}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(orderResult.orderNumber)}
                  className="text-text-3 hover:text-text-2"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-text">{formatCurrency(orderResult.total)}</p>
              {paymentResult && (
                <p className="text-xs text-text-3 mt-1">
                  Paiement {getPaymentMethodLabel(paymentMethod)} — {paymentResult.message}
                </p>
              )}
            </div>
            {orderResult.estimatedTime && (
              <p className="flex items-center justify-center gap-1 text-xs text-text-3">
                <Clock className="h-3.5 w-3.5" />
                Delai estime : ~{orderResult.estimatedTime} min
              </p>
            )}
          </CardContent>
        </Card>

        {/* Suggest login for guests */}
        {!isAuthenticated && (
          <Card className="mt-4 w-full max-w-sm border-kfm-secondary/30 bg-kfm-secondary/5">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-text-2">
                Creez un compte pour suivre vos commandes et cumuler des points de fidelite !
              </p>
              <Link href="/customer/login">
                <Button size="sm" className="mt-3 bg-kfm-secondary hover:bg-kfm-secondary/90 text-white">
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Creer un compte
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.push("/customer/menu")}>
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Commander encore
          </Button>
          {isAuthenticated && (
            <Button
              className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white"
              onClick={() => router.push("/customer/orders")}
            >
              Voir mes commandes
            </Button>
          )}
        </div>

        {/* Receipt link — requires both orderNumber AND phone */}
        {orderResult && (() => {
          const receiptPhone = isAuthenticated ? (user?.phone || "") : guestPhone.trim();
          const params = new URLSearchParams({
            orderNumber: orderResult.orderNumber,
          });
          if (receiptPhone) params.set("phone", receiptPhone);
          return (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => router.push(`/receipt?${params.toString()}`)}
            >
              <Receipt className="mr-1.5 h-4 w-4" />
              Voir le recu
            </Button>
          );
        })()}
      </div>
    );
  }

  // ── Waiting for CinetPay payment (polling screen) ──
  if (step === "waiting_payment") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kfm-secondary/10">
            <Loader2 className="h-8 w-8 text-kfm-secondary animate-spin" />
          </div>
        </div>
        <h2 className="mt-4 text-lg font-bold text-text">En attente de paiement...</h2>
        <p className="mt-2 text-sm text-text-2 max-w-xs">
          La page de paiement CinetPay a ete ouverte dans un nouvel onglet.
          Completez le paiement et revenez sur cette page.
        </p>
        {!pollingTimeout ? (
          <p className="mt-3 text-xs text-text-3">
            Verification automatique du statut en cours... Veuillez ne pas fermer cette page.
          </p>
        ) : (
          <div className="mt-4 rounded-kfm-sm bg-kfm-warning/10 p-3 max-w-xs">
            <p className="text-xs text-kfm-warning font-medium">
              Delai d'attente depasse. Verifiez le statut de votre paiement dans vos commandes.
            </p>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/customer/orders")}
            className="text-sm"
          >
            Voir mes commandes
          </Button>
          <Button
            className="bg-kfm-secondary hover:bg-kfm-secondary/90 text-white text-sm"
            onClick={() => setStep("payment")}
          >
            Changer de mode de paiement
          </Button>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-text-3">
          <ShieldCheck className="h-4 w-4" />
          Paiement securise
        </div>
      </div>
    );
  }

  // ── Processing screen ──
  if (step === "processing") {
    const providerInfo = paymentMethod === "mobile_money"
      ? MOBILE_MONEY_PROVIDERS[mobileProvider]
      : null;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kfm-secondary/10">
            <Loader2 className="h-8 w-8 text-kfm-secondary animate-spin" />
          </div>
        </div>
        <h2 className="mt-4 text-lg font-bold text-text">Traitement du paiement...</h2>
        <p className="mt-2 text-sm text-text-2 max-w-xs">
          {paymentMethod === "cash"
            ? "Enregistrement de votre commande en especes..."
            : paymentMethod === "mobile_money"
            ? `Connexion a ${providerInfo?.label || "Mobile Money"} en cours...`
            : "Traitement du paiement par carte..."}
        </p>
        <p className="mt-3 text-xs text-text-3">
          Ne fermez pas cette page. Le traitement peut prendre quelques secondes.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-text-3">
          <ShieldCheck className="h-4 w-4" />
          Paiement securise
        </div>
      </div>
    );
  }

  // ── Payment step ──
  if (step === "payment" && orderResult) {
    const orderTypeLabels: Record<string, string> = {
      DINE_IN: "Sur place",
      TAKEAWAY: "A emporter",
      DELIVERY: "Livraison",
    };

    return (
      <div className="space-y-5">
        <button
          onClick={() => setStep("info")}
          className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <h2 className="text-lg font-bold text-text">Paiement</h2>

        {/* Order summary */}
        <Card className="border-kfm-success/30 bg-kfm-success/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-kfm-success" />
              <span className="text-sm font-semibold text-kfm-success">Commande creee !</span>
            </div>
            <div className="ml-7 space-y-1 text-xs text-text-2">
              <p>Commande : <span className="font-semibold text-text">{orderResult.orderNumber}</span></p>
              <p>Type : <Badge variant="outline" className="border-kfm-border text-text-2">{orderTypeLabels[orderResult.status] || orderType}</Badge></p>
            </div>
          </CardContent>
        </Card>

        {/* Amount to pay */}
        <Card className="border-kfm-border bg-surface">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-text-3">Montant a payer</p>
            <p className="mt-1 text-2xl font-bold text-text">{formatCurrency(total)}</p>
          </CardContent>
        </Card>

        {/* Payment method selection */}
        <Card className="border-kfm-border bg-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-text">Choisir le mode de paiement</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = paymentMethod === method.value;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-kfm-sm border-2 p-4 transition-all text-left",
                    isSelected
                      ? "border-kfm-secondary bg-kfm-secondary/5"
                      : "border-kfm-border hover:border-text-3"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isSelected ? "bg-kfm-secondary text-white" : "bg-surface-2 text-text-3"
                  )}>
                    {method.value === "cash" && <Banknote className="h-5 w-5" />}
                    {method.value === "mobile_money" && <Smartphone className="h-5 w-5" />}
                    {method.value === "card" && <CreditCard className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-kfm-secondary" : "text-text"
                    )}>
                      {method.label}
                    </p>
                    <p className="text-xs text-text-3">{method.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-kfm-secondary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Mobile Money provider selection */}
        {paymentMethod === "mobile_money" && (
          <Card className="border-kfm-border bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-text">
                Fournisseur Mobile Money
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(["orange_money", "mtn_momo", "wave", "free_money"] as MobileMoneyProvider[]).map((prov) => {
                  const info = MOBILE_MONEY_PROVIDERS[prov];
                  const isSelected = mobileProvider === prov;
                  return (
                    <button
                      key={prov}
                      onClick={() => setMobileProvider(prov)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-kfm-sm border-2 p-3 transition-all",
                        isSelected
                          ? "border-kfm-secondary bg-kfm-secondary/5"
                          : "border-kfm-border hover:border-text-3"
                      )}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.label.slice(0, 2).toUpperCase()}
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold leading-tight text-center",
                        isSelected ? "text-kfm-secondary" : "text-text-2"
                      )}>
                        {info.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Phone input for mobile money */}
              <div className="space-y-1.5">
                <Label className="text-xs text-text-2">
                  Numero de telephone ({MOBILE_MONEY_PROVIDERS[mobileProvider].label})
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input
                    type="tel"
                    placeholder="+224 6XX XX XX XX"
                    className="pl-10 border-kfm-border"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-text-3">
                  Le numero doit etre associe a votre compte {MOBILE_MONEY_PROVIDERS[mobileProvider].label}.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash notice */}
        {paymentMethod === "cash" && (
          <Card className="border-kfm-warning/30 bg-kfm-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Banknote className="h-5 w-5 text-kfm-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Paiement en especes</p>
                  <p className="text-xs text-text-2 mt-1">
                    {orderType === "DELIVERY"
                      ? "Preparez le montant exact. Le livreur vous remettra la facture."
                      : "Payez directement au caissier lors du retrait de votre commande."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card notice (skeleton) */}
        {paymentMethod === "card" && (
          <Card className="border-kfm-info/30 bg-kfm-info/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-kfm-info flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Paiement par carte</p>
                  <p className="text-xs text-text-2 mt-1">
                    Visa et Mastercard acceptes via notre partenaire de paiement securise.
                    Le paiement sera traite en toute securite.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-kfm-sm bg-kfm-danger/10 p-3 text-sm text-kfm-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Pay button */}
        <Button
          className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white h-12 text-sm font-semibold"
          onClick={handleProcessPayment}
          disabled={processingPayment}
        >
          {processingPayment ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              {paymentMethod === "cash" ? "Confirmer" : "Payer"} — {formatCurrency(total)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-text-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          Paiement securise et chiffre
        </div>
      </div>
    );
  }

  // ── Empty cart ──
  if (cart.length === 0 && !orderResult) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/customer/menu")}
          className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </button>
        <p className="text-center text-sm text-text-2 py-8">
          Votre panier est vide. Ajoutez des articles pour continuer.
        </p>
      </div>
    );
  }

  // ── Step 1: Order Info ──
  const orderTypeLabels: Record<string, string> = {
    DINE_IN: "Sur place",
    TAKEAWAY: "A emporter",
    DELIVERY: "Livraison",
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push("/customer/cart")}
        className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au panier
      </button>

      <h2 className="text-lg font-bold text-text">Finaliser la commande</h2>

      {/* Customer info */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text flex items-center gap-2">
            <User className="h-4 w-4 text-kfm-secondary" />
            {isAuthenticated ? "Votre compte" : "Vos informations"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kfm-secondary/10 text-sm font-bold text-kfm-secondary">
                {user.firstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-text">
                  {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                </p>
                <p className="text-xs text-text-3">{user.email}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Nom complet *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                    <Input placeholder="Votre nom" className="pl-10 border-kfm-border" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-2">Telephone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                    <Input type="tel" placeholder="+224 6XX XX XX XX" className="pl-10 border-kfm-border" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-text-2">Email (optionnel)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
                  <Input type="email" placeholder="votre@email.com" className="pl-10 border-kfm-border" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-text-3">
                Commander en invite.{" "}
                <Link href="/customer/login" className="text-kfm-secondary font-semibold hover:underline">
                  Se connecter
                </Link>{" "}
                pour suivre vos commandes.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order type */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-4">
          <Label className="text-sm font-semibold text-text mb-3 block">Type de commande</Label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "DINE_IN", label: "Sur place", icon: "🪑" },
              { value: "TAKEAWAY", label: "A emporter", icon: "🥡" },
              { value: "DELIVERY", label: "Livraison", icon: "🛵" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalOrderType(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-kfm-sm border-2 p-3 transition-all",
                  orderType === opt.value
                    ? "border-kfm-secondary bg-kfm-secondary/5 text-kfm-secondary"
                    : "border-kfm-border text-text-2 hover:border-text-3"
                )}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-xs font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery address */}
      {orderType === "DELIVERY" && (
        <Card className="border-kfm-border bg-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-text flex items-center gap-2">
              <MapPin className="h-4 w-4 text-kfm-danger" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Input placeholder="Adresse complete" className="border-kfm-border" value={deliveryAddr.address} onChange={(e) => setDeliveryAddr({ ...deliveryAddr, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Conakry *" className="border-kfm-border" value={deliveryAddr.city} onChange={(e) => setDeliveryAddr({ ...deliveryAddr, city: e.target.value })} />
              <Input placeholder="Quartier" className="border-kfm-border" value={deliveryAddr.district} onChange={(e) => setDeliveryAddr({ ...deliveryAddr, district: e.target.value })} />
            </div>
            <Input placeholder="Instructions de livraison (optionnel)" className="border-kfm-border" value={deliveryAddr.notes} onChange={(e) => setDeliveryAddr({ ...deliveryAddr, notes: e.target.value })} />
          </CardContent>
        </Card>
      )}

      {/* Order summary */}
      <Card className="border-kfm-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text">Resume</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {cart.map((item, idx) => (
            <div key={`${item.menuItemId}-${idx}`} className="flex justify-between text-sm">
              <span className="text-text-2">{item.quantity}x {item.name}</span>
              <span className="text-text">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-text-2">Sous-total</span>
            <span className="text-text">{formatCurrency(subtotal)}</span>
          </div>
          {fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-2">Livraison</span>
              <span className="text-text">{formatCurrency(fee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-2">TVA (18%)</span>
            <span className="text-text">{formatCurrency(tax)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-text">Total</span>
            <span className="text-text">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-kfm-border bg-surface">
        <CardContent className="p-4">
          <Label className="text-sm font-semibold text-text mb-2 block">
            Notes (optionnel)
          </Label>
          <Textarea
            placeholder="Allergies, preferences, instructions speciales..."
            className="border-kfm-border resize-none"
            rows={2}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-kfm-sm bg-kfm-danger/10 p-3 text-sm text-kfm-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full bg-kfm-secondary hover:bg-kfm-secondary/90 text-white h-12 text-sm font-semibold"
        onClick={handlePlaceOrder}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creation de la commande...
          </>
        ) : (
          <>
            Creer la commande — {formatCurrency(total)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
