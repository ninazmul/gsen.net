"use server";

import { getCurrentAdmin, type AdminPermissions } from "./admin.actions";
import { hasPageAccess, hasPermission } from "@/lib/permission-helpers";

export async function checkPagePermissionServer(
  path: string
): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return hasPageAccess(admin, path as any);
}

/**
 * Checks if the current admin has write permission for a specific page.
 * Throws an error if the admin does not have write access.
 */
export async function checkWritePermissionServer(
  page: keyof AdminPermissions["pages"]
): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized: Not logged in");
  if (!hasPermission(admin, page, "write")) {
    throw new Error("Unauthorized: You do not have write access to this module");
  }
}

/**
 * Checks if the current admin is a superadmin.
 * Throws an error if they are not.
 */
export async function requireSuperAdmin(): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized: Not logged in");
  if (admin.role !== "superadmin") {
    throw new Error("Unauthorized: Only super admins can perform this action");
  }
}
