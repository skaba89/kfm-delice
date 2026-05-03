// ============================================
// KFM Délice — Prisma Client Extension with RLS
// ============================================
//
// Provides a `withRLS(user)` extension that wraps common
// Prisma query methods (findMany, findFirst, findUnique,
// count, updateMany, deleteMany) with automatic row-level
// security filtering.
//
// Usage:
// ```ts
// import { db } from "@/lib/db";
// import { withRLS } from "@/lib/prisma-extensions";
//
// const secureDb = withRLS(db, { id: userId, role: "MANAGER", restaurantId: "abc" });
// const orders = await secureDb.order.findMany({ where: { status: "PENDING" } });
// // → Automatically scoped to the user's restaurant
// ```
// ============================================

import type { RLSUser } from "@/lib/rls";
import {
  orderRLSFilter,
  paymentRLSFilter,
  deliveryRLSFilter,
  reservationRLSFilter,
  expenseRLSFilter,
  ingredientRLSFilter,
  stockMovementRLSFilter,
  menuItemRLSFilter,
  menuCategoryRLSFilter,
  mergeRLSFilter,
} from "@/lib/rls";

/**
 * Wrap a Prisma client (or transaction client) with RLS-scoped query methods.
 * Returns a proxied client that automatically injects tenant/owner filters.
 *
 * This does NOT modify the original client — it creates a lightweight wrapper.
 */
export function withRLS<T extends PrismaClientLike>(
  prisma: T,
  user: RLSUser
): RLSExtendedClient<T> {
  return new Proxy(prisma, {
    get(target, prop) {
      // Intercept model-level access (e.g., db.order, db.payment)
      const modelKey = String(prop);
      const modelFilters: Record<string, (u: RLSUser) => Record<string, unknown>> = {
        order: orderRLSFilter,
        payment: paymentRLSFilter,
        delivery: deliveryRLSFilter,
        reservation: reservationRLSFilter,
        expense: expenseRLSFilter,
        ingredient: ingredientRLSFilter,
        stockMovement: stockMovementRLSFilter,
        menuItem: menuItemRLSFilter,
        menuCategory: menuCategoryRLSFilter,
      };

      const filterFn = modelFilters[modelKey];
      if (!filterFn) {
        // No RLS for this model — return original
        return (target as Record<string, unknown>)[prop];
      }

      const rlsFilter = filterFn(user);

      // Get the original Prisma model delegate
      const modelDelegate = (target as Record<string, unknown>)[modelKey] as Record<
        string,
        unknown
      >;

      // Return a proxy for the model delegate
      return new Proxy(modelDelegate, {
        get(modelTarget, method) {
          const methodName = String(method);

          // Methods that need RLS filtering on the `where` clause
          const filteredMethods = ["findMany", "findFirst", "findUnique", "count", "updateMany", "deleteMany"];

          if (filteredMethods.includes(methodName)) {
            const originalMethod = modelTarget[methodName] as (...args: unknown[]) => Promise<unknown>;

            return function (this: unknown, ...args: unknown[]) {
              // The first arg is typically { where, ...options }
              if (args.length > 0 && args[0] && typeof args[0] === "object") {
                const options = args[0] as Record<string, unknown>;

                // Merge RLS filter into the `where` clause
                if (Object.keys(rlsFilter).length > 0) {
                  const existingWhere = (options.where as Record<string, unknown>) || {};
                  options.where = mergeRLSFilter(existingWhere, rlsFilter);
                }

                return originalMethod.apply(modelTarget, [options]);
              }

              // No options — apply RLS as the entire where clause
              if (Object.keys(rlsFilter).length > 0) {
                return originalMethod.apply(modelTarget, [{ where: rlsFilter }]);
              }

              return originalMethod.apply(modelTarget, args);
            };
          }

          // For other methods (create, update, upsert, aggregate, etc.),
          // return the original method without RLS on reads
          return modelTarget[methodName];
        },
      });
    },
  }) as unknown as RLSExtendedClient<T>;
}

// ============================================
// Types
// ============================================

/**
 * Minimal interface matching the Prisma client shape we need.
 * This avoids importing the full PrismaClient type everywhere.
 */
export interface PrismaClientLike {
  [key: string]: unknown;
}

/**
 * Extended client type — same shape as input but with RLS applied.
 */
export type RLSExtendedClient<T> = T & {
  [K in keyof T]: T[K];
};

// ============================================
// Helper: Resolve user's restaurantId
// ============================================

/**
 * Given a user ID, look up their restaurantId from the DB.
 * Checks Driver table first (for DRIVER role), then CustomerProfile,
 * then falls back to the first active restaurant.
 *
 * This is a convenience function for API routes that need to build
 * an RLSUser context from a JWT payload.
 */
export async function resolveUserRestaurantId(
  userId: string,
  role: string
): Promise<string | undefined> {
  // SUPER_ADMIN has no restaurant restriction — return undefined
  if (role === "SUPER_ADMIN") return undefined;

  const { db } = await import("@/lib/db");

  // Try Driver table
  if (role === "DRIVER") {
    const driver = await db.driver.findFirst({
      where: { userId },
      select: { restaurantId: true },
    });
    return driver?.restaurantId;
  }

  // Try CustomerProfile
  if (role === "CUSTOMER") {
    const profile = await db.customerProfile.findFirst({
      where: { userId },
      select: { restaurantId: true },
    });
    return profile?.restaurantId;
  }

  // For ADMIN, MANAGER, STAFF, KITCHEN — look up from first active restaurant
  // In a more complex system, users would have a direct restaurantId field.
  // For now, we use the first active restaurant as the default.
  const restaurant = await db.restaurant.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return restaurant?.id;
}

/**
 * Build a complete RLSUser object from a user ID and role.
 * Automatically resolves the restaurantId.
 */
export async function buildRLSUser(
  userId: string,
  role: string
): Promise<import("@/lib/rls").RLSUser> {
  const restaurantId = await resolveUserRestaurantId(userId, role);
  return {
    id: userId,
    role: role as import("@/lib/permissions").Role,
    restaurantId,
  };
}
