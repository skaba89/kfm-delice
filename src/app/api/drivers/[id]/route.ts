import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/drivers/[id] — Update driver status/availability
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, isAvailable, isActive } = body;

    if (status === undefined && isAvailable === undefined && isActive === undefined) {
      return error("At least one field (status, isAvailable, isActive) is required");
    }

    const existing = await db.driver.findUnique({ where: { id } });
    if (!existing) {
      return error("Driver not found", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      updateData.status = status;
    }
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updated = await db.driver.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: { name: true },
        },
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[DRIVERS PATCH]", err);
    return error("Internal server error", 500);
  }
}
