import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/notifications/[id] — Mark as read
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isRead } = body;

    if (isRead === undefined) {
      return error("isRead field is required");
    }

    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) {
      return error("Notification not found", 404);
    }

    const updated = await db.notification.update({
      where: { id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });

    return success(updated);
  } catch (err) {
    console.error("[NOTIFICATIONS PATCH]", err);
    return error("Internal server error", 500);
  }
}
