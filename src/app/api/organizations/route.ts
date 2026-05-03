import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/organizations — List restaurants
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Search by name or city
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [restaurants, total] = await Promise.all([
      db.restaurant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.restaurant.count({ where }),
    ]);

    return success({ restaurants, total });
  } catch (err) {
    console.error("[ORGANIZATIONS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/organizations — Create restaurant
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, address, city, district, phone, email, description } = body;

    if (!name || !address || !city || !phone) {
      return error("name, address, city, and phone are required");
    }

    // Auto-generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Check for slug uniqueness
    const existingSlug = await db.restaurant.findUnique({
      where: { slug: finalSlug },
    });

    if (existingSlug) {
      return error("A restaurant with this slug already exists", 409);
    }

    const restaurant = await db.restaurant.create({
      data: {
        name,
        slug: finalSlug,
        address,
        city,
        district: district || null,
        phone,
        email: email || null,
        description: description || null,
      },
    });

    return success(restaurant, 201);
  } catch (err) {
    console.error("[ORGANIZATIONS POST]", err);
    return error("Internal server error", 500);
  }
}
