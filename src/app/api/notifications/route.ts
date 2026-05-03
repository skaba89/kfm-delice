import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/notifications — List notifications
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const isRead = searchParams.get("isRead");

    const where: Record<string, unknown> = {};

    // Filter by userId
    if (userId) where.userId = userId;

    // Filter by read status
    if (isRead !== null && isRead !== undefined && isRead !== "") {
      where.isRead = isRead === "true";
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return success(notifications);
  } catch (err) {
    console.error("[NOTIFICATIONS GET]", err);
    return error("Internal server error", 500);
  }
}
