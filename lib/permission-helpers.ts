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
      return perms.pages.dashboard;
    case "income":
      if (access === "read")
        return perms.pages.income?.read;
      return perms.pages.income?.write;
    case "expenses":
      if (access === "read")
        return perms.pages.expenses?.read;
      return perms.pages.expenses?.write;
    case "categories":
      if (access === "read")
        return perms.pages.categories?.read;
      return perms.pages.categories?.write;
    case "withdrawals":
      if (access === "read")
        return perms.pages.withdrawals?.read;
      return perms.pages.withdrawals?.write;
    case "reports":
      return perms.pages.reports;
    case "activityLogs":
      return perms.pages.activityLogs;
    case "admins":
      return perms.pages.admins;
    case "settings":
      return perms.pages.settings;
    default:
      return false;
  }
}

export function hasPageAccess(
  admin: Admin | null,
  path: string,
): boolean {
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
