import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/ingredients/[id] — Update ingredient
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return error("Ingredient not found", 404);
    }

    const updated = await db.ingredient.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.quantity !== undefined && { quantity: parseFloat(body.quantity) }),
        ...(body.costPerUnit !== undefined && { costPerUnit: body.costPerUnit ? parseFloat(body.costPerUnit) : null }),
        ...(body.lowStockThreshold !== undefined && { lowStockThreshold: parseFloat(body.lowStockThreshold) || 0 }),
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[INGREDIENT PATCH]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// DELETE /api/ingredients/[id] — Delete ingredient
// ============================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return error("Ingredient not found", 404);
    }

    await db.ingredient.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    console.error("[INGREDIENT DELETE]", err);
    return error("Internal server error", 500);
  }
}
