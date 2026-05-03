// ============================================
// KFM Délice — Granular Permission Constants
// ============================================
//
// Permission format: "module:action"
// Modules: orders, menu, pos, reservations, reports, expenses,
//          invoices, hr, customers, staff, stock, kitchen,
//          drivers, deliveries, profile, earnings, org
// Actions: create, read, update, delete, manage, view, access, own
//
// "manage" = create + read + update + delete
// "access" = ability to enter/use the module
// "own"    = restricted to the user's own resources
// ============================================

/**
 * All permission constants organized by module.
 * Each module groups its actions together.
 */
export const Permissions = {
  // ---- Orders ----
  ORDERS_CREATE: "orders:create",
  ORDERS_READ: "orders:read",
  ORDERS_UPDATE: "orders:update",
  ORDERS_DELETE: "orders:delete",
  ORDERS_MANAGE: "orders:manage", // all CRUD

  // ---- Menu ----
  MENU_CREATE: "menu:create",
  MENU_READ: "menu:read",
  MENU_UPDATE: "menu:update",
  MENU_DELETE: "menu:delete",
  MENU_MANAGE: "menu:manage",

  // ---- POS ----
  POS_ACCESS: "pos:access",
  POS_MANAGE: "pos:manage",

  // ---- Reservations ----
  RESERVATIONS_CREATE: "reservations:create",
  RESERVATIONS_READ: "reservations:read",
  RESERVATIONS_UPDATE: "reservations:update",
  RESERVATIONS_DELETE: "reservations:delete",
  RESERVATIONS_MANAGE: "reservations:manage",

  // ---- Reports / Analytics ----
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
  REPORTS_MANAGE: "reports:manage",

  // ---- Expenses ----
  EXPENSES_CREATE: "expenses:create",
  EXPENSES_READ: "expenses:read",
  EXPENSES_UPDATE: "expenses:update",
  EXPENSES_DELETE: "expenses:delete",
  EXPENSES_MANAGE: "expenses:manage",
  EXPENSES_APPROVE: "expenses:approve",

  // ---- Invoices / Payments ----
  INVOICES_CREATE: "invoices:create",
  INVOICES_READ: "invoices:read",
  INVOICES_UPDATE: "invoices:update",
  INVOICES_DELETE: "invoices:delete",
  INVOICES_MANAGE: "invoices:manage",

  // ---- HR / Staff management ----
  HR_READ: "hr:read",
  HR_MANAGE: "hr:manage",

  // ---- Customers ----
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_MANAGE: "customers:manage",

  // ---- Stock / Inventory ----
  STOCK_CREATE: "stock:create",
  STOCK_READ: "stock:read",
  STOCK_UPDATE: "stock:update",
  STOCK_DELETE: "stock:delete",
  STOCK_MANAGE: "stock:manage",

  // ---- Kitchen ----
  KITCHEN_ACCESS: "kitchen:access",
  KITCHEN_MANAGE: "kitchen:manage",

  // ---- Drivers & Deliveries ----
  DRIVERS_READ: "drivers:read",
  DRIVERS_MANAGE: "drivers:manage",
  DELIVERIES_READ: "deliveries:read",
  DELIVERIES_UPDATE: "deliveries:update",
  DELIVERIES_MANAGE: "deliveries:manage",

  // ---- Profile (own data) ----
  PROFILE_OWN: "profile:own",
  PROFILE_UPDATE_OWN: "profile:update-own",

  // ---- Earnings (own) ----
  EARNINGS_OWN: "earnings:own",

  // ---- Stats (view-only) ----
  STATS_VIEW: "stats:view",

  // ---- Organization / Multi-tenant ----
  ORG_READ: "org:read",
  ORG_MANAGE: "org:manage",

  // ---- Settings ----
  SETTINGS_READ: "settings:read",
  SETTINGS_MANAGE: "settings:manage",

  // ---- Users (system users) ----
  USERS_CREATE: "users:create",
  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",
} as const;

/** String literal type derived from all permission keys */
export type Permission = (typeof Permissions)[keyof typeof Permissions];

/**
 * Role type matching the Prisma enum.
 */
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "STAFF"
  | "KITCHEN"
  | "DRIVER"
  | "CUSTOMER";

/**
 * Set of ALL known permission strings — used by SUPER_ADMIN.
 * Computed from the Permissions object.
 */
const ALL_PERMISSIONS: ReadonlySet<string> = new Set(
  Object.values(Permissions)
);

/**
 * Helper: expands "manage" pseudo-permissions into their CRUD equivalents
 * so that individual checks like hasPermission(role, "orders:create")
 * still work for roles that were assigned "orders:manage".
 */
