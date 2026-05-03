import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/drivers — List drivers
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const status = searchParams.get("status");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    // Filter by restaurant
    if (restaurantId) where.restaurantId = restaurantId;

    // Filter by status (online/offline/busy)
    if (status) where.status = status;

    // Filter by active
    if (active !== null && active !== undefined && active !== "") {
      where.isActive = active === "true";
    }

    const drivers = await db.driver.findMany({
      where,
      include: {
        restaurant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(drivers);
  } catch (err) {
    console.error("[DRIVERS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/drivers — Create driver
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, email, vehicleType, vehiclePlate, restaurantId } = body;

    if (!firstName || !lastName || !phone) {
      return error("firstName, lastName, and phone are required");
    }

    // Find restaurantId from first active restaurant if not provided
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId) {
      const restaurant = await db.restaurant.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!restaurant) {
        return error("No active restaurant found. Please provide a restaurantId.");
      }
      targetRestaurantId = restaurant.id;
    }

    const driver = await db.driver.create({
      data: {
        restaurantId: targetRestaurantId,
        firstName,
        lastName,
        phone,
        email: email || null,
        vehicleType: vehicleType || "motorcycle",
        vehiclePlate: vehiclePlate || null,
        isVerified: false,
        isActive: true,
        isAvailable: false,
        status: "offline",
      },
    });

    return success(driver, 201);
  } catch (err) {
    console.error("[DRIVERS POST]", err);
    return error("Internal server error", 500);
  }
}
