import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { verifyToken } from "@/lib/auth";

// ============================================
// GET /api/customer/orders — Get customer orders
// ============================================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Find customer profile by userId
    const profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile) {
      // If no customer profile exists yet, return empty orders
      return success({
        orders: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Build status filter
    let statusIn: string[] | undefined;
    if (statusFilter === "active") {
      statusIn = [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
      ];
    } else if (statusFilter === "completed") {
      statusIn = ["COMPLETED", "DELIVERED", "CANCELLED", "REFUNDED"];
    }

    const whereClause: Record<string, unknown> = {
      customerId: profile.id,
      ...(statusIn ? { status: { in: statusIn } } : {}),
    };

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: whereClause,
        include: {
          items: {
            select: {
              id: true,
              itemName: true,
              itemImage: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where: whereClause }),
    ]);

    return success({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        orderType: o.orderType,
        status: o.status,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        discount: o.discount,
        tax: o.tax,
        deliveryFee: o.deliveryFee,
        total: o.total,
        deliveryAddress: o.deliveryAddress,
        deliveryCity: o.deliveryCity,
        createdAt: o.createdAt,
        completedAt: o.completedAt,
        itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        items: o.items,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[CUSTOMER ORDERS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// POST /api/customer/orders — Place new order (authenticated)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    // Verify user is still active
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, isLocked: true },
    });
    if (!user || !user.isActive || user.isLocked) {
      return error("Compte inactif ou bloque", 403);
    }

    const body = await req.json();
    const { items, orderType, deliveryAddress, deliveryCity, deliveryDistrict, deliveryNotes, notes, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return error("La commande doit contenir au moins un article", 400);
    }

    if (!orderType || !["DINE_IN", "TAKEAWAY", "DELIVERY", "DRIVE_THRU"].includes(orderType)) {
      return error("Type de commande invalide", 400);
    }

    // Find or create customer profile for this user
    let profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
      include: { restaurant: true },
    });

    if (!profile) {
      // Auto-create a customer profile for a newly registered user
      const restaurant = await db.restaurant.findFirst({
        where: { isActive: true },
      });
      if (!restaurant) {
        return error("Aucun restaurant configure", 500);
      }
      profile = await db.customerProfile.create({
        data: {
          userId: payload.userId,
          restaurantId: restaurant.id,
          firstName: null,
          lastName: "",
          phone: "",
          totalOrders: 0,
          totalSpent: 0,
        },
        include: { restaurant: true },
      });
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const deliveryFee = orderType === "DELIVERY" ? (profile.restaurant.deliveryFee || 0) : 0;
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% VAT
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    // Generate order number
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const orderNumber = `CMD-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        restaurantId: profile.restaurantId,
        customerId: profile.id,
        customerName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.phone || user.id,
        customerPhone: profile.phone,
        customerEmail: profile.email,
        orderType,
        source: "web",
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        deliveryFee,
        tax,
        total,
        deliveryAddress: deliveryAddress || null,
        deliveryCity: deliveryCity || null,
        deliveryDistrict: deliveryDistrict || null,
        deliveryNotes: deliveryNotes || null,
        notes: notes || null,
        loyaltyPointsEarned: Math.floor(total / 100),
        items: {
          create: items.map(
            (item: { menuItemId?: string; name: string; price: number; quantity: number; image?: string; variant?: string; options?: string }) => ({
              menuItemId: item.menuItemId || null,
              itemName: item.name,
              itemImage: item.image || null,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              variantName: item.variant || null,
              options: item.options ? JSON.parse(item.options) : undefined,
            })
          ),
        },
        statusHistory: {
          create: {
            status: "PENDING",
            notes: "Commande creee par le client",
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Update customer profile stats
    await db.customerProfile.update({
      where: { id: profile.id },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: total },
        avgOrderValue: (profile.totalSpent + total) / (profile.totalOrders + 1),
        lastOrderAt: new Date(),
        loyaltyPoints: { increment: Math.floor(total / 100) },
      },
    });

    // Update user's lastLoginAt to reflect activity
    await db.user.update({
      where: { id: payload.userId },
      data: { lastLoginAt: new Date() },
    });

    return success({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    }, 201);
  } catch (err) {
    console.error("[CUSTOMER ORDERS POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}
