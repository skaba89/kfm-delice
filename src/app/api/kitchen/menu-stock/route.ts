import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/kitchen/menu-stock — Menu items with stock info
// ============================================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return error("Authentification requise", 401);
    }

    const { verifyToken } = await import("@/lib/auth");
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return error("Token invalide ou expire", 401);
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return error("Utilisateur invalide", 401);
    }

    if (user.role !== "KITCHEN") {
      return error("Acces non autorise", 403);
    }

    const menuItems = await db.menuItem.findMany({
      where: {},
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });

    const formatted = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      prepTime: item.prepTime,
      isAvailable: item.isAvailable,
      itemType: item.itemType,
      image: item.image,
      category: item.category.name,
      categoryId: item.category.id,
      trackInventory: item.trackInventory,
      quantity: item.trackInventory ? item.quantity : null,
      lowStockThreshold: item.trackInventory ? item.lowStockThreshold : null,
    }));

    // Group by category
    const grouped: Record<string, typeof formatted> = {};
    for (const item of formatted) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    return success({
      items: formatted,
      grouped,
    });
  } catch (err) {
    console.error("[KITCHEN MENU STOCK GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
