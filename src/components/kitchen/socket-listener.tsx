"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSocketContext } from "@/components/providers/socket-provider";
import { formatCurrency } from "@/lib/utils";

/**
 * KitchenSocketListener — Listens for new orders and shows toast + plays audio.
 */
function playNewOrderBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not supported
  }
}

export function KitchenSocketListener() {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: unknown) => {
      const d = data as { orderNumber?: string; customerName?: string; total?: number; orderType?: string };
      playNewOrderBeep();
      toast.success("Nouvelle commande en cuisine !", {
        description: `${d.orderNumber || "?"} — ${d.customerName || "?"} — ${formatCurrency(d.total || 0)}`,
        duration: 6000,
      });
    };

    socket.on("new-order", handleNewOrder);

    return () => {
      socket.off("new-order", handleNewOrder);
    };
  }, [socket]);

  return null;
}
