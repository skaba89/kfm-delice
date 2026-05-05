// ============================================
// KFM Délice Conakry — Seed Data
// Realistic Guinean restaurant seed for production
// ============================================

import { PrismaClient, UserRole, OrderType, OrderStatus, PaymentStatus, PaymentMethod, DeliveryStatus, ExpenseType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding KFM Délice Conakry — Guinée...\n");

  // -----------------------------------------------
  // CLEANUP — Delete in FK-safe order
  // -----------------------------------------------
  console.log("🧹 Cleaning existing data...");

  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.menuItemOptionValue.deleteMany();
  await prisma.menuItemOption.deleteMany();
  await prisma.menuItemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.restaurantHour.deleteMany();
  await prisma.restaurantSettings.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleanup complete.\n");

  // -----------------------------------------------
  // 1. RESTAURANT
  // -----------------------------------------------
  console.log("🏪 Creating restaurant...");

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "KFM Délice",
      slug: "kfm-delice",
      description:
        "Restaurant africain gastronomique au cœur de Conakry. Spécialités guinéennes et ouest-africaines préparées avec des ingrédients frais locaux.",
      email: "contact@kfmdelice.gn",
      phone: "+224 622 11 22 33",
      address: "Avenue de la République, Kaloum, Conakry, Guinée",
      city: "Conakry",
      district: "Kaloum",
      latitude: 9.5092,
      longitude: -13.7122,
      cuisines: ["Africaine", "Guinéenne", "Ouest-Africaine", "Grillades"],
      priceRange: 2,
      indoorCapacity: 60,
      outdoorCapacity: 20,
      totalCapacity: 80,
      acceptsReservations: true,
      acceptsWalkins: true,
      acceptsDelivery: true,
      acceptsTakeaway: true,
      acceptsDineIn: true,
      hasParking: true,
      hasWifi: true,
      deliveryFee: 15000,
      minOrderAmount: 5000,
      maxDeliveryRadius: 15,
      deliveryTime: 45,
      rating: 4.5,
      reviewCount: 128,
      isActive: true,
      isOpen: true,
    },
  });

  console.log(`   ✓ Restaurant: ${restaurant.name} (${restaurant.id})\n`);

  // -----------------------------------------------
  // 2. RESTAURANT SETTINGS
  // -----------------------------------------------
  console.log("⚙️  Creating restaurant settings...");

  await prisma.restaurantSettings.create({
    data: {
      restaurantId: restaurant.id,
      minOrderAmount: 5000,
      deliveryFee: 15000,
      orderPrepTime: 25,
      tableTime: 90,
      noShowFee: 5000,
      loyaltyEnabled: true,
      autoAcceptOrders: false,
      notificationSettings: {
        email: true,
        sms: true,
        whatsapp: true,
        push: true,
        orderAlerts: true,
        reservationAlerts: true,
      },
    },
  });

  console.log("   ✓ Settings created.\n");

  // -----------------------------------------------
  // 3. RESTAURANT HOURS — Mon-Sat 10:00-22:00, Sun 12:00-21:00
  // -----------------------------------------------
  console.log("🕐 Creating restaurant hours...");

  const hoursData = [
    { dayOfWeek: 0, openTime: "10:00", closeTime: "22:00", kitchenOpen: "09:30", kitchenClose: "21:30", lastSeating: "21:00" }, // Mon
    { dayOfWeek: 1, openTime: "10:00", closeTime: "22:00", kitchenOpen: "09:30", kitchenClose: "21:30", lastSeating: "21:00" }, // Tue
    { dayOfWeek: 2, openTime: "10:00", closeTime: "22:00", kitchenOpen: "09:30", kitchenClose: "21:30", lastSeating: "21:00" }, // Wed
    { dayOfWeek: 3, openTime: "10:00", closeTime: "22:00", kitchenOpen: "09:30", kitchenClose: "21:30", lastSeating: "21:00" }, // Thu
    { dayOfWeek: 4, openTime: "10:00", closeTime: "22:00", kitchenOpen: "09:30", kitchenClose: "21:30", lastSeating: "21:00" }, // Fri
    { dayOfWeek: 5, openTime: "10:00", closeTime: "22:00", kitchenOpen: "09:30", kitchenClose: "21:30", lastSeating: "21:00" }, // Sat
    { dayOfWeek: 6, openTime: "12:00", closeTime: "21:00", kitchenOpen: "11:30", kitchenClose: "20:30", lastSeating: "20:00" }, // Sun
  ];

  await prisma.restaurantHour.createMany({
    data: hoursData.map((h) => ({ restaurantId: restaurant.id, ...h })),
  });

  console.log("   ✓ 7 days of hours created.\n");

  // -----------------------------------------------
  // 4. USERS — 5 test accounts
  // -----------------------------------------------
  console.log("👤 Creating users...");

  const passwordHash = await hash("Pass123!", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@kfmdelice.gn",
      passwordHash,
      firstName: "Ibrahima",
      lastName: "Diallo",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@kfmdelice.gn",
      passwordHash,
      firstName: "Fatoumata",
      lastName: "Bah",
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  const kitchenUser = await prisma.user.create({
    data: {
      email: "cuisine@kfmdelice.gn",
      passwordHash,
      firstName: "Mamadou",
      lastName: "Condé",
      role: UserRole.KITCHEN,
      isActive: true,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: "livreur@kfmdelice.gn",
      passwordHash,
      firstName: "Sekou",
      lastName: "Touré",
      phone: "+224 661 00 00 01",
      role: UserRole.DRIVER,
      isActive: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "client@exemple.gn",
      passwordHash,
      firstName: "Aminata",
      lastName: "Sylla",
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  console.log("   ✓ 5 users created.\n");

  // -----------------------------------------------
  // 5. DRIVER PROFILE
  // -----------------------------------------------
  console.log("🏍️  Creating driver profile...");

  const driver = await prisma.driver.create({
    data: {
      restaurantId: restaurant.id,
      userId: driverUser.id,
      firstName: "Sekou",
      lastName: "Touré",
      phone: "+224 661 00 00 01",
      email: "livreur@kfmdelice.gn",
      vehicleType: "motorcycle",
      vehiclePlate: "CG-1234-AB",
      isVerified: true,
      isActive: true,
      isAvailable: true,
      status: "online",
      currentLat: 9.5092,
      currentLng: -13.7122,
      lastLocationAt: new Date(),
      totalDeliveries: 342,
      totalEarnings: 3_420_000,
      rating: 4.8,
    },
  });

  console.log(`   ✓ Driver: ${driver.firstName} ${driver.lastName}\n`);

  // -----------------------------------------------
  // 6. CUSTOMER PROFILE
  // -----------------------------------------------
  console.log("🛍️  Creating customer profile...");

  const customerProfile = await prisma.customerProfile.create({
    data: {
      restaurantId: restaurant.id,
      userId: customerUser.id,
      firstName: "Aminata",
      lastName: "Sylla",
      phone: "+224 628 00 00 02",
      email: "client@exemple.gn",
      language: "fr",
      currency: "GNF",
      addresses: [
        {
          label: "Maison",
          address: "Quartier Boulbinet, Dixinn, Conakry",
          city: "Conakry",
          district: "Dixinn",
          isDefault: true,
        },
        {
          label: "Bureau",
          address: "Carrefour Binnah, Kaloum, Conakry",
          city: "Conakry",
          district: "Kaloum",
          isDefault: false,
        },
      ],
      dietaryPreferences: ["halal"],
      allergies: [],
      totalOrders: 2,
      totalSpent: 108000,
      avgOrderValue: 54000,
      lastOrderAt: new Date(),
      loyaltyPoints: 108,
      loyaltyLevel: 2,
      isVip: false,
    },
  });

  console.log(`   ✓ Customer: ${customerProfile.firstName} ${customerProfile.lastName}\n`);

  // -----------------------------------------------
  // 7. MENU — "Menu Principal"
  // -----------------------------------------------
  console.log("📋 Creating menu and categories...");

  const menu = await prisma.menu.create({
    data: {
      restaurantId: restaurant.id,
      name: "Menu Principal",
      slug: "menu-principal",
      description: "Notre carte de plats traditionnels guinéens et africains, préparés avec passion.",
      isActive: true,
      availableDays: [0, 1, 2, 3, 4, 5, 6],
      availableStart: "10:00",
      availableEnd: "22:00",
      menuType: "main",
      sortOrder: 0,
    },
  });

  // -- Categories --
  const catSignature = await prisma.menuCategory.create({
    data: { menuId: menu.id, name: "Plats signature", slug: "plats-signature", description: "Nos spécialités maison, les incontournables de la cuisine guinéenne.", icon: "UtensilsCrossed", sortOrder: 0 },
  });
  const catBrochettes = await prisma.menuCategory.create({
    data: { menuId: menu.id, name: "Brochettes & Grillades", slug: "brochettes-grillades", description: "Viandes et poissons grillés au feu de bois, marinés aux épices locales.", icon: "Flame", sortOrder: 1 },
  });
  const catAccompagnements = await prisma.menuCategory.create({
    data: { menuId: menu.id, name: "Accompagnements", slug: "accompagnements", description: "Garnitures traditionnelles pour accompagner vos plats.", icon: "Soup", sortOrder: 2 },
  });
  const catBoissons = await prisma.menuCategory.create({
    data: { menuId: menu.id, name: "Boissons", slug: "boissons", description: "Boissons fraîches artisanales et classiques.", icon: "GlassWater", sortOrder: 3 },
  });
  const catDesserts = await prisma.menuCategory.create({
    data: { menuId: menu.id, name: "Desserts", slug: "desserts", description: "Douceurs pour terminer votre repas en beauté.", icon: "Cake", sortOrder: 4 },
  });

  // -- Helper to create menu items --
  type ItemInput = {
    categoryId: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    calories?: number;
    prepTime?: number;
    isPopular?: boolean;
    isFeatured?: boolean;
    isNew?: boolean;
    isHalal?: boolean;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    isSpicy?: boolean;
    spicyLevel?: number;
    itemType?: string;
    allergens?: string[];
    sortOrder?: number;
  };

  async function createItem(item: ItemInput) {
    return prisma.menuItem.create({
      data: {
        ...item,
        isAvailable: true,
        trackInventory: false,
        quantity: 50,
        lowStockThreshold: 5,
        orderCount: item.isPopular ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 50),
        rating: item.isPopular ? 4.5 + Math.random() * 0.5 : 4.0 + Math.random() * 0.5,
      },
    });
  }

  // -- Plats signature --
  const rizGras = await createItem({
    categoryId: catSignature.id, name: "Riz gras", slug: "riz-gras",
    description: "Plat national guinéen. Riz cuit dans un bouillon riche de légumes, tomates, huile de palme et poisson fumé. Servi avec du poulet fumé et des légumes.",
    price: 25000, calories: 650, prepTime: 35, isPopular: true, isFeatured: true,
    allergens: ["poisson"], itemType: "food", sortOrder: 0,
  });
  const pouletBrase = await createItem({
    categoryId: catSignature.id, name: "Poulet braisé", slug: "poulet-brase",
    description: "Poulet entier mariné aux épices guinéennes, braisé lentement au charbon de bois. Servi avec alloco et sauce pimentée.",
    price: 30000, calories: 580, prepTime: 45, isPopular: true, isFeatured: true, isHalal: true,
    allergens: ["gluten"], itemType: "food", sortOrder: 1,
  });
  const thiepBouDien = await createItem({
    categoryId: catSignature.id, name: "Thiep bou dien", slug: "thiep-bou-dien",
    description: "Spécialité sénégalo-guinéenne. Riz au poisson avec légumes, tamarin et concentré de tomate. Un plat complet et parfumé.",
    price: 28000, calories: 600, prepTime: 50, isPopular: true,
    allergens: ["poisson"], itemType: "food", sortOrder: 2,
  });
  const mafeBoeuf = await createItem({
    categoryId: catSignature.id, name: "Mafé bœuf", slug: "mafe-boeuf",
    description: "Ragoût de bœuf dans une sauce onctueuse à la pâte d'arachide et à la pâte de tomate. Servi avec du riz blanc ou du foutou.",
    price: 27000, calories: 720, prepTime: 40, isPopular: true, isHalal: true,
    allergens: ["arachides"], itemType: "food", sortOrder: 3,
  });
  const soumbala = await createItem({
    categoryId: catSignature.id, name: "Soumbala", slug: "soumbala",
    description: "Sauce traditionnelle au soumbala (néré) accompagnée de riz blanc. Saveurs profondes et authentiques de la cuisine guinéenne.",
    price: 22000, calories: 550, prepTime: 30, isSpicy: true, spicyLevel: 2,
    itemType: "food", sortOrder: 4,
  });
  const attiekePoisson = await createItem({
    categoryId: catSignature.id, name: "Attiéké poisson", slug: "attieke-poisson",
    description: "Semoule de manioc servie avec du poisson grillé, des crudités et une sauce piquante à l'ail.",
    price: 20000, calories: 480, prepTime: 25, isNew: true,
    allergens: ["poisson"], itemType: "food", sortOrder: 5,
  });

  // -- Brochettes & Grillades --
  const brochettePoulet = await createItem({
    categoryId: catBrochettes.id, name: "Brochette poulet", slug: "brochette-poulet",
    description: "Brochettes de poulet mariné aux épices, grillées au feu de bois. Servies avec sauce pimentée maison.",
    price: 15000, calories: 320, prepTime: 20, isPopular: true, isHalal: true,
    itemType: "food", sortOrder: 0,
  });
  const brochetteBoeuf = await createItem({
    categoryId: catBrochettes.id, name: "Brochette bœuf", slug: "brochette-boeuf",
    description: "Bœuf tendre en brochettes, mariné au gingembre et à la moutarde. Grillé au charbon de bois.",
    price: 18000, calories: 380, prepTime: 25, isHalal: true,
    itemType: "food", sortOrder: 1,
  });
  const poissonBrase = await createItem({
    categoryId: catBrochettes.id, name: "Poisson braisé", slug: "poisson-brase",
    description: "Poisson entier (dorade ou bar) braisé au feu de bois avec marinade citron-gingembre. Servi avec alloco et salade.",
    price: 35000, calories: 420, prepTime: 30, isFeatured: true,
    allergens: ["poisson"], itemType: "food", sortOrder: 2,
  });
  const cotelettesAgneau = await createItem({
    categoryId: catBrochettes.id, name: "Côtelettes d'agneau", slug: "cotelettes-agneau",
    description: "Côtelettes d'agneau grillées aux herbes et épices guinéennes. Tendres et juteuses.",
    price: 32000, calories: 450, prepTime: 30, isNew: true, isHalal: true,
    itemType: "food", sortOrder: 3,
  });

  // -- Accompagnements --
  const alloco = await createItem({
    categoryId: catAccompagnements.id, name: "Alloco", slug: "alloco",
    description: "Bananes plantains frites, croustillantes à l'extérieur et fondantes à l'intérieur. Le classique africain.",
    price: 8000, calories: 280, prepTime: 10, isPopular: true, isVegetarian: true, isVegan: true,
    itemType: "side", sortOrder: 0,
  });
  const foutou = await createItem({
    categoryId: catAccompagnements.id, name: "Foutou", slug: "foutou",
    description: "Pâte de banane plantain et de manioc pilée. Accompagnement traditionnel pour les sauces.",
    price: 6000, calories: 350, prepTime: 15, isVegetarian: true, isVegan: true,
    itemType: "side", sortOrder: 1,
  });
  const rizBlanc = await createItem({
    categoryId: catAccompagnements.id, name: "Riz blanc", slug: "riz-blanc",
    description: "Riz blanc parfumé cuit à la perfection. Garniture polyvalente pour tous les plats.",
    price: 5000, calories: 200, prepTime: 15, isVegetarian: true, isVegan: true, isGlutenFree: true,
    itemType: "side", sortOrder: 2,
  });
  const saladeMixte = await createItem({
    categoryId: catAccompagnements.id, name: "Salade mixte", slug: "salade-mixte",
    description: "Mélange de laitue, tomates, concombres, carottes et oignons, assaisonné à la vinaigrette maison.",
    price: 7000, calories: 120, prepTime: 5, isVegetarian: true, isVegan: true, isGlutenFree: true,
    itemType: "side", sortOrder: 3,
  });
  const legumesGrilles = await createItem({
    categoryId: catAccompagnements.id, name: "Légumes grillés", slug: "legumes-grilles",
    description: "Aubergines, poivrons, courgettes et oignons grillés au feu de bois avec huile d'olive.",
    price: 8000, calories: 150, prepTime: 15, isVegetarian: true, isVegan: true, isGlutenFree: true,
    itemType: "side", sortOrder: 4,
  });

  // -- Boissons --
  const bissap = await createItem({
    categoryId: catBoissons.id, name: "Bissap", slug: "bissap",
    description: "Jus d'hibiscus glacé, sucré à la menthe fraîche. La boisson nationale d'Afrique de l'Ouest.",
    price: 3000, calories: 90, prepTime: 5, isPopular: true, isVegan: true,
    itemType: "drink", sortOrder: 0,
  });
  const gingembre = await createItem({
    categoryId: catBoissons.id, name: "Gingembre", slug: "gingembre",
    description: "Jus de gingembre frais avec citron et sucre. Réconfortant et vivifiant.",
    price: 3000, calories: 80, prepTime: 5, isPopular: true, isVegan: true,
    itemType: "drink", sortOrder: 1,
  });
  const jusMangue = await createItem({
    categoryId: catBoissons.id, name: "Jus de mangue", slug: "jus-de-mangue",
    description: "Jus de mangue frais, onctueux et naturellement sucré. Pressé à la commande.",
    price: 4000, calories: 120, prepTime: 5, isFeatured: true, isVegan: true,
    itemType: "drink", sortOrder: 2,
  });
  const eauMinerale = await createItem({
    categoryId: catBoissons.id, name: "Eau minérale", slug: "eau-minerale",
    description: "Eau minérale naturelle en bouteille de 50cl. Rafraîchissement essentiel.",
    price: 2000, calories: 0, prepTime: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isHalal: true,
    itemType: "drink", sortOrder: 3,
  });
  const biereFlag = await createItem({
    categoryId: catBoissons.id, name: "Bière Flag", slug: "biere-flag",
    description: "Bière Flag de Guinée, 65cl. La bière locale préférée des Conakryens.",
    price: 5000, calories: 180, prepTime: 2, isPopular: true, isVegetarian: true,
    itemType: "drink", sortOrder: 4,
  });
  const cocktailTropical = await createItem({
    categoryId: catBoissons.id, name: "Cocktail tropical", slug: "cocktail-tropical",
    description: "Mélange de jus d'ananas, mangue et fruit de la passion. Sans alcool, avec glaçons pilés.",
    price: 8000, calories: 140, prepTime: 5, isNew: true, isVegan: true,
    itemType: "drink", sortOrder: 5,
  });

  // -- Desserts --
  const fruitsSaison = await createItem({
    categoryId: catDesserts.id, name: "Fruits de saison", slug: "fruits-de-saison",
    description: "Assiette de fruits frais de saison : mangue, papaye, ananas, banane. Nature et vitaminé.",
    price: 5000, calories: 100, prepTime: 5, isVegan: true, isVegetarian: true, isGlutenFree: true,
    itemType: "dessert", sortOrder: 0,
  });
  const gateauChocolat = await createItem({
    categoryId: catDesserts.id, name: "Gâteau chocolat", slug: "gateau-chocolat",
    description: "Moelleux au chocolat noir fondant, servi avec une boule de glace vanille. Un pur plaisir.",
    price: 8000, calories: 380, prepTime: 5, isVegetarian: true,
    allergens: ["gluten", "lait", "œufs"], itemType: "dessert", sortOrder: 1,
  });
  const sorbetMangue = await createItem({
    categoryId: catDesserts.id, name: "Sorbet mangue", slug: "sorbet-mangue",
    description: "Sorbet artisanal à la mangue fraîche. Rafraîchissant et fruité, parfait pour le climat guinéen.",
    price: 6000, calories: 160, prepTime: 5, isNew: true, isVegan: true, isVegetarian: true, isGlutenFree: true,
    itemType: "dessert", sortOrder: 2,
  });

  console.log("   ✓ Menu with 5 categories and 22 items created.\n");

  // -----------------------------------------------
  // 8. SAMPLE ORDERS (3 orders)
  // -----------------------------------------------
  console.log("📦 Creating sample orders...");

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // -- Order #CMD-001: Completed, DINE_IN, client Aminata, 3 items, cash, ~78,000 GNF --
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "CMD-001",
      restaurantId: restaurant.id,
      customerId: customerProfile.id,
      customerName: "Aminata Sylla",
      customerPhone: "+224 628 00 00 02",
      customerEmail: "client@exemple.gn",
      orderType: OrderType.DINE_IN,
      source: "web",
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      tableNumber: "T5",
      subtotal: 78000,
      discount: 0,
      tax: 0,
      serviceCharge: 0,
      tip: 5000,
      total: 83000,
      currency: "GNF",
      loyaltyPointsEarned: 83,
      confirmedAt: threeDaysAgo,
      preparingAt: new Date(threeDaysAgo.getTime() + 5 * 60 * 1000),
      readyAt: new Date(threeDaysAgo.getTime() + 35 * 60 * 1000),
      completedAt: new Date(threeDaysAgo.getTime() + 65 * 60 * 1000),
      createdAt: threeDaysAgo,
      items: {
        create: [
          {
            menuItemId: rizGras.id,
            itemName: "Riz gras",
            quantity: 2,
            unitPrice: 25000,
            totalPrice: 50000,
            status: "served",
            completedAt: new Date(threeDaysAgo.getTime() + 40 * 60 * 1000),
          },
          {
            menuItemId: bissap.id,
            itemName: "Bissap",
            quantity: 3,
            unitPrice: 3000,
            totalPrice: 9000,
            status: "served",
            completedAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 1000),
          },
          {
            menuItemId: alloco.id,
            itemName: "Alloco",
            quantity: 1,
            unitPrice: 8000,
            totalPrice: 8000,
            status: "served",
            completedAt: new Date(threeDaysAgo.getTime() + 25 * 60 * 1000),
          },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, notes: "Nouvelle commande reçue", changedBy: adminUser.id, createdAt: threeDaysAgo },
          { status: OrderStatus.CONFIRMED, notes: "Commande confirmée", changedBy: managerUser.id, createdAt: new Date(threeDaysAgo.getTime() + 2 * 60 * 1000) },
          { status: OrderStatus.PREPARING, notes: "En cours de préparation", changedBy: kitchenUser.id, createdAt: new Date(threeDaysAgo.getTime() + 5 * 60 * 1000) },
          { status: OrderStatus.READY, notes: "Commande prête", changedBy: kitchenUser.id, createdAt: new Date(threeDaysAgo.getTime() + 35 * 60 * 1000) },
          { status: OrderStatus.COMPLETED, notes: "Commande servie et terminée", changedBy: managerUser.id, createdAt: new Date(threeDaysAgo.getTime() + 65 * 60 * 1000) },
        ],
      },
      payments: {
        create: [
          {
            restaurantId: restaurant.id,
            amount: 83000,
            currency: "GNF",
            method: PaymentMethod.CASH,
            status: PaymentStatus.PAID,
            collectedBy: managerUser.id,
            collectedAt: new Date(threeDaysAgo.getTime() + 65 * 60 * 1000),
            processedAt: new Date(threeDaysAgo.getTime() + 65 * 60 * 1000),
          },
        ],
      },
    },
  });

  // -- Order #CMD-002: Delivered, DELIVERY, guest "Oumar Keita", 2 items, mobile_money orange, ~55,000 GNF --
  const order2Subtotal = 50000; // poulet braisé 30000 + riz blanc 5000 + jus de mangue 4000 x 3 = 27000... let me recalculate
  // poulet braisé: 30000 x 1 = 30000, riz blanc: 5000 x 1 = 5000, cocktail tropical: 8000 x 2 = 16000, delivery 15000
  const order2ItemsTotal = 30000 + 5000 + 16000; // 51000
  const order2Total = 51000 + 15000; // 66000

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "CMD-002",
      restaurantId: restaurant.id,
      customerName: "Oumar Keita",
      customerPhone: "+224 625 55 44 33",
      orderType: OrderType.DELIVERY,
      source: "app",
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      deliveryAddress: "Camp Alpha Yaya Diallo, Dixinn, Conakry",
      deliveryCity: "Conakry",
      deliveryDistrict: "Dixinn",
      deliveryLat: 9.535,
      deliveryLng: -13.68,
      deliveryNotes: "Porte rouge, 2ème immeuble à gauche",
      deliveryFee: 15000,
      deliveryTime: 35,
      subtotal: order2ItemsTotal,
      discount: 0,
      tax: 0,
      serviceCharge: 0,
      tip: 5000,
      total: order2ItemsTotal + 15000 + 5000, // 71000
      currency: "GNF",
      loyaltyPointsEarned: 71,
      confirmedAt: yesterday,
      preparingAt: new Date(yesterday.getTime() + 3 * 60 * 1000),
      readyAt: new Date(yesterday.getTime() + 28 * 60 * 1000),
      pickedUpAt: new Date(yesterday.getTime() + 33 * 60 * 1000),
      deliveredAt: new Date(yesterday.getTime() + 50 * 60 * 1000),
      createdAt: yesterday,
      items: {
        create: [
          {
            menuItemId: pouletBrase.id,
            itemName: "Poulet braisé",
            quantity: 1,
            unitPrice: 30000,
            totalPrice: 30000,
            status: "served",
            completedAt: new Date(yesterday.getTime() + 30 * 60 * 1000),
          },
          {
            menuItemId: rizBlanc.id,
            itemName: "Riz blanc",
            quantity: 1,
            unitPrice: 5000,
            totalPrice: 5000,
            status: "served",
            completedAt: new Date(yesterday.getTime() + 15 * 60 * 1000),
          },
          {
            menuItemId: cocktailTropical.id,
            itemName: "Cocktail tropical",
            quantity: 2,
            unitPrice: 8000,
            totalPrice: 16000,
            status: "served",
            completedAt: new Date(yesterday.getTime() + 8 * 60 * 1000),
          },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, notes: "Commande de livraison reçue", changedBy: adminUser.id, createdAt: yesterday },
          { status: OrderStatus.CONFIRMED, notes: "Livraison confirmée", changedBy: managerUser.id, createdAt: new Date(yesterday.getTime() + 2 * 60 * 1000) },
          { status: OrderStatus.PREPARING, notes: "Cuisine en cours", changedBy: kitchenUser.id, createdAt: new Date(yesterday.getTime() + 3 * 60 * 1000) },
          { status: OrderStatus.READY, notes: "Prêt pour livraison", changedBy: kitchenUser.id, createdAt: new Date(yesterday.getTime() + 28 * 60 * 1000) },
          { status: OrderStatus.OUT_FOR_DELIVERY, notes: "Livreur en route", changedBy: driverUser.id, createdAt: new Date(yesterday.getTime() + 33 * 60 * 1000) },
          { status: OrderStatus.DELIVERED, notes: "Livré avec succès", changedBy: driverUser.id, createdAt: new Date(yesterday.getTime() + 50 * 60 * 1000) },
        ],
      },
      payments: {
        create: [
          {
            restaurantId: restaurant.id,
            amount: 71000,
            currency: "GNF",
            method: PaymentMethod.MOBILE_MONEY,
            provider: "orange_money",
            status: PaymentStatus.PAID,
            phoneNumber: "+224 625 55 44 33",
            transactionId: "OM-" + Date.now().toString(36).toUpperCase(),
            processedAt: yesterday,
          },
        ],
      },
      delivery: {
        create: {
          restaurantId: restaurant.id,
          pickupAddress: "Avenue de la République, Kaloum, Conakry, Guinée",
          pickupLat: 9.5092,
          pickupLng: -13.7122,
          dropoffAddress: "Camp Alpha Yaya Diallo, Dixinn, Conakry",
          dropoffLat: 9.535,
          dropoffLng: -13.68,
          dropoffNotes: "Porte rouge, 2ème immeuble à gauche",
          driverId: driver.id,
          status: DeliveryStatus.DELIVERED,
          deliveryFee: 15000,
          driverEarning: 4500,
          tip: 5000,
          estimatedTime: 35,
          actualTime: 42,
          distance: 5.8,
          assignedAt: new Date(yesterday.getTime() + 30 * 60 * 1000),
          driverArrivedAt: new Date(yesterday.getTime() + 32 * 60 * 1000),
          pickedUpAt: new Date(yesterday.getTime() + 33 * 60 * 1000),
          deliveredAt: new Date(yesterday.getTime() + 50 * 60 * 1000),
        },
      },
    },
  });

  // -- Order #CMD-003: Preparing, TAKEAWAY, client Aminata, 1 item, pending payment, ~30,000 GNF --
  const order3 = await prisma.order.create({
    data: {
      orderNumber: "CMD-003",
      restaurantId: restaurant.id,
      customerId: customerProfile.id,
      customerName: "Aminata Sylla",
      customerPhone: "+224 628 00 00 02",
      customerEmail: "client@exemple.gn",
      orderType: OrderType.TAKEAWAY,
      source: "app",
      status: OrderStatus.PREPARING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: 30000,
      discount: 0,
      tax: 0,
      serviceCharge: 0,
      tip: 0,
      total: 30000,
      currency: "GNF",
      notes: "À emporter, merci !",
      confirmedAt: now,
      preparingAt: new Date(now.getTime() + 3 * 60 * 1000),
      createdAt: now,
      items: {
        create: [
          {
            menuItemId: mafeBoeuf.id,
            itemName: "Mafé bœuf",
            quantity: 1,
            unitPrice: 30000,
            totalPrice: 30000,
            status: "preparing",
            startedAt: new Date(now.getTime() + 3 * 60 * 1000),
          },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, notes: "Nouvelle commande à emporter", changedBy: adminUser.id, createdAt: now },
          { status: OrderStatus.CONFIRMED, notes: "Commande confirmée pour emporté", changedBy: managerUser.id, createdAt: new Date(now.getTime() + 2 * 60 * 1000) },
          { status: OrderStatus.PREPARING, notes: "En cours de préparation — mafé bœuf", changedBy: kitchenUser.id, createdAt: new Date(now.getTime() + 3 * 60 * 1000) },
        ],
      },
      payments: {
        create: [
          {
            restaurantId: restaurant.id,
            amount: 30000,
            currency: "GNF",
            method: PaymentMethod.CASH,
            status: PaymentStatus.PENDING,
          },
        ],
      },
    },
  });

  console.log("   ✓ Order #CMD-001 — Completed, DINE_IN, 83,000 GNF (cash)");
  console.log("   ✓ Order #CMD-002 — Delivered, DELIVERY, 71,000 GNF (Orange Money)");
  console.log("   ✓ Order #CMD-003 — Preparing, TAKEAWAY, 30,000 GNF (pending cash)\n");

  // -----------------------------------------------
  // 9. INGREDIENTS (10 items)
  // -----------------------------------------------
  console.log("🧂 Creating ingredients...");

  const ingredients = await prisma.ingredient.createMany({
    data: [
      { restaurantId: restaurant.id, name: "Riz", unit: "kg", costPerUnit: 8000, quantity: 200, lowStockThreshold: 20 },
      { restaurantId: restaurant.id, name: "Poulet", unit: "kg", costPerUnit: 15000, quantity: 50, lowStockThreshold: 10 },
      { restaurantId: restaurant.id, name: "Bœuf", unit: "kg", costPerUnit: 18000, quantity: 30, lowStockThreshold: 5 },
      { restaurantId: restaurant.id, name: "Poisson", unit: "kg", costPerUnit: 12000, quantity: 25, lowStockThreshold: 5 },
      { restaurantId: restaurant.id, name: "Huile de palme", unit: "l", costPerUnit: 6000, quantity: 40, lowStockThreshold: 5 },
      { restaurantId: restaurant.id, name: "Pâte d'arachide", unit: "kg", costPerUnit: 10000, quantity: 20, lowStockThreshold: 3 },
      { restaurantId: restaurant.id, name: "Tomates", unit: "kg", costPerUnit: 3000, quantity: 60, lowStockThreshold: 10 },
      { restaurantId: restaurant.id, name: "Oignons", unit: "kg", costPerUnit: 2500, quantity: 45, lowStockThreshold: 8 },
      { restaurantId: restaurant.id, name: "Piment", unit: "kg", costPerUnit: 5000, quantity: 10, lowStockThreshold: 2 },
      { restaurantId: restaurant.id, name: "Lait", unit: "l", costPerUnit: 2000, quantity: 30, lowStockThreshold: 5 },
    ],
  });

  // Fetch the created ingredients for stock movements
  const allIngredients = await prisma.ingredient.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { name: "asc" },
  });

  const ingredientMap = new Map(allIngredients.map((i) => [i.name, i]));

  console.log(`   ✓ ${ingredients.count} ingredients created.\n`);

  // -----------------------------------------------
  // 10. STOCK MOVEMENTS (4 sample movements)
  // -----------------------------------------------
  console.log("📊 Creating stock movements...");

  await prisma.stockMovement.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        ingredientId: ingredientMap.get("Riz")!.id,
        type: "in",
        quantity: 100,
        unit: "kg",
        previousQty: 100,
        newQty: 200,
        referenceType: "purchase",
        notes: "Approvisionnement hebdomadaire — Marché de Madina",
        recordedBy: managerUser.id,
      },
      {
        restaurantId: restaurant.id,
        ingredientId: ingredientMap.get("Poulet")!.id,
        type: "in",
        quantity: 30,
        unit: "kg",
        previousQty: 20,
        newQty: 50,
        referenceType: "purchase",
        notes: "Réapprovisionnement poulet fermier",
        recordedBy: managerUser.id,
      },
      {
        restaurantId: restaurant.id,
        ingredientId: ingredientMap.get("Tomates")!.id,
        type: "out",
        quantity: 10,
        unit: "kg",
        previousQty: 70,
        newQty: 60,
        referenceType: "order",
        referenceId: order1.id,
        notes: "Utilisées pour les commandes de la journée",
        recordedBy: kitchenUser.id,
      },
      {
        restaurantId: restaurant.id,
        ingredientId: ingredientMap.get("Oignons")!.id,
        type: "waste",
        quantity: 3,
        unit: "kg",
        previousQty: 48,
        newQty: 45,
        referenceType: "adjustment",
        notes: "Perte — oignons abîmés lors du transport",
        recordedBy: kitchenUser.id,
      },
    ],
  });

  console.log("   ✓ 4 stock movements created.\n");

  // -----------------------------------------------
  // 11. EXPENSE CATEGORIES (6 categories)
  // -----------------------------------------------
  console.log("💰 Creating expense categories...");

  const catIngredients = await prisma.expenseCategory.create({
    data: {
      restaurantId: restaurant.id, name: "Ingrédients", type: ExpenseType.supplies,
      budget: 5_000_000, color: "#22C55E", icon: "Carrot",
      description: "Achat d'ingrédients et matières premières alimentaires.",
      sortOrder: 0,
    },
  });
  const catSalaires = await prisma.expenseCategory.create({
    data: {
      restaurantId: restaurant.id, name: "Salaires", type: ExpenseType.salaries,
      budget: 8_000_000, color: "#3B82F6", icon: "Banknote",
      description: "Salaires et primes du personnel.",
      sortOrder: 1,
    },
  });
  const catTransport = await prisma.expenseCategory.create({
    data: {
      restaurantId: restaurant.id, name: "Transport", type: ExpenseType.utilities,
      budget: 1_000_000, color: "#F59E0B", icon: "Truck",
      description: "Frais de livraison et transport.",
      sortOrder: 2,
    },
  });
  const catMarketing = await prisma.expenseCategory.create({
    data: {
      restaurantId: restaurant.id, name: "Marketing", type: ExpenseType.marketing,
      budget: 500_000, color: "#EC4899", icon: "Megaphone",
      description: "Publicité, réseaux sociaux et promotions.",
      sortOrder: 3,
    },
  });
  const catMaintenance = await prisma.expenseCategory.create({
    data: {
      restaurantId: restaurant.id, name: "Maintenance", type: ExpenseType.maintenance,
      budget: 300_000, color: "#8B5CF6", icon: "Wrench",
      description: "Entretien du matériel, réparations et nettoyage.",
      sortOrder: 4,
    },
  });
  const catAutre = await prisma.expenseCategory.create({
    data: {
      restaurantId: restaurant.id, name: "Autre", type: ExpenseType.other,
      budget: 200_000, color: "#6B7280", icon: "Tag",
      description: "Dépenses diverses non catégorisées.",
      sortOrder: 5,
    },
  });

  console.log("   ✓ 6 expense categories created.\n");

  // -----------------------------------------------
  // 12. EXPENSES (3 sample expenses in GNF)
  // -----------------------------------------------
  console.log("💵 Creating expenses...");

  await prisma.expense.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        categoryId: catIngredients.id,
        title: "Approvisionnement hebdomadaire — Marché Madina",
        category: ExpenseType.supplies,
        description: "Achat de riz, poulet, légumes et condiments pour la semaine.",
        amount: 850000,
        currency: "GNF",
        date: yesterday,
        paymentMethod: PaymentMethod.CASH,
        supplierName: "Marché Madina",
        notes: "Riz 50kg, poulet 20kg, tomates 15kg, oignons 10kg",
        status: "approved",
        createdById: managerUser.id,
        approvedAt: yesterday,
      },
      {
        restaurantId: restaurant.id,
        categoryId: catTransport.id,
        title: "Carburant moto livraison",
        category: ExpenseType.utilities,
        description: "Plein d'essence pour les motos de livraison de la semaine.",
        amount: 150000,
        currency: "GNF",
        date: yesterday,
        paymentMethod: PaymentMethod.CASH,
        supplierName: "Station Total Kaloum",
        notes: "2 motos, plein complet",
        status: "approved",
        createdById: managerUser.id,
        approvedAt: yesterday,
      },
      {
        restaurantId: restaurant.id,
        categoryId: catMarketing.id,
        title: "Publicité Facebook & Instagram",
        category: ExpenseType.marketing,
        description: "Campagne publicitaire mensuelle sur les réseaux sociaux.",
        amount: 350000,
        currency: "GNF",
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        paymentMethod: PaymentMethod.MOBILE_MONEY,
        supplierName: "Meta Ads",
        notes: "Ciblage Conakry, 18-45 ans, intérêt restaurant",
        status: "approved",
        createdById: adminUser.id,
        approvedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("   ✓ 3 expenses created.\n");

  // -----------------------------------------------
  // DONE
  // -----------------------------------------------
  console.log("🎉 Seed completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("📋 Summary:");
  console.log(`   Restaurant:  ${restaurant.name} (${restaurant.city}, ${restaurant.district})`);
  console.log(`   Menu:        ${menu.name} — 5 categories, 22 items`);
  console.log(`   Users:       5 accounts (admin, manager, cuisine, livreur, client)`);
  console.log(`   Driver:      1 profile (Sekou Touré)`);
  console.log(`   Customer:    1 profile (Aminata Sylla)`);
  console.log(`   Orders:      3 orders (CMD-001, CMD-002, CMD-003)`);
  console.log(`   Ingredients: 10 items`);
  console.log(`   Stock:       4 movements`);
  console.log(`   Expenses:    3 entries across 6 categories`);
  console.log("");
  console.log("🔐 Test accounts (password: Pass123!):");
  console.log("   admin@kfmdelice.gn     → SUPER_ADMIN");
  console.log("   manager@kfmdelice.gn   → MANAGER");
  console.log("   cuisine@kfmdelice.gn   → KITCHEN");
  console.log("   livreur@kfmdelice.gn   → DRIVER");
  console.log("   client@exemple.gn      → CUSTOMER");
  console.log("");
  console.log("💱 Currency: GNF (Guinean Franc)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
