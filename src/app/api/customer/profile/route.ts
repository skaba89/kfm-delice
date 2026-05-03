import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { verifyToken } from "@/lib/auth";

// ============================================
// GET /api/customer/profile — Get customer profile
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

    const profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
      include: {
        restaurant: {
          select: { id: true, name: true, address: true, city: true, phone: true, isOpen: true },
        },
      },
    });

    if (!profile) {
      // Return basic info from user record even if no customer profile yet
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: { firstName: true, lastName: true, email: true, phone: true, createdAt: true },
      });

      if (user) {
        return success({
          id: null,
          userId: payload.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || "",
          email: user.email,
          avatar: null,
          dietaryPreferences: [],
          allergies: [],
          addresses: [],
          totalOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          lastOrderAt: null,
          loyaltyPoints: 0,
          loyaltyLevel: 0,
          isVip: false,
          createdAt: user.createdAt,
          isNewUser: true,
        });
      }

      return error("Profil client introuvable", 404);
    }

    return success({
      id: profile.id,
      userId: profile.userId,
      restaurantId: profile.restaurantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      email: profile.email,
      avatar: profile.avatar,
      dietaryPreferences: profile.dietaryPreferences
        ? JSON.parse(profile.dietaryPreferences as string)
        : [],
      allergies: profile.allergies ? JSON.parse(profile.allergies as string) : [],
      addresses: profile.addresses ? JSON.parse(profile.addresses as string) : [],
      totalOrders: profile.totalOrders,
      totalSpent: profile.totalSpent,
      avgOrderValue: profile.avgOrderValue,
      lastOrderAt: profile.lastOrderAt,
      loyaltyPoints: profile.loyaltyPoints,
      loyaltyLevel: profile.loyaltyLevel,
      isVip: profile.isVip,
      createdAt: profile.createdAt,
      restaurant: profile.restaurant,
    });
  } catch (err) {
    console.error("[CUSTOMER PROFILE GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// PATCH /api/customer/profile — Update customer profile
// ============================================
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();

    // Find or create customer profile
    let profile = await db.customerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile) {
      // Auto-create profile for users who don't have one yet
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
          firstName: body.firstName || null,
          lastName: body.lastName || "",
          phone: body.phone || "",
          email: body.email || null,
        },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.dietaryPreferences !== undefined)
      updateData.dietaryPreferences = JSON.stringify(body.dietaryPreferences);
    if (body.allergies !== undefined)
      updateData.allergies = JSON.stringify(body.allergies);
    if (body.addresses !== undefined)
      updateData.addresses = JSON.stringify(body.addresses);

    const updated = await db.customerProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    // Also update the user record if name/phone/email changed
    await db.user.update({
      where: { id: payload.userId },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
      },
    });

    return success({
      id: updated.id,
      userId: updated.userId,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      email: updated.email,
      avatar: updated.avatar,
      dietaryPreferences: updated.dietaryPreferences
        ? JSON.parse(updated.dietaryPreferences as string)
        : [],
      allergies: updated.allergies ? JSON.parse(updated.allergies as string) : [],
      addresses: updated.addresses ? JSON.parse(updated.addresses as string) : [],
      totalOrders: updated.totalOrders,
      totalSpent: updated.totalSpent,
      avgOrderValue: updated.avgOrderValue,
      lastOrderAt: updated.lastOrderAt,
      loyaltyPoints: updated.loyaltyPoints,
      loyaltyLevel: updated.loyaltyLevel,
      isVip: updated.isVip,
    });
  } catch (err) {
    console.error("[CUSTOMER PROFILE PATCH]", err);
    return error("Erreur interne du serveur", 500);
  }
}
