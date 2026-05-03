// ============================================
// KFM Délice — Role-Based Access Control (RBAC)
// ============================================
//
// Provides permission checking functions and an API-route helper
// that integrates with the existing JWT auth system.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ROLE_PERMISSIONS, type Role } from "@/lib/permissions";

// Re-export permission types for convenience
export { ROLE_PERMISSIONS, getPermissionsForRole, getAllPermissions, getAllRoles } from "@/lib/permissions";
export type { Role } from "@/lib/permissions";

// ============================================
// Core Permission Checks
// ============================================

/**
 * Check if a given role has a specific permission.
 *
 * @param userRole  - The role string (e.g. "MANAGER")
 * @param permission - The permission string (e.g. "orders:create")
 * @returns true if the role has the permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[userRole as Role];
  if (!perms) return false;
  return perms.has(permission);
}

/**
 * Check if a role has ANY of the given permissions.
 *
 * @param userRole   - The role string
 * @param permissions - Array of permission strings
 * @returns true if the role has at least one of the permissions
 */
export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(userRole, p));
}

/**
 * Check if a role has ALL of the given permissions.
 *
 * @param userRole    - The role string
 * @param permissions - Array of permission strings
 * @returns true if the role has every permission in the array
 */
export function hasAllPermissions(userRole: string, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(userRole, p));
}

/**
 * Throw an error if the role does not have the required permission.
 * Useful for early-exit validation in service functions.
 *
 * @param userRole   - The role string
 * @param permission - The required permission
 * @throws {PermissionDeniedError} if permission is missing
 */
export function requirePermission(userRole: string, permission: string): void {
  if (!hasPermission(userRole, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

/**
 * Throw an error if the role does not have ANY of the given permissions.
 *
 * @param userRole    - The role string
 * @param permissions - Array of acceptable permissions
 * @throws {PermissionDeniedError} if none match
 */
export function requireAnyPermission(userRole: string, permissions: string[]): void {
  if (!hasAnyPermission(userRole, permissions)) {
    throw new PermissionDeniedError(permissions.join(" OR "));
  }
}

// ============================================
// Custom Error
// ============================================

export class PermissionDeniedError extends Error {
  public readonly permission: string;
  public readonly statusCode = 403;

  constructor(permission: string) {
    super(`Permission denied: ${permission}`);
    this.name = "PermissionDeniedError";
    this.permission = permission;
  }
}

// ============================================
// API Route Helper
// ============================================

/**
 * Extracts the authenticated user from the request and verifies
 * they have the required permission. Returns the user info on success,
 * or an error NextResponse on failure.
 *
 * Usage in API routes:
 * ```ts
 * const userOrError = await checkPermission(req, "orders:create");
 * if (userOrError instanceof NextResponse) return userOrError; // 401 or 403
 * const user = userOrError; // { id, email, role, restaurantId }
 * ```
 *
 * @param req        - The incoming NextRequest
 * @param permission - The required permission string
 * @returns User object on success, or a NextResponse error on failure
 */
export async function checkPermission(
  req: NextRequest,
  permission: string
): Promise<
  | { id: string; email: string; role: string; restaurantId?: string }
  | NextResponse
> {
  // 1. Extract and verify JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // 2. Check permission
  if (!hasPermission(payload.role, permission)) {
    return NextResponse.json(
      {
        success: false,
        error: `Permission denied: ${permission}`,
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  // 3. Return user info
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * Higher-order variant: checks multiple permissions (any match).
 * Returns the user if they have at least one of the listed permissions.
 */
export async function checkAnyPermission(
  req: NextRequest,
  permissions: string[]
): Promise<
  | { id: string; email: string; role: string; restaurantId?: string }
  | NextResponse
> {
  // 1. Extract and verify JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // 2. Check any permission
  if (!hasAnyPermission(payload.role, permissions)) {
    return NextResponse.json(
      {
        success: false,
        error: `Permission denied: requires one of [${permissions.join(", ")}]`,
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * Check if the caller can query/inspect another role's permissions.
 * Only SUPER_ADMIN and ADMIN are allowed.
 */
export async function checkRoleQueryPermission(
  req: NextRequest
): Promise<{ id: string; role: string } | NextResponse> {
  const result = await checkPermission(req, "hr:read");
  if (result instanceof NextResponse) return result;
  // Only SUPER_ADMIN and ADMIN can query other roles' permissions
  if (result.role !== "SUPER_ADMIN" && result.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        error: "Only SUPER_ADMIN and ADMIN can query role permissions",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }
  return { id: result.id, role: result.role };
}
