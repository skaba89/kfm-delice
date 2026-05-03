import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/customer/menu — Public menu for ordering
//
// Thin wrapper around the unified /api/menu logic.
// Guarantees the same data as all other consumers.
// Uses customer-appropriate defaults:
//   - menuType=main
//   - includeInactive=false (only available items)
//   - auto-discovers restaurant
// ============================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    // Auto-discover restaurant if no ID provided
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId) {
      const restaurant = await db.restaurant.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      targetRestaurantId = restaurant?.id ?? null;
    }

    if (!targetRestaurantId) {
      // Auto-setup: create default restaurant if DB is completely empty
      console.log("[CUSTOMER MENU] No restaurant found — running auto-setup...");
      try {
        targetRestaurantId = await autoSetup();
        if (!targetRestaurantId) {
          return success({ categories: [], restaurant: null });
        }
        console.log("[CUSTOMER MENU] Auto-setup completed successfully");
      } catch (setupErr) {
        console.error("[CUSTOMER MENU] Auto-setup failed:", setupErr);
        return success({ categories: [], restaurant: null });
      }
    }

    // Fetch active menus of type "main" for the restaurant
    const menus = await db.menu.findMany({
      where: {
        restaurantId: targetRestaurantId,
        isActive: true,
        menuType: "main",
      },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Flatten categories from all menus
    const categories = menus.flatMap((menu) =>
      menu.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          image: item.image,
          price: item.price,
          discountPrice: item.discountPrice,
          calories: item.calories,
          itemType: item.itemType,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          isHalal: item.isHalal,
          isGlutenFree: item.isGlutenFree,
          isSpicy: item.isSpicy,
          isFeatured: item.isFeatured,
          isNew: item.isNew,
          isPopular: item.isPopular,
          prepTime: item.prepTime,
          allergens: safeParseJson(item.allergens),
        })),
      }))
    );

    // Get restaurant info
    const restaurant = await db.restaurant.findUnique({
      where: { id: targetRestaurantId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        isOpen: true,
        deliveryFee: true,
        minOrderAmount: true,
      },
    });

    return success({
      restaurant: restaurant || null,
      categories,
    });
  } catch (err) {
    console.error("[CUSTOMER MENU GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}

// ============================================
// Helper: safely parse JSON fields
// ============================================
function safeParseJson(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ============================================
// Auto-Setup: Create default restaurant + menu + categories + items
// Runs only once when the database is completely empty
// (Duplicated from /api/menu to keep customer endpoint self-contained)
// ============================================
async function autoSetup(): Promise<string | null> {
  const existingCount = await db.restaurant.count();
  if (existingCount > 0) return null;

  const restaurant = await db.restaurant.create({
    data: {
      name: "KFM Delice",
      slug: "kfm-delice",
      description: "Restaurant africain — Cuisine guineenne authentique a Conakry",
      phone: "+224 622 00 00 00",
      email: "contact@kfmdelice.sn",
      address: "45 Rue Carnot",
      city: "Conakry",
      district: "Kaloum",
      isOpen: true,
      isActive: true,
      deliveryFee: 500,
      deliveryTime: 30,
      priceRange: 2,
      acceptsDelivery: true,
      acceptsTakeaway: true,
      acceptsDineIn: true,
      acceptsReservations: true,
      acceptsWalkins: true,
      hasWifi: true,
      cuisines: ["Guinean", "African", "West African", "Grills"],
    },
  });

  const menu = await db.menu.create({
    data: {
      restaurantId: restaurant.id,
      name: "Menu Principal",
      slug: "menu-principal",
      description: "Notre carte de plats traditionnels",
      menuType: "main",
      isActive: true,
    },
  });

  const categoryDefs = [
    { name: "Plats Traditionnels", slug: "plats-traditionnels", sortOrder: 0 },
    { name: "Grillades & Brochettes", slug: "grillades-brochettes", sortOrder: 1 },
    { name: "Accompagnements", slug: "accompagnements", sortOrder: 2 },
    { name: "Boissons", slug: "boissons", sortOrder: 3 },
    { name: "Desserts", slug: "desserts", sortOrder: 4 },
    { name: "Entrées & Salades", slug: "entrees-salades", sortOrder: 5 },
  ];

  const categories = await Promise.all(
    categoryDefs.map((def) =>
      db.menuCategory.create({
        data: { menuId: menu.id, name: def.name, slug: def.slug, sortOrder: def.sortOrder, isActive: true },
      })
    )
  );

  const itemDefs: Record<string, { name: string; slug: string; price: number; description: string; itemType: string; image: string | null }[]> = {
    "Plats Traditionnels": [
      { name: "Thiep bou dien", slug: "thiep-bou-dien", price: 3500, description: "Riz au poisson assaisonné aux légumes", itemType: "food", image: "/images/menu/thieboudienne.png" },
      { name: "Yassa poulet", slug: "yassa-poulet", price: 3000, description: "Poulet mariné aux oignons et citron", itemType: "food", image: "/images/menu/yassa-poulet.png" },
      { name: "Mafé", slug: "mafe", price: 3000, description: "Sauce à base de pâte d'arachide", itemType: "food", image: "/images/menu/mafe.png" },
    ],
    "Grillades & Brochettes": [
      { name: "Poulet braisé", slug: "poulet-brase", price: 2500, description: "Poulet entier braisé aux épices", itemType: "food", image: "/images/menu/poulet-brase.png" },
      { name: "Brochette de boeuf", slug: "brochette-boeuf", price: 2000, description: "Brochette de boeuf mariné", itemType: "food", image: "/images/menu/brochette-boeuf.png" },
      { name: "Poisson grillé", slug: "poisson-grille", price: 3500, description: "Poisson entier grillé au citron", itemType: "food", image: "/images/menu/poisson-grille.png" },
    ],
    "Accompagnements": [
      { name: "Riz blanc", slug: "riz-blanc", price: 500, description: "Riz blanc cuit", itemType: "side", image: "/images/menu/riz-blanc.png" },
      { name: "Alloco", slug: "alloco", price: 700, description: "Beignets de banane plantain", itemType: "side", image: "/images/menu/alloco.png" },
    ],
    "Boissons": [
      { name: "Bissap", slug: "bissap", price: 500, description: "Jus d'hibiscus glacé", itemType: "drink", image: "/images/menu/bissap.png" },
      { name: "Gingembre", slug: "gingembre", price: 500, description: "Jus de gingembre frais", itemType: "drink", image: "/images/menu/gingembre.png" },
      { name: "Ataya", slug: "ataya", price: 500, description: "Thé à la menthe traditionnel", itemType: "drink", image: "/images/menu/ataya.png" },
    ],
    "Desserts": [
      { name: "Thiakry", slug: "thiakry", price: 1000, description: "Semoule de mil au lait concentré", itemType: "dessert", image: "/images/menu/thiakry.png" },
      { name: "Banane flambée", slug: "banane-flambee", price: 1500, description: "Banane plantain flambée au rhum", itemType: "dessert", image: "/images/menu/banane-flambee.png" },
    ],
    "Entrées & Salades": [
      { name: "Salade guineenne", slug: "salade-guineenne", price: 1500, description: "Salade fraiche aux tomates et oignons", itemType: "food", image: "/images/menu/salade-guineenne.png" },
      { name: "Accra", slug: "accra", price: 1000, description: "Beignets de poissons ou légumes", itemType: "food", image: "/images/menu/accra.png" },
    ],
  };

  for (const [catName, items] of Object.entries(itemDefs)) {
    const category = categories.find((c) => c.name === catName);
    if (!category) continue;
    await Promise.all(
      items.map((item, idx) =>
        db.menuItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            price: item.price,
            itemType: item.itemType,
            image: item.image,
            isAvailable: true,
            isPopular: idx === 0,
            sortOrder: idx,
          },
        })
      )
    );
  }

  console.log(`[CUSTOMER AUTO-SETUP] Created restaurant "${restaurant.name}" (${restaurant.id})`);
  return restaurant.id;
}
