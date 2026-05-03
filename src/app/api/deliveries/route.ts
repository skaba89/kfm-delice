import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/deliveries — List deliveries
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const deliveries = await db.delivery.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            vehicleType: true,
            vehiclePlate: true,
            status: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(deliveries);
  } catch (err) {
    console.error("[DELIVERIES GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/deliveries — Create delivery
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, driverId, dropoffAddress, dropoffLandmark, notes } = body;

    if (!orderId) {
      return error("orderId is required");
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    // Get restaurant for pickup address
    const restaurant = await db.restaurant.findUnique({
      where: { id: order.restaurantId },
      select: { address: true, name: true },
    });

    const delivery = await db.delivery.create({
      data: {
        orderId,
        restaurantId: order.restaurantId,
        pickupAddress: restaurant?.address || order.restaurantId,
        dropoffAddress: dropoffAddress || order.deliveryAddress || "N/A",
        dropoffLandmark: dropoffLandmark || null,
        driverId: driverId || null,
        status: driverId ? "DRIVER_ASSIGNED" : "SEARCHING_DRIVER",
        deliveryFee: order.deliveryFee,
        driverEarning: Math.round(order.deliveryFee * 0.5),
        estimatedTime: 30,
        notes: notes || null,
        assignedAt: driverId ? new Date() : null,
      },
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    return success(delivery, 201);
  } catch (err) {
    console.error("[DELIVERIES POST]", err);
    return error("Internal server error", 500);
  }
}
