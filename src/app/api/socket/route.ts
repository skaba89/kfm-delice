import { NextResponse } from "next/server";

// ============================================
// GET /api/socket — Socket.io info endpoint
// ============================================
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: "socket",
      status: "standalone",
      message: "Socket.io est disponible via le serveur de mini-service dedie. Utilisez socket.io-client pour vous connecter.",
      events: [
        "new-order",
        "order-status-change",
        "reservation-created",
        "delivery-update",
      ],
      rooms: ["kitchen", "drivers", "admin"],
      clientUsage: {
        install: "npm install socket.io-client",
        import: 'import { io } from "socket.io-client";',
        connect: 'const socket = io("/", { auth: { token: "..." } });',
        listen: 'socket.on("new-order", (data) => { ... });',
        joinRoom: 'socket.emit("join-room", "kitchen");',
      },
    },
  });
}
