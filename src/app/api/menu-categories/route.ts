import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { checkAnyPermission } from "@/lib/rbac";
import { Permissions } from "@/lib/permissions";

// ============================================
// GET /api/menu-categories — List categories
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("menuId");

    const where: Record<string, unknown> = {};
    if (menuId) where.menuId = menuId;

    const categories = await db.menuCategory.findMany({
      where,
      include: {
        menu: {
          select: { id: true, name: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return success(categories);
  } catch (err) {
    console.error("[MENU CATEGORIES GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/menu-categories — Create category (RBAC)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const userOrError = await checkAnyPermission(req, [
      Permissions.MENU_CREATE,
      Permissions.MENU_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const body = await req.json();
    const { menuId, name, slug, description, icon, image, sortOrder } = body;

    if (!menuId || !name) {
      return error("menuId and name are required");
    }

    const catSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const category = await db.menuCategory.create({
      data: {
        menuId,
        name,
        slug: catSlug,
        description: description || null,
        icon: icon || null,
        image: image || null,
        isActive: true,
        sortOrder: sortOrder || 0,
      },
    });

    return success(category, 201);
  } catch (err: unknown) {
    console.error("[MENU CATEGORIES POST]", err);
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      return error("Une categorie avec ce nom existe deja dans ce menu", 409);
    }
    return error("Internal server error", 500);
  }
}

// ============================================
// PUT /api/menu-categories — Update category (RBAC)
// Body must include `id` plus any fields to update.
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const userOrError = await checkAnyPermission(req, [
      Permissions.MENU_UPDATE,
      Permissions.MENU_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return error("id is required");
    }

    // Build update data
    const data: Record<string, unknown> = {};
    const updatableFields = [
      "menuId", "name", "slug", "description", "icon", "image",
      "isActive", "sortOrder",
    ];

    for (const field of updatableFields) {
      if (field in fields) {
        data[field] = fields[field];
      }
    }

    // Auto-generate slug from name if name changed and slug not provided
    if (data.name && !data.slug) {
      data.slug = (data.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }

    const category = await db.menuCategory.update({
      where: { id },
      data,
      include: {
        menu: {
          select: { id: true, name: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return success(category);
  } catch (err: unknown) {
    console.error("[MENU CATEGORIES PUT]", err);
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2025") {
      return error("Category not found", 404);
    }
    if (prismaErr.code === "P2002") {
      return error("Une categorie avec ce nom existe deja dans ce menu", 409);
    }
    return error("Internal server error", 500);
  }
}

// ============================================
// DELETE /api/menu-categories?id=xxx — Delete a category (RBAC)
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const userOrError = await checkAnyPermission(req, [
      Permissions.MENU_DELETE,
      Permissions.MENU_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return error("id query parameter is required");
    }

    await db.menuCategory.delete({ where: { id } });

    return success({ deleted: true });
  } catch (err: unknown) {
    console.error("[MENU CATEGORIES DELETE]", err);
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2025") {
      return error("Category not found", 404);
    }
    return error("Internal server error", 500);
  }
}
