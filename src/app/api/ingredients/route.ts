import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/ingredients — List ingredients
// ============================================
export async function GET() {
  try {
    const ingredients = await db.ingredient.findMany({
      orderBy: { name: "asc" },
    });

    return success(ingredients);
  } catch (err) {
    console.error("[INGREDIENTS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/ingredients — Create ingredient
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, unit, quantity, costPerUnit, lowStockThreshold, restaurantId } = body;

    if (!name || !unit) {
      return error("name and unit are required");
    }

    // Use provided restaurantId or default to first active restaurant
    let restId = restaurantId;
    if (!restId) {
      const restaurant = await db.restaurant.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      restId = restaurant?.id;
    }

    if (!restId) {
      return error("No active restaurant found");
    }

    const ingredient = await db.ingredient.create({
      data: {
        restaurantId: restId,
        name,
        unit,
        quantity: parseFloat(quantity) || 0,
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
        lowStockThreshold: parseFloat(lowStockThreshold) || 0,
      },
    });

    return success(ingredient, 201);
  } catch (err) {
    console.error("[INGREDIENTS POST]", err);
    return error("Internal server error", 500);
  }
}
