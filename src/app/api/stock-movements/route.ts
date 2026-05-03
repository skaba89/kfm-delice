import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/stock-movements — List stock movements
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ingredientId = searchParams.get("ingredientId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (ingredientId) where.ingredientId = ingredientId;

    const movements = await db.stockMovement.findMany({
      where,
      include: {
        ingredient: {
          select: { id: true, name: true, unit: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return success(movements);
  } catch (err) {
    console.error("[STOCK MOVEMENTS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/stock-movements — Create stock movement
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredientId, type, quantity, notes, referenceType, referenceId } = body;

    if (!ingredientId || !type || !quantity) {
      return error("ingredientId, type, and quantity are required");
    }

    const validTypes = ["in", "out", "adjustment", "waste"];
    if (!validTypes.includes(type)) {
      return error("Invalid movement type. Must be: in, out, adjustment, waste");
    }

    // Get current ingredient
    const ingredient = await db.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return error("Ingredient not found", 404);
    }

    const movementQty = parseFloat(quantity);
    if (isNaN(movementQty) || movementQty <= 0) {
      return error("Quantity must be a positive number");
    }

    const previousQty = ingredient.quantity;
    let newQty: number;

    switch (type) {
      case "in":
        newQty = previousQty + movementQty;
        break;
      case "out":
      case "waste":
        newQty = Math.max(0, previousQty - movementQty);
        break;
      case "adjustment":
        newQty = movementQty; // adjustment sets the absolute value
        break;
      default:
        newQty = previousQty;
    }

    // Create stock movement and update ingredient in a transaction
    await db.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          restaurantId: ingredient.restaurantId,
          ingredientId,
          type,
          quantity: movementQty,
          unit: ingredient.unit,
          previousQty,
          newQty,
          referenceType: referenceType || null,
          referenceId: referenceId || null,
          notes: notes || null,
        },
      });

      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { quantity: newQty },
      });
    });

    // Return updated ingredient
    const updated = await db.ingredient.findUnique({
      where: { id: ingredientId },
    });

    return success(updated);
  } catch (err) {
    console.error("[STOCK MOVEMENTS POST]", err);
    return error("Internal server error", 500);
  }
}
