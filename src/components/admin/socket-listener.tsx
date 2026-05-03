"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSocketContext } from "@/components/providers/socket-provider";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, CalendarDays } from "lucide-react";

/**
 * AdminSocketListener — Listens for real-time events and shows sonner toasts.
 * Must be rendered inside a SocketProvider.
 */
export function AdminSocketListener() {
  const { socket, connected } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: unknown) => {
      const d = data as { orderNumber?: string; customerName?: string; total?: number; orderType?: string };
      toast.success("Nouvelle commande", {
        description: `${d.orderNumber || "?"} — ${d.customerName || "?"} — ${formatCurrency(d.total || 0)}`,
        icon: <ShoppingCart className="h-4 w-4 text-kfm-secondary" />,
        duration: 5000,
      });
    };

    const handleReservation = (data: unknown) => {
      const d = data as { guestName?: string; date?: string; time?: string; partySize?: number };
      toast.info("Nouvelle reservation", {
        description: `${d.guestName || "?"} — ${d.date || "?"} a ${d.time || "?"} (${d.partySize || "?"} pers.)`,
        icon: <CalendarDays className="h-4 w-4 text-kfm-info" />,
        duration: 5000,
      });
    };

    const handleOrderStatusChange = (data: unknown) => {
      const d = data as { orderNumber?: string; from?: string; to?: string };
      toast.info(`Commande ${d.orderNumber || "?"}`, {
        description: `Statut : ${d.from || "?"} → ${d.to || "?"}`,
        duration: 4000,
      });
    };

    const handleDeliveryUpdate = (data: unknown) => {
      const d = data as { orderId?: string; status?: string; driverName?: string };
      toast.info("Mise a jour livraison", {
        description: `${d.orderId || "?"} — ${d.status || "?"} (${d.driverName || "?"})`,
        duration: 4000,
      });
    };

    socket.on("new-order", handleNewOrder);
    socket.on("reservation-created", handleReservation);
    socket.on("order-status-change", handleOrderStatusChange);
    socket.on("delivery-update", handleDeliveryUpdate);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("reservation-created", handleReservation);
      socket.off("order-status-change", handleOrderStatusChange);
      socket.off("delivery-update", handleDeliveryUpdate);
    };
  }, [socket]);

  // Silent component — no UI
  return connected ? null : null;
}
