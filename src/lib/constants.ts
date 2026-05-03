import {
  LayoutDashboard,
  ShoppingCart,
  Monitor,
  Truck,
  UtensilsCrossed,
  Package,
  Users,
  CreditCard,
  UserCog,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════
   SIDEBAR NAVIGATION
   ═══════════════════════════════════════════ */
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const sidebarNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Commandes", icon: ShoppingCart, badge: 12 },
  { id: "pos", label: "Caisse POS", icon: Monitor },
  { id: "deliveries", label: "Livraisons", icon: Truck, badge: 3 },
  { id: "products", label: "Produits / Menus", icon: UtensilsCrossed },
  { id: "stocks", label: "Stocks", icon: Package },
  { id: "clients", label: "Clients", icon: Users },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "team", label: "Equipe", icon: UserCog },
  { id: "reports", label: "Rapports", icon: BarChart3 },
  { id: "settings", label: "Parametres", icon: Settings },
];

/* ═══════════════════════════════════════════
   ORDER STATUS STYLES
   ═══════════════════════════════════════════ */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export const orderStatusStyles: Record<OrderStatus, string> = {
  pending: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
  confirmed: "bg-kfm-info/10 text-kfm-info border-kfm-info/20",
  preparing: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20",
  ready: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  delivering: "bg-kfm-accent/10 text-kfm-accent border-kfm-accent/20",
  completed: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  cancelled: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmee",
  preparing: "En preparation",
  ready: "Pret",
  delivering: "En livraison",
  completed: "Terminee",
  cancelled: "Annulee",
};

/* ═══════════════════════════════════════════
   PAYMENT STATUS STYLES
   ═══════════════════════════════════════════ */
export type PaymentStatus = "paid" | "unpaid" | "failed" | "refunded";

export const paymentStatusStyles: Record<PaymentStatus, string> = {
  paid: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  unpaid: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
  failed: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20",
  refunded: "bg-kfm-info/10 text-kfm-info border-kfm-info/20",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Paye",
  unpaid: "Non paye",
  failed: "Echoue",
  refunded: "Rembourse",
};

/* ═══════════════════════════════════════════
   TYPES (used by pages)
   ═══════════════════════════════════════════ */
export interface Order {
  id: string;
  client: string;
  items: string;
  total: string;
  status: OrderStatus;
  payment: PaymentStatus;
  time: string;
  type: "sur place" | "livraison" | "a emporter";
}

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  available: boolean;
}

export interface Delivery {
  id: string;
  orderId: string;
  client: string;
  address: string;
  driver: string;
  status: OrderStatus;
  eta: string;
  distance: string;
  cost: string;
}

/* ═══════════════════════════════════════════
   STATUS MAPPERS (DB ↔ UI)
   ═══════════════════════════════════════════ */

/** Map DB order status (UPPER_CASE) to UI order status (lower_case) */
export function mapOrderStatusFromDB(status: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PREPARING: "preparing",
    READY: "ready",
    OUT_FOR_DELIVERY: "delivering",
    DELIVERED: "delivering",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    REFUNDED: "cancelled",
  };
  return map[status] ?? "pending";
}

/** Map UI order status (lower_case) to DB order status (UPPER_CASE) */
export function mapOrderStatusToDB(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    preparing: "PREPARING",
    ready: "READY",
    delivering: "OUT_FOR_DELIVERY",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
  return map[status];
}

/** Map DB payment status to UI payment status */
export function mapPaymentStatusFromDB(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    PAID: "paid",
    PENDING: "unpaid",
    PARTIAL: "unpaid",
    FAILED: "failed",
    REFUNDED: "refunded",
  };
  return map[status] ?? "unpaid";
}

/** Map DB order type to UI order type */
export function mapOrderTypeFromDB(type: string): Order["type"] {
  const map: Record<string, Order["type"]> = {
    DINE_IN: "sur place",
    TAKEAWAY: "a emporter",
    DELIVERY: "livraison",
    DRIVE_THRU: "sur place",
  };
  return map[type] ?? "sur place";
}

/** Map UI order type to DB order type */
export function mapOrderTypeToDB(type: Order["type"]): string {
  const map: Record<string, string> = {
    "sur place": "DINE_IN",
    "a emporter": "TAKEAWAY",
    "livraison": "DELIVERY",
  };
  return map[type];
}

/** Map UI payment method to DB payment method */
export function mapPaymentMethodToDB(method: string): string {
  const map: Record<string, string> = {
    cash: "CASH",
    "mobile-money": "MOBILE_MONEY",
    card: "CARD",
  };
  return map[method] ?? method;
}

/* ═══════════════════════════════════════════
   VALID NEXT STATUSES (status change flow)
   ═══════════════════════════════════════════ */
export function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  const flow: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivering", "completed"],
    delivering: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return flow[currentStatus] ?? [];
}

/* ═══════════════════════════════════════════
   CURRENCY FORMATTER
   ═══════════════════════════════════════════ */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-GN").format(amount) + " FG";
}

/** Helper to get Bearer token from localStorage */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kfm_token");
}

/** Standard auth headers for API calls */
export function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
    "Content-Type": "application/json",
  };
}
