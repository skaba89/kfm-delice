import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/menu — SINGLE SOURCE OF TRUTH
//
// Unified menu endpoint for all consumers:
//   - POS view
//   - Admin menu view
//   - Admin products page
//   - Customer menu page (via /api/customer/menu wrapper)
//
// Query params:
//   ?restaurantId=xxx   — filter by restaurant (auto-discovers if omitted)
//   ?menuType=main      — filter menu type (defaults to "main")
//   ?includeInactive=true — include unavailable items and inactive categories
//
// Response:
//   { success: true, data: { categories: CategoryWithItems[], restaurant?: RestaurantInfo } }
// ============================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const menuType = searchParams.get("menuType") || "main";
    const includeInactive = searchParams.get("includeInactive") === "true";

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
      // Auto-setup: create default restaurant + menu if DB is empty
      console.log("[MENU] No restaurant found — running auto-setup...");
      try {
        targetRestaurantId = await autoSetup();
        if (!targetRestaurantId) {
          return success({ categories: [], restaurant: null, needsSetup: true });
        }
        console.log("[MENU] Auto-setup completed successfully");
      } catch (setupErr) {
        console.error("[MENU] Auto-setup failed:", setupErr);
        return success({ categories: [], restaurant: null, needsSetup: true });
      }
    }

    // Build menu query
    const menuWhere: Record<string, unknown> = {
      restaurantId: targetRestaurantId,
      isActive: true,
    };
    if (menuType) {
      menuWhere.menuType = menuType;
    }

    // Build category where clause
    const categoryWhere: Record<string, unknown> = {};
    if (!includeInactive) {
      categoryWhere.isActive = true;
    }
    // Always show categories to admin even when includeInactive=true
    // (no additional filter needed — isActive filter only applied when includeInactive=false)

    // Build items where clause
    const itemWhere: Record<string, unknown> = {};
    if (!includeInactive) {
      itemWhere.isAvailable = true;
    }

    // Fetch menus with categories and items
    const menus = await db.menu.findMany({
      where: menuWhere,
      include: {
        categories: {
          where: categoryWhere,
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              where: Object.keys(itemWhere).length > 0 ? itemWhere : undefined,
              orderBy: { sortOrder: "asc" },
            },
            menu: {
              select: { id: true, name: true, menuType: true },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Flatten categories across all menus, enriching with menu info
    const categories = menus.flatMap((menu) =>
      menu.categories.map((cat) => ({
        id: cat.id,
        menuId: cat.menuId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        menu: cat.menu,
        items: cat.items.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          slug: item.slug,
          description: item.description,
          image: item.image,
          price: item.price,
          discountPrice: item.discountPrice,
          costPrice: item.costPrice,
          calories: item.calories,
          prepTime: item.prepTime,
          isAvailable: item.isAvailable,
          isFeatured: item.isFeatured,
          isPopular: item.isPopular,
          isNew: item.isNew,
          itemType: item.itemType,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          isHalal: item.isHalal,
          isGlutenFree: item.isGlutenFree,
          isSpicy: item.isSpicy,
          spicyLevel: item.spicyLevel,
          trackInventory: item.trackInventory,
          quantity: item.quantity,
          lowStockThreshold: item.lowStockThreshold,
          sortOrder: item.sortOrder,
          orderCount: item.orderCount,
          rating: item.rating,
          allergens: safeParseJson(item.allergens),
          ingredientIds: safeParseJson(item.ingredientIds),
        })),
      }))
    );

    // Optionally include restaurant info
    const restaurant = await db.restaurant.findUnique({
      where: { id: targetRestaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        address: true,
        city: true,
        isOpen: true,
        deliveryFee: true,
        minOrderAmount: true,
        isActive: true,
      },
    });

    return success({
      categories,
      restaurant: restaurant || null,
    });
  } catch (err) {
    console.error("[MENU GET]", err);
    return error("Internal server error", 500);
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
// ============================================
async function autoSetup(): Promise<string | null> {
  // Check if any restaurant already exists
  const existingCount = await db.restaurant.count();
  if (existingCount > 0) {
    return null; // Don't setup if restaurants exist but are all inactive
  }

  // 1. Create restaurant
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

  // 2. Create menu
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

  // 3. Create categories
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
        data: {
          menuId: menu.id,
          name: def.name,
          slug: def.slug,
          sortOrder: def.sortOrder,
          isActive: true,
        },
      })
    )
  );

  // 4. Create menu items per category
  const itemDefs: Record<string, { name: string; slug: string; price: number; description: string; itemType: string; image: string | null }[]> = {
    "Plats Traditionnels": [
      { name: "Thiep bou dien", slug: "thiep-bou-dien", price: 3500, description: "Riz au poisson assaisonne aux legumes, specialite nationale", itemType: "food", image: "/images/menu/thieboudienne.png" },
      { name: "Yassa poulet", slug: "yassa-poulet", price: 3000, description: "Poulet mariné aux oignons et citron, grillé puis mijoté", itemType: "food", image: "/images/menu/yassa-poulet.png" },
      { name: "Mafé", slug: "mafe", price: 3000, description: "Sauce à base de pâte d'arachide avec viande ou poisson", itemType: "food", image: "/images/menu/mafe.png" },
      { name: "Thiéboudienne poisson", slug: "thieboudienne-poisson", price: 4000, description: "Variante du thiep avec du poisson frais grillé", itemType: "food", image: "/images/menu/thieboudienne.png" },
      { name: "Caldo", slug: "caldo", price: 2500, description: "Bouillon de viande et légumes réconfortant", itemType: "food", image: null },
    ],
    "Grillades & Brochettes": [
      { name: "Poulet braisé", slug: "poulet-brase", price: 2500, description: "Poulet entier braisé aux épices africains", itemType: "food", image: "/images/menu/poulet-brase.png" },
      { name: "Côte d'agneau grillée", slug: "cote-agneau-grillee", price: 4500, description: "Côte d'agneau grillée au charbon de bois", itemType: "food", image: null },
      { name: "Brochette de boeuf", slug: "brochette-boeuf", price: 2000, description: "Brochette de boeuf mariné épicée", itemType: "food", image: "/images/menu/brochette-boeuf.png" },
      { name: "Poisson grillé", slug: "poisson-grille", price: 3500, description: "Poisson entier grillé servi avec du citron", itemType: "food", image: "/images/menu/poisson-grille.png" },
      { name: "Dibiterie", slug: "dibiterie", price: 2000, description: "Viande fumee grillee, specialite ouest-africaine", itemType: "food", image: null },
    ],
    "Accompagnements": [
      { name: "Riz blanc", slug: "riz-blanc", price: 500, description: "Riz blanc cuit à la perfection", itemType: "food", image: null },
      { name: "Foutou", slug: "foutou", price: 800, description: "Pâte de manioc ou de banane plantain", itemType: "side", image: null },
      { name: "Attiéké", slug: "attieke", price: 600, description: "Semoule de manioc fermentée", itemType: "side", image: null },
      { name: "Alloco", slug: "alloco", price: 700, description: "Beignets de banane plantain", itemType: "side", image: "/images/menu/alloco.png" },
    ],
    "Boissons": [
      { name: "Bissap", slug: "bissap", price: 500, description: "Jus d'hibiscus glacé, boisson nationale", itemType: "drink", image: "/images/menu/bissap.png" },
      { name: "Gingembre", slug: "gingembre", price: 500, description: "Jus de gingembre frais et piquant", itemType: "drink", image: "/images/menu/gingembre.png" },
      { name: "Jus de mangue", slug: "jus-mangue", price: 700, description: "Jus de mangue frais naturel", itemType: "drink", image: null },
      { name: "Ataya", slug: "ataya", price: 500, description: "The a la menthe traditionnel", itemType: "drink", image: "/images/menu/ataya.png" },
      { name: "Bitto", slug: "bitto", price: 500, description: "Jus de bissap léger et sucré", itemType: "drink", image: null },
    ],
    "Desserts": [
      { name: "Thiakry", slug: "thiakry", price: 1000, description: "Semoule de mil au lait concentré et baobab", itemType: "dessert", image: "/images/menu/thiakry.png" },
      { name: "Banane flambée", slug: "banane-flambee", price: 1500, description: "Banane plantain flambée au rhum", itemType: "dessert", image: null },
      { name: "Fruit de la passion", slug: "fruit-passion", price: 800, description: "Jus onctueux de fruit de la passion", itemType: "dessert", image: null },
    ],
    "Entrées & Salades": [
      { name: "Salade guineenne", slug: "salade-guineenne", price: 1500, description: "Salade fraiche aux tomates, oignons et vinaigrette locale", itemType: "food", image: null },
      { name: "Soupe kandia", slug: "soupe-kandia", price: 1200, description: "Soupe de feuilles de manioc à l'huile de palme", itemType: "food", image: null },
      { name: "Accra", slug: "accra", price: 1000, description: "Beignets de poissons ou de légumes", itemType: "food", image: "/images/menu/accra.png" },
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
            isPopular: idx === 0, // First item in each category is popular
            sortOrder: idx,
          },
        })
      )
    );
  }

  // 5. Create restaurant hours
  const days = [
    { day: 1, open: "10:00", close: "23:00" }, // Monday
    { day: 2, open: "10:00", close: "23:00" }, // Tuesday
    { day: 3, open: "10:00", close: "23:00" }, // Wednesday
    { day: 4, open: "10:00", close: "23:00" }, // Thursday
    { day: 5, open: "10:00", close: "23:00" }, // Friday
    { day: 6, open: "10:00", close: "00:00" }, // Saturday
    { day: 0, open: null, close: null, closed: true }, // Sunday closed
  ];

  await Promise.all(
    days.map((d) =>
      db.restaurantHour.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: d.day,
          openTime: d.open,
          closeTime: d.close,
          isClosed: d.closed || false,
        },
      })
    )
  );

  console.log(`[AUTO-SETUP] Created restaurant "${restaurant.name}" (${restaurant.id}) with menu, ${categories.length} categories, and sample items`);

  return restaurant.id;
}
