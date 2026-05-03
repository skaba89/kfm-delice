import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// PATCH /api/deliveries/[id]/status — Update delivery status
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, driverId } = body;

    if (!status) {
      return error("Status is required");
    }

    const delivery = await db.delivery.findUnique({ where: { id } });
    if (!delivery) {
      return error("Delivery not found", 404);
    }

    const updateData: Record<string, unknown> = { status };

    // Set timestamp fields based on status
    if (status === "DRIVER_ARRIVED_PICKUP") updateData.driverArrivedAt = new Date();
    if (status === "PICKED_UP") updateData.pickedUpAt = new Date();
    if (status === "DELIVERED") updateData.deliveredAt = new Date();
    if (status === "FAILED") updateData.failedAt = new Date();

    // Assign driver if provided
    if (driverId) {
      updateData.driverId = driverId;
      updateData.assignedAt = new Date();
    }

    const updated = await db.delivery.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    // If delivered, also update order status
    if (status === "DELIVERED") {
      await db.order.update({
        where: { id: delivery.orderId },
        data: { status: "DELIVERED" },
      });
    }

    return success(updated);
  } catch (err) {
    console.error("[DELIVERY STATUS PATCH]", err);
    return error("Internal server error", 500);
  }
}
