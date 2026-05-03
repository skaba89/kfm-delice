"use client";

import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { getAuthToken } from "@/lib/constants";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
});

export function useSocketContext() {
  return useContext(SocketContext);
}

export { SocketContext };

interface SocketProviderProps {
  children: React.ReactNode;
  /** Optional room(s) to auto-join on connect */
  rooms?: string[];
}

export function SocketProvider({ children, rooms = [] }: SocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const roomsRef = useRef<string[]>(rooms);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = getAuthToken();

    const socket = io(SOCKET_URL || "/", {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 5000,
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
    });

    socket.on("connect", () => {
      setConnected(true);
      // Re-join rooms on reconnect
      roomsRef.current.forEach((room) => {
        socket.emit("join-room", room);
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      // Silent — fallback to polling
    });

    socket.connect();
    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-room", room);
    }
    if (!roomsRef.current.includes(room)) {
      roomsRef.current.push(room);
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave-room", room);
    }
    roomsRef.current = roomsRef.current.filter((r) => r !== room);
  }, []);

  useEffect(() => {
    roomsRef.current = rooms;
    rooms.forEach((room) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("join-room", room);
      }
    });
  }, [rooms]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
