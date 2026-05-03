import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { generateOrderNumber } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";
import { emitToRoom } from "@/lib/socket-server";
import { checkAnyPermission } from "@/lib/rbac";
import { Permissions } from "@/lib/permissions";
import { withRLS, buildRLSUser } from "@/lib/prisma-extensions";

// ============================================
// GET /api/orders — List orders with filters (RBAC + RLS)
// ============================================
export async function GET(req: NextRequest) {
  try {
    // RBAC check — any role that can read orders
    const userOrError = await checkAnyPermission(req, [
      Permissions.ORDERS_READ,
      Permissions.ORDERS_MANAGE,
      Permissions.KITCHEN_ACCESS,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.orderType = type;
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { orderNumber: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    // Apply RLS — scope orders to user's restaurant / own data
    const rlsUser = await buildRLSUser(userOrError.id, userOrError.role);
    const secureDb = withRLS(db, rlsUser);

    const [orders, total] = await Promise.all([
      secureDb.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          payments: { take: 1 },
          delivery: {
            include: {
              driver: {
                select: { id: true, firstName: true, lastName: true, phone: true },
              },
            },
          },
        },
      }),
      secureDb.order.count({ where }),
    ]);

    return success({ orders, total, page, limit });
  } catch (err) {
    console.error("[ORDERS GET]", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// POST /api/orders — Create new order (RBAC)
// ============================================
export async function POST(req: NextRequest) {
  try {
    // RBAC check — roles that can create orders
    const userOrError = await checkAnyPermission(req, [
      Permissions.ORDERS_CREATE,
      Permissions.ORDERS_MANAGE,
      Permissions.POS_ACCESS,
    ]);
    if (userOrError instanceof globalThis.Response) return userOrError;

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      orderType = "DINE_IN",
      items,
      tableNumber,
      deliveryAddress,
      deliveryCity,
      deliveryDistrict,
      deliveryNotes,
      notes,
    } = body;

    // Validation
    if (!customerName || !customerPhone) {
      return error("Customer name and phone are required");
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return error("At least one item is required");
    }

    // Get restaurant (use first active restaurant, or user's assigned restaurant)
    const rlsUser = await buildRLSUser(userOrError.id, userOrError.role);
    const restaurant = rlsUser.restaurantId
      ? await db.restaurant.findFirst({
          where: { id: rlsUser.restaurantId, isActive: true },
        })
      : await db.restaurant.findFirst({
          where: { isActive: true },
        });

    if (!restaurant) {
      return error("No active restaurant found");
    }

    // Fetch menu items and calculate totals
    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    let subtotal = 0;
    const orderItemsData = items.map((item: { menuItemId: string; quantity: number; notes?: string }) => {
      const mi = menuItemMap.get(item.menuItemId);
      if (!mi) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }
      // Use discount price if available
      const unitPrice = mi.discountPrice && mi.discountPrice < mi.price ? mi.discountPrice : mi.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return {
        menuItemId: item.menuItemId,
        itemName: mi.name,
        itemImage: mi.image,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        notes: item.notes || null,
      };
    });

    const deliveryFee =
      orderType === "DELIVERY" ? restaurant.deliveryFee : 0;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax + deliveryFee;

    const orderNumber = generateOrderNumber();

    const order = await db.order.create({
      data: {
        restaurantId: restaurant.id,
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        orderType,
        source: body.source || "web",
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        tax,
        total,
        deliveryFee,
        deliveryAddress: deliveryAddress || null,
        deliveryCity: deliveryCity || null,
        deliveryDistrict: deliveryDistrict || null,
        deliveryNotes: deliveryNotes || null,
        tableNumber: tableNumber || null,
        notes: notes || null,
        items: { create: orderItemsData },
        statusHistory: {
          create: {
            status: "PENDING",
            notes: "Commande créée",
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Notify staff about new order
    const staffUsers = await db.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "KITCHEN", "STAFF"] }, isActive: true, isLocked: false },
      select: { id: true },
    });

    await Promise.all(
      staffUsers.map((u) =>
        createNotification({
          userId: u.id,
          restaurantId: restaurant.id,
          title: "Nouvelle commande",
          message: `Commande ${orderNumber} — ${customerName} — ${formatCurrency(total)}`,
          type: "ORDER_UPDATE",
          data: { orderId: order.id, orderNumber },
        })
      )
    );

    // Emit WebSocket events for real-time notifications
    try {
      emitToRoom("new-order", "kitchen", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        orderType: orderType,
      });
      emitToRoom("new-order", "admin", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        orderType: orderType,
      });
    } catch {
      // WebSocket not available — fallback to polling
    }

    return success(order, 201);
  } catch (err) {
    console.error("[ORDERS POST]", err);
    return error(err instanceof Error ? err.message : "Internal server error", 500);
  }
}
