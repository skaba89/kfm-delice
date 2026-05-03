import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/expenses — List expenses
// ============================================
export async function GET(req: NextRequest) {
  try {
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

    const expenses = await db.expense.findMany({
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
// POST /api/expenses — Create expense
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, amount, title, description, date, paymentMethod, supplierName, notes } = body;

    if (!amount || !date) {
      return error("amount and date are required");
    }

    // Use provided restaurantId or default to first active restaurant
    const restaurant = await db.restaurant.findFirst({
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
        category: categoryType as any,
        description: description || "",
        amount: parseFloat(amount),
        date: new Date(date),
        paymentMethod: paymentMethod || null,
        supplierName: supplierName || null,
        notes: notes || null,
        status: "pending",
      },
    });

    return success(expense, 201);
  } catch (err) {
    console.error("[EXPENSES POST]", err);
    return error("Internal server error", 500);
  }
}
