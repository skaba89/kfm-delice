/**
 * Socket.io Server Utility — KFM Delice
 * 
 * Singleton pattern for managing a Socket.io server instance.
 * In Next.js, Socket.io requires a custom server (not bundled with the standalone output).
 * This utility provides a way to create and manage the server.
 * 
 * Events emitted:
 *   - new-order: { orderId, orderNumber, customerName, total } → room: kitchen, admin
 *   - order-status-change: { orderId, orderNumber, from, to } → room: admin
 *   - reservation-created: { reservationId, guestName, date, time, partySize } → room: admin
 *   - delivery-update: { deliveryId, orderId, status, driverName } → room: drivers, admin
 * 
 * Rooms:
 *   - kitchen: Kitchen staff
 *   - drivers: All delivery drivers
 *   - admin: Admin/manager staff
 *   - customer-{id}: Individual customer
 */

import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function setSocketServer(server: SocketIOServer): void {
  if (io) {
    io.close();
  }
  io = server;
}

/**
 * Emit an event to a specific room.
 * Safe to call even if no socket server is running.
 */
export function emitToRoom(event: string, room: string, data: unknown): void {
  if (io) {
    io.to(room).emit(event, data);
  }
}

/**
 * Emit an event to all connected clients.
 */
export function emitToAll(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
  }
}

// Event type definitions
export interface NewOrderEvent {
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  orderType: string;
}

export interface OrderStatusChangeEvent {
  orderId: string;
  orderNumber: string;
  from: string;
  to: string;
}

export interface ReservationCreatedEvent {
  reservationId: string;
  guestName: string;
  date: string;
  time: string;
  partySize: number;
}

export interface DeliveryUpdateEvent {
  deliveryId: string;
  orderId: string;
  status: string;
  driverName: string;
}
