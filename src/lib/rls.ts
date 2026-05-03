// ============================================
// KFM Délice — Row-Level Security (Application-Level)
// ============================================
//
// Since SQLite does not support native RLS, we implement
// application-level filtering on every Prisma query.
//
// Each role only sees data scoped to:
//   - Their restaurant (tenant isolation)
//   - Their own resources (CUSTOMER, DRIVER)
//
// Models that support RLS:
//   Order, Payment, Delivery, Reservation, Expense,
//   Ingredient, StockMovement, MenuItem (via Menu)
// ============================================

import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/permissions";

// ============================================
// User Context for RLS
// ============================================

/** The minimal user context needed to apply RLS filters. */
export interface RLSUser {
  id: string;
  role: Role;
  /** The restaurant this user belongs to. Required for staff/admin. */
  restaurantId?: string;
}

// ============================================
// RLS Filter Builders
// ============================================

/**
 * Build a Prisma `where` clause for Order queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering (sees all)
 * - ADMIN: filter by their restaurantId
 * - MANAGER / STAFF: filter by their restaurantId
 * - KITCHEN: filter by their restaurantId
 * - DRIVER: filter to orders assigned to their deliveries
 * - CUSTOMER: filter to their own orders (via CustomerProfile.userId)
 */
export function orderRLSFilter(user: RLSUser): Prisma.OrderWhereInput {
  // Super admins see everything
  if (user.role === "SUPER_ADMIN") return {};

  // Tenant-level filtering for staff roles
  if (
    ["ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return { restaurantId: user.restaurantId };
  }

  // Driver: only orders assigned to their deliveries
  if (user.role === "DRIVER") {
    return {
      delivery: {
        driver: { userId: user.id },
      },
    };
  }

  // Customer: only their own orders
  if (user.role === "CUSTOMER") {
    return {
      customer: { userId: user.id },
    };
  }

  // Fallback: deny all (unknown role without restaurantId)
  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for Payment queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER / STAFF: filter by restaurantId on payment
 * - DRIVER: filter to payments for orders assigned to their deliveries
 * - CUSTOMER: filter to payments for their own orders
 */
export function paymentRLSFilter(user: RLSUser): Prisma.PaymentWhereInput {
  if (user.role === "SUPER_ADMIN") return {};

  if (
    ["ADMIN", "MANAGER", "STAFF"].includes(user.role) &&
    user.restaurantId
  ) {
    return { restaurantId: user.restaurantId };
  }

  if (user.role === "KITCHEN" && user.restaurantId) {
    return { restaurantId: user.restaurantId };
  }

  if (user.role === "DRIVER") {
    return {
      order: {
        delivery: {
          driver: { userId: user.id },
        },
      },
    };
  }

  if (user.role === "CUSTOMER") {
    return {
      order: {
        customer: { userId: user.id },
      },
    };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for Delivery queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER / STAFF: filter by restaurantId
 * - KITCHEN: filter by restaurantId
 * - DRIVER: only their own deliveries
 */
export function deliveryRLSFilter(user: RLSUser): Prisma.DeliveryWhereInput {
  if (user.role === "SUPER_ADMIN") return {};

  if (
    ["ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return { restaurantId: user.restaurantId };
  }

  if (user.role === "DRIVER") {
    return { driverId: user.id };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for Reservation queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER / STAFF: filter by restaurantId
 * - CUSTOMER: only their own reservations
 */
export function reservationRLSFilter(user: RLSUser): Prisma.ReservationWhereInput {
  if (user.role === "SUPER_ADMIN") return {};

  if (
    ["ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return { restaurantId: user.restaurantId };
  }

  if (user.role === "CUSTOMER") {
    return {
      customer: { userId: user.id },
    };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for Expense queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER: filter by restaurantId
 * - Others: deny all
 */
export function expenseRLSFilter(user: RLSUser): Prisma.ExpenseWhereInput {
  if (user.role === "SUPER_ADMIN") return {};

  if (["ADMIN", "MANAGER"].includes(user.role) && user.restaurantId) {
    return { restaurantId: user.restaurantId };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for Ingredient queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER / KITCHEN: filter by restaurantId
 */
export function ingredientRLSFilter(user: RLSUser): Prisma.IngredientWhereInput {
  if (user.role === "SUPER_ADMIN") return {};

  if (
    ["ADMIN", "MANAGER", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return { restaurantId: user.restaurantId };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for StockMovement queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER / KITCHEN: filter by restaurantId
 */
export function stockMovementRLSFilter(user: RLSUser): Prisma.StockMovementWhereInput {
  if (user.role === "SUPER_ADMIN") return {};

  if (
    ["ADMIN", "MANAGER", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return { restaurantId: user.restaurantId };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for MenuItem queries based on the user's role.
 *
 * - SUPER_ADMIN: no filtering
 * - ADMIN / MANAGER / STAFF / KITCHEN: filter via category → menu → restaurantId
 * - CUSTOMER: no filtering (public menu)
 */
export function menuItemRLSFilter(user: RLSUser): Prisma.MenuItemWhereInput {
  if (user.role === "SUPER_ADMIN") return {};
  if (user.role === "CUSTOMER") return {}; // Public menu is readable

  if (
    ["ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return {
      category: {
        menu: {
          restaurantId: user.restaurantId,
        },
      },
    };
  }

  return { id: "NEVER_MATCH" };
}

/**
 * Build a Prisma `where` clause for MenuCategory queries based on the user's role.
 */
export function menuCategoryRLSFilter(user: RLSUser): Prisma.MenuCategoryWhereInput {
  if (user.role === "SUPER_ADMIN") return {};
  if (user.role === "CUSTOMER") return {};

  if (
    ["ADMIN", "MANAGER", "STAFF", "KITCHEN"].includes(user.role) &&
    user.restaurantId
  ) {
    return {
      menu: {
        restaurantId: user.restaurantId,
      },
    };
  }

  return { id: "NEVER_MATCH" };
}

// ============================================
// Convenience: Apply RLS to a user
// ============================================

/** All available RLS filter functions keyed by Prisma model name. */
export const RLS_FILTERS = {
  order: orderRLSFilter,
  payment: paymentRLSFilter,
  delivery: deliveryRLSFilter,
  reservation: reservationRLSFilter,
  expense: expenseRLSFilter,
  ingredient: ingredientRLSFilter,
  stockMovement: stockMovementRLSFilter,
  menuItem: menuItemRLSFilter,
  menuCategory: menuCategoryRLSFilter,
} as const;

/**
 * Get the RLS filter for a given model name.
 * Returns an empty filter for unknown models (no restriction).
 */
export function getRLSFilter(
  model: string,
  user: RLSUser
): Record<string, unknown> {
  const filterFn = (RLS_FILTERS as Record<string, (u: RLSUser) => Record<string, unknown>>)[model];
  if (!filterFn) return {};
  return filterFn(user);
}

/**
 * Merge an RLS filter into an existing `where` clause.
 * Handles both cases where the existing where may already have conditions.
 */
export function mergeRLSFilter(
  existingWhere: Record<string, unknown>,
  rlsFilter: Record<string, unknown>
): Record<string, unknown> {
  // If RLS filter is empty, return existing
  if (Object.keys(rlsFilter).length === 0) return existingWhere;

  // If existing where is empty, return RLS filter
  if (Object.keys(existingWhere).length === 0) return rlsFilter;

  // If existing where has an AND, push the RLS filter into it
  if (existingWhere.AND && Array.isArray(existingWhere.AND)) {
    return {
      ...existingWhere,
      AND: [...existingWhere.AND, rlsFilter],
    };
  }

  // Otherwise, combine with AND
  return {
    AND: [existingWhere, rlsFilter],
  };
}
