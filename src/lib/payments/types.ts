// ============================================
// KFM Delice — Payment Types & Constants
// ============================================

/** Payment method options */
export type PaymentMethod = "cash" | "mobile_money" | "card";

/** Payment status lifecycle */
export type PaymentStatus =
  | "PENDING"    // Awaiting payment
  | "PROCESSING" // Payment being processed
  | "PAID"       // Payment confirmed
  | "FAILED"     // Payment failed
  | "REFUNDED"   // Payment refunded
  | "PARTIAL";   // Partial payment

/** Mobile money providers */
export type MobileMoneyProvider = "orange_money" | "wave" | "free_money" | "mtn_momo";

/** Payment intent — created before actual payment */
export interface PaymentIntent {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: MobileMoneyProvider | null;
  status: PaymentStatus;
  createdAt: string;
  expiresAt: string;
  paymentUrl?: string | null; // For redirect-based payments (CinetPay, etc.)
  phoneNumber?: string | null;
}

/** Payment result returned after processing */
export interface PaymentResult {
  success: boolean;
  paymentId: string;
  transactionId: string | null;
  status: PaymentStatus;
  amount: number;
  message: string;
  providerRef?: string | null;
}

/** Payment method display info */
export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: string;
  providers?: MobileMoneyProvider[];
  requiresPhoneNumber: boolean;
  isDefault: boolean;
}

// ============================================
// Configuration
// ============================================

/** Available payment methods for customers */
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: "cash",
    label: "Especes",
    description: "Payez en especes a la livraison ou au restaurant",
    icon: "banknote",
    requiresPhoneNumber: false,
    isDefault: true,
  },
  {
    value: "mobile_money",
    label: "Mobile Money",
    description: "Orange Money (Guinee), MTN MoMo, Wave, Free Money",
    icon: "smartphone",
    requiresPhoneNumber: true,
    providers: ["orange_money", "mtn_momo", "wave", "free_money"],
    isDefault: false,
  },
  {
    value: "card",
    label: "Carte bancaire",
    description: "Visa, Mastercard via CinetPay",
    icon: "credit-card",
    requiresPhoneNumber: false,
    isDefault: false,
  },
];

/** Mobile money provider display info — Guinea localized */
export const MOBILE_MONEY_PROVIDERS = {
  orange_money: {
    label: "Orange Money",
    color: "#FF6600",
    logo: "/providers/orange-money.svg",
    prefix: "+224",
  },
  wave: {
    label: "Wave",
    color: "#1DC7EA",
    logo: "/providers/wave.svg",
    prefix: "+224",
  },
  free_money: {
    label: "Free Money",
    color: "#EE1D52",
    logo: "/providers/free-money.svg",
    prefix: "+224",
  },
  mtn_momo: {
    label: "MTN MoMo",
    color: "#FFCC00",
    logo: "/providers/mtn-momo.svg",
    prefix: "+224",
  },
};

// ============================================
// Helpers
// ============================================

/** Format amount for display */
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat("fr-GN").format(Math.round(amount)) + " FG";
}

/** Get payment method display label */
export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
}

/** Get payment status display label */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    PROCESSING: "En cours",
    PAID: "Paye",
    FAILED: "Echoue",
    REFUNDED: "Rembourse",
    PARTIAL: "Partiel",
  };
  return labels[status] || status;
}

/** Validate phone number format (Guinea: +224) */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-]/g, "");
  // Accept formats: +224XXXXXXXX, 6XXXXXXXX, 7XXXXXXXX
  return /^(\+224|0)?[67]\d{8}$/.test(cleaned);
}

/** Clean phone number to standard Guinea format */
export function cleanPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (cleaned.startsWith("+224")) return cleaned;
  if (cleaned.startsWith("0")) return "+224" + cleaned.slice(1);
  return "+224" + cleaned;
}

/** Payment intent expiry (30 minutes) */
export const PAYMENT_INTENT_EXPIRY_MS = 30 * 60 * 1000;
