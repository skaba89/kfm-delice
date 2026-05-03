import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PUT /api/users/[id] — Update user
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { firstName, lastName, phone, role, isActive, isLocked } = body;

    const user = await db.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(isLocked !== undefined && { isLocked }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(user);
  } catch (err) {
    console.error("[USERS PUT]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// DELETE /api/users/[id] — Soft-delete user
// ============================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return success({ deleted: true });
  } catch (err) {
    console.error("[USERS DELETE]", err);
    return error("Internal server error", 500);
  }
}
