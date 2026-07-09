import { type Admin, type AdminPermissions } from "./actions/admin.actions";

export function hasPermission(
  admin: Admin | null,
  page: keyof AdminPermissions["pages"],
  access: "read" | "write" = "read",
): boolean {
  if (!admin) return false;
  if (admin.role === "superadmin") return true;

  const perms = admin.permissions;
  if (!perms) return false;

  switch (page) {
    case "dashboard":
      return perms.pages.dashboard ?? true;
    case "income":
      if (access === "read") return perms.pages.income?.read ?? true;
      return perms.pages.income?.write ?? true;
    case "expenses":
      if (access === "read") return perms.pages.expenses?.read ?? true;
      return perms.pages.expenses?.write ?? true;
    case "categories":
      if (access === "read") return perms.pages.categories?.read ?? true;
      return perms.pages.categories?.write ?? true;
    case "withdrawals":
      if (access === "read") return perms.pages.withdrawals?.read ?? true;
      return perms.pages.withdrawals?.write ?? true;
    case "reports":
      return perms.pages.reports ?? true;
    case "activityLogs":
      return perms.pages.activityLogs ?? true;
    case "admins":
      return perms.pages.admins ?? false;
    case "settings":
      return perms.pages.settings ?? false;
    default:
      return false;
  }
}

export function hasPageAccess(admin: Admin | null, path: string): boolean {
  if (!admin) return false;
  if (admin.role === "superadmin") return true;

  const pathMap: Record<string, keyof AdminPermissions["pages"]> = {
    "/": "dashboard",
    "/income": "income",
    "/expenses": "expenses",
    "/categories": "categories",
    "/withdrawals": "withdrawals",
    "/reports": "reports",
    "/activity-logs": "activityLogs",
    "/admins": "admins",
    "/settings": "settings",
  };

  const page = pathMap[path];
  if (!page) return false;
  return hasPermission(admin, page, "read");
}
