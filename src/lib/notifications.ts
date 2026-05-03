import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  restaurantId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown> | null;
}

/**
 * Create a notification for a user.
 */
export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      restaurantId: input.restaurantId ?? null,
      title: input.title,
      message: input.message,
      type: input.type,
      data: input.data ? JSON.parse(JSON.stringify(input.data)) : undefined,
    },
  });
}