function expandPermissions(perms: readonly string[]): ReadonlySet<string> {
  const set = new Set<string>(perms);

  // If a role has "orders:manage", grant all orders:* CRUD
  const manageExpand: Record<string, string[]> = {
    "orders:manage": [Permissions.ORDERS_CREATE, Permissions.ORDERS_READ, Permissions.ORDERS_UPDATE, Permissions.ORDERS_DELETE],
    "menu:manage": [Permissions.MENU_CREATE, Permissions.MENU_READ, Permissions.MENU_UPDATE, Permissions.MENU_DELETE],
    "reservations:manage": [Permissions.RESERVATIONS_CREATE, Permissions.RESERVATIONS_READ, Permissions.RESERVATIONS_UPDATE, Permissions.RESERVATIONS_DELETE],
    "expenses:manage": [Permissions.EXPENSES_CREATE, Permissions.EXPENSES_READ, Permissions.EXPENSES_UPDATE, Permissions.EXPENSES_DELETE],
    "invoices:manage": [Permissions.INVOICES_CREATE, Permissions.INVOICES_READ, Permissions.INVOICES_UPDATE, Permissions.INVOICES_DELETE],
    "stock:manage": [Permissions.STOCK_CREATE, Permissions.STOCK_READ, Permissions.STOCK_UPDATE, Permissions.STOCK_DELETE],
    "kitchen:manage": [Permissions.KITCHEN_ACCESS],
    "deliveries:manage": [Permissions.DELIVERIES_READ, Permissions.DELIVERIES_UPDATE],
    "reports:manage": [Permissions.REPORTS_VIEW, Permissions.REPORTS_EXPORT],
    "hr:manage": [Permissions.HR_READ],
    "customers:manage": [Permissions.CUSTOMERS_READ],
    "users:manage": [Permissions.USERS_CREATE, Permissions.USERS_READ, Permissions.USERS_UPDATE, Permissions.USERS_DELETE],
    "drivers:manage": [Permissions.DRIVERS_READ, Permissions.DRIVERS_MANAGE],
    "settings:manage": [Permissions.SETTINGS_READ],
    "org:manage": [Permissions.ORG_READ],
    "pos:manage": [Permissions.POS_ACCESS],
  };

  for (const [manageKey, expanded] of Object.entries(manageExpand)) {
    if (set.has(manageKey)) {
      for (const p of expanded) {
        set.add(p);
      }
    }
  }

  return set;
}

// ============================================
// Role → Permissions Mapping
// ============================================

const SUPER_ADMIN_PERMISSIONS = ALL_PERMISSIONS;

const ADMIN_PERMISSIONS = expandPermissions([
  Permissions.ORDERS_MANAGE,
  Permissions.MENU_MANAGE,
  Permissions.POS_MANAGE,
  Permissions.RESERVATIONS_MANAGE,
  Permissions.REPORTS_MANAGE,
  Permissions.EXPENSES_MANAGE,
  Permissions.EXPENSES_APPROVE,
  Permissions.INVOICES_MANAGE,
  Permissions.HR_MANAGE,
  Permissions.CUSTOMERS_MANAGE,
  Permissions.USERS_MANAGE,
  Permissions.DRIVERS_MANAGE,
  Permissions.STOCK_MANAGE,
  Permissions.KITCHEN_MANAGE,
  Permissions.DELIVERIES_MANAGE,
  Permissions.SETTINGS_MANAGE,
  Permissions.PROFILE_OWN,
  Permissions.PROFILE_UPDATE_OWN,
]);

const MANAGER_PERMISSIONS = expandPermissions([
  Permissions.ORDERS_MANAGE,
  Permissions.MENU_CREATE,
  Permissions.MENU_READ,
  Permissions.MENU_UPDATE,
  Permissions.POS_MANAGE,
  Permissions.RESERVATIONS_MANAGE,
  Permissions.REPORTS_VIEW,
  Permissions.EXPENSES_MANAGE,
  Permissions.INVOICES_MANAGE,
  Permissions.HR_READ,
  Permissions.CUSTOMERS_READ,
  Permissions.DRIVERS_READ,
  Permissions.STOCK_READ,
  Permissions.PROFILE_OWN,
  Permissions.PROFILE_UPDATE_OWN,
]);

const STAFF_PERMISSIONS = expandPermissions([
  Permissions.POS_ACCESS,
  Permissions.ORDERS_CREATE,
  Permissions.ORDERS_READ,
  Permissions.MENU_READ,
  Permissions.RESERVATIONS_CREATE,
  Permissions.RESERVATIONS_READ,
  Permissions.PROFILE_OWN,
  Permissions.PROFILE_UPDATE_OWN,
]);

const KITCHEN_PERMISSIONS = expandPermissions([
  Permissions.KITCHEN_MANAGE,
  Permissions.KITCHEN_ACCESS,
  Permissions.MENU_READ,
  Permissions.STOCK_MANAGE,
  Permissions.STATS_VIEW,
  Permissions.PROFILE_OWN,
  Permissions.PROFILE_UPDATE_OWN,
]);

const DRIVER_PERMISSIONS = expandPermissions([
  Permissions.DELIVERIES_MANAGE,
  Permissions.DELIVERIES_READ,
  Permissions.DELIVERIES_UPDATE,
  Permissions.PROFILE_OWN,
  Permissions.PROFILE_UPDATE_OWN,
  Permissions.EARNINGS_OWN,
]);

const CUSTOMER_PERMISSIONS = expandPermissions([
  Permissions.MENU_READ,
  Permissions.ORDERS_CREATE,
  Permissions.ORDERS_READ,
  Permissions.RESERVATIONS_CREATE,
  Permissions.RESERVATIONS_READ,
  Permissions.PROFILE_OWN,
  Permissions.PROFILE_UPDATE_OWN,
]);

/**
 * Complete role-to-permissions map.
 * Use this to look up what a role is allowed to do.
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<string>> = {
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
  KITCHEN: KITCHEN_PERMISSIONS,
  DRIVER: DRIVER_PERMISSIONS,
  CUSTOMER: CUSTOMER_PERMISSIONS,
};

/**
 * Returns an array of permission strings for a given role.
 * Useful for API responses / client-side rendering.
 */
export function getPermissionsForRole(role: string): string[] {
  const perms = ROLE_PERMISSIONS[role as Role];
  if (!perms) return [];
  return Array.from(perms);
}

/**
 * Returns all defined permission strings in the system.
 */
export function getAllPermissions(): string[] {
  return Array.from(ALL_PERMISSIONS);
}

/**
 * Returns all defined roles in the system.
 */
export function getAllRoles(): Role[] {
  return Object.keys(ROLE_PERMISSIONS) as Role[];
}
