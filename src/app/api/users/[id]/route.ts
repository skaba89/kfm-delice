import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { checkAnyPermission } from "@/lib/rbac";
import { Permissions } from "@/lib/permissions";

// ============================================
// PUT /api/users/[id] — Update user (RBAC)
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only roles that can update users
    const userOrError = await checkAnyPermission(req, [
      Permissions.USERS_UPDATE,
      Permissions.USERS_MANAGE,
      Permissions.HR_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

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
// DELETE /api/users/[id] — Soft-delete user (RBAC)
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only roles that can delete users
    const userOrError = await checkAnyPermission(req, [
      Permissions.USERS_DELETE,
      Permissions.USERS_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

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
