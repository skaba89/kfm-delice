import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// POST /api/public/orders — Guest order (no auth)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      orderType,
      deliveryAddress,
      deliveryCity,
      deliveryDistrict,
      deliveryNotes,
      notes,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      return error("Le nom est requis");
    }
    if (!customerPhone || !customerPhone.trim()) {
      return error("Le numero de telephone est requis");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return error("La commande doit contenir au moins un article");
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.name || item.price === undefined || !item.quantity || item.quantity < 1) {
        return error("Chaque article doit avoir un nom, un prix et une quantite valide");
      }
    }

    // Get restaurant
    const restaurant = await db.restaurant.findFirst({
      where: { isActive: true },
    });
    if (!restaurant) {
      return error("Aucun restaurant configure", 500);
    }

    // --- Server-side price validation ---
    // Fetch menu items from DB to prevent client-controlled pricing
    const menuItemIds = items
      .map((item: { menuItemId?: string }) => item.menuItemId)
      .filter((id: string | undefined): id is string => !!id);

    const menuItemsFromDb = menuItemIds.length > 0
      ? await db.menuItem.findMany({
          where: { id: { in: menuItemIds } },
          select: { id: true, price: true, discountPrice: true },
        })
      : [];

    const menuItemPriceMap = new Map(
      menuItemsFromDb.map((mi) => [
        mi.id,
        mi.discountPrice !== null && mi.discountPrice !== undefined && mi.discountPrice >= 0
          ? mi.discountPrice
          : mi.price,
      ])
    );

    // Validate prices: if DB price is available and differs from client price by >5%, use DB price
    const validatedItems = items.map(
      (item: { menuItemId?: string; name: string; price: number; quantity: number; image?: string; variant?: string; options?: string }) => {
        let serverPrice = item.price; // default to client price
        if (item.menuItemId && menuItemPriceMap.has(item.menuItemId)) {
          const dbPrice = menuItemPriceMap.get(item.menuItemId)!;
          if (item.price <= 0) {
            // Client sent zero/negative price — always use DB price
            serverPrice = dbPrice;
          } else {
            const diffRatio = Math.abs(item.price - dbPrice) / dbPrice;
            if (diffRatio > 0.05) {
              // Client price differs from DB price by more than 5% — use DB price
              serverPrice = dbPrice;
            }
          }
        }
        return { ...item, serverPrice };
      }
    );

    // Calculate totals server-side using validated prices
    const subtotal = validatedItems.reduce(
      (sum: number, item: { serverPrice: number; quantity: number }) =>
        sum + item.serverPrice * item.quantity,
      0
    );
    const isDelivery = orderType === "DELIVERY";
    const deliveryFee = isDelivery ? (restaurant.deliveryFee || 0) : 0;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    // Generate order number
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const orderNumber = `CMD-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    // Find or create CustomerProfile from phone
    let customerId: string | undefined;
    const existingCustomer = await db.customerProfile.findFirst({
      where: { phone: customerPhone.trim(), restaurantId: restaurant.id },
    });
    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update stats
      await db.customerProfile.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          firstName: customerName.trim().split(" ")[0] || existingCustomer.firstName,
          lastName: customerName.trim().split(" ").slice(1).join(" ") || existingCustomer.lastName,
          email: customerEmail?.trim() || existingCustomer.email,
          lastOrderAt: now,
          loyaltyPoints: { increment: Math.floor(total / 100) },
        },
      });
    } else {
      // Create new customer profile
      const newCustomer = await db.customerProfile.create({
        data: {
          restaurantId: restaurant.id,
          firstName: customerName.trim().split(" ")[0] || "",
          lastName: customerName.trim().split(" ").slice(1).join(" ") || "",
          phone: customerPhone.trim(),
          email: customerEmail?.trim() || null,
          totalOrders: 1,
          totalSpent: total,
          avgOrderValue: total,
          lastOrderAt: now,
          loyaltyPoints: Math.floor(total / 100),
        },
      });
      customerId = newCustomer.id;
    }

    // Create the order
    const order = await db.order.create({
      data: {
        restaurantId: restaurant.id,
        orderNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerId,
        orderType: orderType || "TAKEAWAY",
        status: "PENDING",
        paymentStatus: paymentMethod === "cash" ? "PENDING" : "PENDING",
        subtotal,
        deliveryFee,
        tax,
        total,
        deliveryAddress: deliveryAddress || null,
        deliveryCity: deliveryCity || null,
        deliveryDistrict: deliveryDistrict || null,
        deliveryNotes: deliveryNotes || null,
        notes: notes || null,
        source: "online",
        items: {
          create: validatedItems.map(
            (item: {
              menuItemId?: string;
              name: string;
              price: number;
              serverPrice: number;
              quantity: number;
              image?: string;
              variant?: string;
              options?: string;
            },
            idx: number
          ) => ({
              id: `${orderNumber}-item-${idx}`,
              menuItemId: item.menuItemId || null,
              itemName: item.name,
              quantity: item.quantity,
              unitPrice: item.serverPrice,
              totalPrice: item.serverPrice * item.quantity,
            })
          ),
        },
      },
    });

    // Create initial status history
    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "PENDING",
        notes: "Commande recue en ligne",
      },
    });

    // NOTE: Payment record is created by /api/payments/intent during checkout step 2.
    // We do NOT create it here to avoid duplicate payments.

    return success(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        tax: order.tax,
        estimatedTime: restaurant.deliveryTime || 30,
        createdAt: order.createdAt,
        message: "Commande enregistree avec succes !",
      },
      201
    );
  } catch (err) {
    console.error("[PUBLIC ORDER POST]", err);
    return error("Erreur interne du serveur", 500);
  }
}
