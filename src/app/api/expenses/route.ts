import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { checkAnyPermission } from "@/lib/rbac";
import { Permissions } from "@/lib/permissions";
import { withRLS, buildRLSUser } from "@/lib/prisma-extensions";

// ============================================
// GET /api/expenses — List expenses (RBAC + RLS)
// ============================================
export async function GET(req: NextRequest) {
  try {
    // Only roles that can read expenses
    const userOrError = await checkAnyPermission(req, [
      Permissions.EXPENSES_READ,
      Permissions.EXPENSES_MANAGE,
      Permissions.REPORTS_VIEW,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    // Apply RLS — scope to user's restaurant
    const rlsUser = await buildRLSUser(userOrError.id, userOrError.role);
    const secureDb = withRLS(db, rlsUser);

    const expenses = await secureDb.expense.findMany({
      where,
      include: {
        categoryRelation: {
          select: { id: true, name: true, type: true, color: true, icon: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return success(expenses);
  } catch (err) {
    console.error("[EXPENSES GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/expenses — Create expense (RBAC)
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Only roles that can create expenses
    const userOrError = await checkAnyPermission(req, [
      Permissions.EXPENSES_CREATE,
      Permissions.EXPENSES_MANAGE,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const body = await req.json();
    const { categoryId, amount, title, description, date, paymentMethod, supplierName, notes } = body;

    if (!amount || !date) {
      return error("amount and date are required");
    }

    // Resolve user's restaurant
    const rlsUser = await buildRLSUser(userOrError.id, userOrError.role);
    const restaurant = rlsUser.restaurantId
      ? await db.restaurant.findFirst({
          where: { id: rlsUser.restaurantId, isActive: true },
          select: { id: true },
        })
      : await db.restaurant.findFirst({
          where: { isActive: true },
          select: { id: true },
        });

    if (!restaurant) {
      return error("No active restaurant found");
    }

    // Get category type if categoryId provided
    let categoryType = "other";
    if (categoryId) {
      const cat = await db.expenseCategory.findUnique({
        where: { id: categoryId },
        select: { type: true },
      });
      if (cat) categoryType = cat.type;
    }

    const expense = await db.expense.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categoryId || null,
        title: title || null,
        category: categoryType as "other",
        description: description || "",
        amount: parseFloat(amount),
        date: new Date(date),
        paymentMethod: paymentMethod || null,
        supplierName: supplierName || null,
        notes: notes || null,
        status: "pending",
        createdById: userOrError.id,
      },
    });

    return success(expense, 201);
  } catch (err) {
    console.error("[EXPENSES POST]", err);
    return error("Internal server error", 500);
  }
}
