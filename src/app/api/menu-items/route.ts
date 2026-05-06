import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { checkAnyPermission } from "@/lib/rbac";
import { Permissions } from "@/lib/permissions";
import { withRLS, buildRLSUser } from "@/lib/prisma-extensions";

// ============================================
// GET /api/menu-items — List menu items (RBAC + RLS)
// ============================================
export async function GET(req: NextRequest) {
  try {
    // All authenticated roles can read menu items
    const userOrError = await checkAnyPermission(req, [
      Permissions.MENU_READ,
      Permissions.MENU_MANAGE,
    ]);
    // Allow unauthenticated access for public menu browsing
    const isAuthenticated = !(userOrError instanceof globalThis.Response);
    const user = isAuthenticated ? userOrError : null;

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const available = searchParams.get("available");

    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (available === "true") where.isAvailable = true;

    // Apply RLS for authenticated non-customer users
    let queryDb = db;
    if (user) {
      const rlsUser = await buildRLSUser(user.id, user.role);
      queryDb = withRLS(db, rlsUser);
    }

    const items = await queryDb.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return success(items);
  } catch (err) {
    console.error("[MENU ITEMS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/menu-items — Create menu item (RBAC)
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Only roles that can create menu items
    const userOrError = await checkAnyPermission(req, [
      Permissions.MENU_CREATE,
      Permissions.MENU_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const body = await req.json();
    const {
      categoryId,
      name,
      slug,
      description,
      price,
      discountPrice,
      costPrice,
      prepTime,
      isAvailable,
      isFeatured,
      isPopular,
      isNew,
      itemType,
      isVegetarian,
      isVegan,
      isHalal,
      isSpicy,
      spicyLevel,
      calories,
      sortOrder,
      image,
      allergens,
    } = body;

    if (!categoryId || !name || price === undefined) {
      return error("categoryId, name, and price are required");
    }

    const itemSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const item = await db.menuItem.create({
      data: {
        categoryId,
        name,
        slug: itemSlug,
        description: description || null,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        prepTime: prepTime ? parseInt(prepTime) : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        isFeatured: isFeatured || false,
        isPopular: isPopular || false,
        isNew: isNew || false,
        itemType: itemType || "food",
        isVegetarian: isVegetarian || false,
        isVegan: isVegan || false,
        isHalal: isHalal || false,
        isSpicy: isSpicy || false,
        spicyLevel: spicyLevel || 0,
        calories: calories ? parseInt(calories) : null,
        sortOrder: sortOrder || 0,
        image: image || null,
        allergens: allergens ? JSON.stringify(allergens) : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return success(item, 201);
  } catch (err) {
    console.error("[MENU ITEMS POST]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// PUT /api/menu-items — Update an existing menu item (RBAC)
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

    // Build update data with proper type conversions
    const data: Record<string, unknown> = {};
    const updatableFields = [
      "categoryId", "name", "slug", "description", "image", "price",
      "discountPrice", "costPrice", "calories", "prepTime", "isAvailable",
      "isFeatured", "isPopular", "isNew", "itemType", "isVegetarian",
      "isVegan", "isHalal", "isGlutenFree", "isSpicy", "spicyLevel",
      "trackInventory", "quantity", "lowStockThreshold", "sortOrder",
      "rating", "allergens", "ingredientIds",
    ];

    for (const field of updatableFields) {
      if (field in fields) {
        const val = fields[field];
        if (val === undefined) continue;

        if (field === "allergens" || field === "ingredientIds") {
          data[field] = val !== null ? JSON.stringify(val) : null;
        } else if (["price", "discountPrice", "costPrice", "rating"].includes(field)) {
          const num = typeof val === "number" ? val : parseFloat(val);
          data[field] = val !== null && !isNaN(num) ? num : null;
        } else if (["calories", "prepTime", "spicyLevel", "quantity", "lowStockThreshold", "sortOrder"].includes(field)) {
          const num = typeof val === "number" ? val : parseInt(val, 10);
          data[field] = val !== null && !isNaN(num) ? num : null;
        } else {
          data[field] = val;
        }
      }
    }

    // Auto-generate slug from name if name changed and slug not provided
    if (data.name && !data.slug) {
      let slug = (data.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      // If categoryId is changing, ensure slug uniqueness in target category
      if (data.categoryId) {
        const existing = await db.menuItem.findFirst({
          where: { categoryId: data.categoryId as string, slug },
          select: { id: true },
        });
        if (existing && existing.id !== id) {
          // Append timestamp to make slug unique
          slug = `${slug}-${Date.now().toString(36)}`;
        }
      }
      data.slug = slug;
    } else if (data.categoryId && !data.slug && !data.name) {
      // Category changed but name/slug not changed — check slug uniqueness in new category
      const current = await db.menuItem.findUnique({
        where: { id },
        select: { slug: true },
      });
      if (current) {
        const existing = await db.menuItem.findFirst({
          where: { categoryId: data.categoryId as string, slug: current.slug },
          select: { id: true },
        });
        if (existing && existing.id !== id) {
          data.slug = `${current.slug}-${Date.now().toString(36)}`;
        }
      }
    }

    const item = await db.menuItem.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return success(item);
  } catch (err: unknown) {
    console.error("[MENU ITEMS PUT]", err);
    const prismaErr = err as { code?: string; meta?: Record<string, unknown> };
    if (prismaErr.code === "P2025") {
      return error("Menu item not found", 404);
    }
    if (prismaErr.code === "P2002") {
      const target = (prismaErr.meta?.target as string[]) || [];
      return error(`Un produit avec ce nom existe deja dans cette categorie (${target.join(", ")})`, 409);
    }
    return error("Internal server error", 500);
  }
}

// ============================================
// DELETE /api/menu-items?id=xxx — Delete a menu item (RBAC)
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

    await db.menuItem.delete({ where: { id } });

    return success({ deleted: true });
  } catch (err: unknown) {
    console.error("[MENU ITEMS DELETE]", err);
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2025") {
      return error("Menu item not found", 404);
    }
    return error("Internal server error", 500);
  }
}
