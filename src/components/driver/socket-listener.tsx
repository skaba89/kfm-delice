"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSocketContext } from "@/components/providers/socket-provider";

/**
 * DriverSocketListener — Listens for delivery assignment and status updates.
 */
function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported
  }
}

export function DriverSocketListener() {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleDeliveryUpdate = (data: unknown) => {
      const d = data as { orderId?: string; status?: string; driverName?: string; deliveryId?: string };
      if (d.status === "DRIVER_ASSIGNED" || d.status === "PENDING") {
        playNotificationBeep();
        toast.success("Nouvelle livraison assignee !", {
          description: `Commande ${d.orderId || "?"} — Statut: ${d.status || "?"}`,
          duration: 6000,
        });
      }
    };

    socket.on("delivery-update", handleDeliveryUpdate);

    return () => {
      socket.off("delivery-update", handleDeliveryUpdate);
    };
  }, [socket]);

  return null;
}
