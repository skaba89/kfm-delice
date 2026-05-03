// ============================================
// GET /api/permissions/:role — Get permissions for a role
// ============================================
// Only SUPER_ADMIN and ADMIN can query other roles.
// Returns the full list of permissions assigned to the role.
// ============================================

import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { checkRoleQueryPermission } from "@/lib/rbac";
import { getPermissionsForRole, getAllRoles } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    // 1. Verify the caller has permission to query role permissions
    const authResult = await checkRoleQueryPermission(req);
    if (authResult instanceof globalThis.Response) return authResult;

    // 2. Get the requested role from URL params
    const { role } = await params;

    if (!role) {
      return error("Role parameter is required", 400);
    }

    // Validate the role exists
    const validRoles = getAllRoles();
    if (!validRoles.includes(role as typeof validRoles[number])) {
      return error(
        `Invalid role. Valid roles: ${validRoles.join(", ")}`,
        400
      );
    }

    // 3. Return the permissions for this role
    const permissions = getPermissionsForRole(role);

    return success({
      role,
      permissions,
      totalPermissions: permissions.length,
    });
  } catch (err) {
    console.error("[PERMISSIONS GET]", err);
    return error("Internal server error", 500);
  }
}
