"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/constants";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * useSocket() — Manages a single Socket.io connection.
 * Auto-connects on mount, disconnects on unmount.
 * Falls back gracefully if WebSocket is unavailable.
 */
export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const initializedRef = useRef(false);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = getAuthToken();

    const newSocket = io(SOCKET_URL || "/", {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 5000,
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
    });

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("connect_error", (_err) => {
      // Silently handle connection errors
    });

    newSocket.connect();
    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    socket,
    connected,
    connect,
    disconnect,
  };
}

/**
 * useSocketEvent() — Listen to a specific socket event.
 * Automatically re-registers when socket reconnects.
 */
export function useSocketEvent(
  socket: Socket | null,
  event: string,
  callback: (data: unknown) => void
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: unknown) => {
      callbackRef.current(data);
    };

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event]);
}
