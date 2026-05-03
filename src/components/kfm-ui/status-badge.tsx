"use client";

import { cn } from "@/lib/utils";

const orderStatusStyles: Record<string, string> = {
  pending: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
  confirmed: "bg-kfm-info/10 text-kfm-info border-kfm-info/20",
  preparing: "bg-kfm-secondary/10 text-kfm-secondary border-kfm-secondary/20",
  ready: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  delivering: "bg-kfm-accent/10 text-kfm-accent border-kfm-accent/20",
  completed: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  cancelled: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20",
};

const orderStatusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  completed: "Terminée",
  cancelled: "Annulée",
};

const paymentStatusStyles: Record<string, string> = {
  paid: "bg-kfm-success/10 text-kfm-success border-kfm-success/20",
  unpaid: "bg-kfm-warning/10 text-kfm-warning border-kfm-warning/20",
  failed: "bg-kfm-danger/10 text-kfm-danger border-kfm-danger/20",
  refunded: "bg-kfm-info/10 text-kfm-info border-kfm-info/20",
};

const paymentStatusLabels: Record<string, string> = {
  paid: "Payée",
  unpaid: "Non payée",
  failed: "Échouée",
  refunded: "Remboursée",
};

interface StatusBadgeProps {
  type?: "order" | "payment";
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({
  type = "order",
  status,
  label,
  className,
}: StatusBadgeProps) {
  const styles =
    type === "order" ? orderStatusStyles : paymentStatusStyles;
  const labels =
    type === "order" ? orderStatusLabels : paymentStatusLabels;
  const displayLabel = label || labels[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        styles[status] || "bg-kfm-surface-2 text-kfm-text-2 border-kfm-border",
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
