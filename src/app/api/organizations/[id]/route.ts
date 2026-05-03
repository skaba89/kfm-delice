import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// DELETE /api/organizations/[id] — Delete restaurant
// ============================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.restaurant.findUnique({ where: { id } });
    if (!existing) {
      return error("Restaurant not found", 404);
    }

    await db.restaurant.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    console.error("[ORGANIZATIONS DELETE]", err);
    return error("Internal server error", 500);
  }
}
