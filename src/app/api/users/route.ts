import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import bcrypt from "bcryptjs";

// ============================================
// GET /api/users — List users with pagination, search, role filter
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Role filter
    if (role) where.role = role;

    // Status filter (active/locked)
    if (status === "active") {
      where.isActive = true;
      where.isLocked = false;
    } else if (status === "locked") {
      where.isLocked = true;
    }

    // Search by email or name
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return success({ users, total });
  } catch (err) {
    console.error("[USERS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/users — Create user (admin)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone, role } = body;

    if (!email || !password) {
      return error("Email and password are required");
    }

    // Check for existing user
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return error("A user with this email already exists", 409);
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hash,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        role: role || "CUSTOMER",
        isActive: true,
        isLocked: false,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(user, 201);
  } catch (err) {
    console.error("[USERS POST]", err);
    return error("Internal server error", 500);
  }
}
