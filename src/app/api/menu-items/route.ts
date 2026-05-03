import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/menu-items — List menu items
// ============================================
export async function GET(req: NextRequest) {
  try {
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

    const items = await db.menuItem.findMany({
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
// POST /api/menu-items — Create menu item
// ============================================
export async function POST(req: NextRequest) {
  try {
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
// PUT /api/menu-items — Update an existing menu item
// Body must include `id` plus any fields to update.
// ============================================
export async function PUT(req: NextRequest) {
  try {
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
        if (field === "allergens" || field === "ingredientIds") {
          data[field] = fields[field] !== null && fields[field] !== undefined
            ? JSON.stringify(fields[field])
            : null;
        } else if (["price", "discountPrice", "costPrice", "rating"].includes(field)) {
          data[field] = fields[field] !== null && fields[field] !== undefined
            ? parseFloat(fields[field])
            : null;
        } else if (["calories", "prepTime", "spicyLevel", "quantity", "lowStockThreshold", "sortOrder"].includes(field)) {
          data[field] = fields[field] !== null && fields[field] !== undefined
            ? parseInt(fields[field])
            : null;
        } else {
          data[field] = fields[field];
        }
      }
    }

    // Auto-generate slug from name if name changed and slug not provided
    if (data.name && !data.slug) {
      data.slug = (data.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2025") {
      return error("Menu item not found", 404);
    }
    return error("Internal server error", 500);
  }
}

// ============================================
// DELETE /api/menu-items?id=xxx — Delete a menu item
// ============================================
export async function DELETE(req: NextRequest) {
  try {
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
