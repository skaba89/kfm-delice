import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/settings — Load platform settings
//
// Uses RestaurantSettings.notificationSettings Json field
// to store general platform config (general, notifications, security, appearance).
// Falls back to defaults if no restaurant/settings exist.
// ============================================
export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!restaurant) {
      return success({ settings: null });
    }

    const settings = await db.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id },
      select: { notificationSettings: true },
    });

    // Parse stored JSON or return null
    const stored = settings?.notificationSettings;
    let parsed = null;
    if (stored) {
      if (typeof stored === "string") {
        try { parsed = JSON.parse(stored); } catch { parsed = null; }
      } else if (typeof stored === "object") {
        parsed = stored;
      }
    }

    return success({ settings: parsed });
  } catch (err) {
    console.error("[SETTINGS GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// PUT /api/settings — Save platform settings
//
// Merges the provided settings into RestaurantSettings.notificationSettings.
// Creates RestaurantSettings row if it doesn't exist yet.
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings: newSettings } = body;

    if (!newSettings || typeof newSettings !== "object") {
      return error("Parametres invalides");
    }

    // Find active restaurant
    const restaurant = await db.restaurant.findFirst({
      where: { isActive: true },
    });

    if (!restaurant) {
      return error("Aucun restaurant trouve", 404);
    }

    // Upsert settings
    await db.restaurantSettings.upsert({
      where: { restaurantId: restaurant.id },
      create: {
        restaurantId: restaurant.id,
        notificationSettings: newSettings,
      },
      update: {
        notificationSettings: newSettings,
      },
    });

    return success({ saved: true, settings: newSettings });
  } catch (err) {
    console.error("[SETTINGS PUT]", err);
    return error("Erreur interne du serveur", 500);
  }
}
