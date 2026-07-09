"use server";

import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log.actions";
import { requireSuperAdmin } from "./permission-actions";

// Type definitions
export interface AdminPermissions {
  pages: {
    dashboard: boolean;
    income: { read: boolean; write: boolean };
    expenses: { read: boolean; write: boolean };
    categories: { read: boolean; write: boolean };
    withdrawals: { read: boolean; write: boolean };
    reports: boolean;
    activityLogs: boolean;
    admins: boolean;
    settings: boolean;
  };
}

export interface Admin {
  _id: string;
  email: string;
  role: "admin" | "superadmin";
  permissions: AdminPermissions;
  createdAt: Date;
  updatedAt: Date;
}

export async function checkIsAdmin(): Promise<boolean> {
  await connectToDatabase();
  const user = await currentUser();
  if (!user) return false;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return false;

  const admin = await Admin.findOne({ email });
  return !!admin;
}

export async function getCurrentAdmin() {
  await connectToDatabase();
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const admin = await Admin.findOne({ email });
  return JSON.parse(JSON.stringify(admin));
}

export async function getAdmins() {
  await connectToDatabase();
  const admins = await Admin.find();
  return JSON.parse(JSON.stringify(admins));
}

export async function createAdmin(
  email: string,
  role?: "admin" | "superadmin",
  permissions?: Partial<AdminPermissions>,
) {
  await requireSuperAdmin();
  await connectToDatabase();
  const user = await currentUser();

  const admin = await Admin.create({
    email,
    role: role || "admin",
    permissions,
  });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Admin",
    action: "Create",
    description: `Created admin: ${email}`,
    recordId: admin._id,
    newData: JSON.parse(JSON.stringify(admin)),
  });

  revalidatePath("/admins");
  return JSON.parse(JSON.stringify(admin));
}

export async function updateAdmin(
  id: string,
  data: {
    role?: "admin" | "superadmin";
    permissions?: Partial<AdminPermissions>;
  },
) {
  await requireSuperAdmin();
  await connectToDatabase();
  const user = await currentUser();

  const oldAdmin = await Admin.findById(id);
  if (!oldAdmin) throw new Error("Admin not found");

  // Deep merge permissions instead of replacing
  const updateData: {
    role?: "admin" | "superadmin";
    permissions?: AdminPermissions;
  } = {};
  if (data.role) updateData.role = data.role;
  if (data.permissions) {
    // Start with old permissions as base
    // Convert to plain object to avoid mongoose subdocument spread issues
    const oldPerms = oldAdmin.permissions
      ? typeof oldAdmin.permissions.toObject === "function"
        ? oldAdmin.permissions.toObject()
        : JSON.parse(JSON.stringify(oldAdmin.permissions))
      : {};
    const mergedPages = { ...oldPerms?.pages };

    // Deep merge nested permission objects first
    const nestedPages = ["income", "expenses", "categories", "withdrawals"];
    nestedPages.forEach((page) => {
      if (data.permissions!.pages?.[page as keyof AdminPermissions["pages"]]) {
        mergedPages[page as keyof AdminPermissions["pages"]] = {
          ...(oldPerms?.pages?.[
            page as keyof AdminPermissions["pages"]
          ] as object),
          ...(data.permissions!.pages![
            page as keyof AdminPermissions["pages"]
          ] as object),
        };
      }
    });

    // Then merge top-level boolean permissions
    const booleanPages = [
      "dashboard",
      "reports",
      "activityLogs",
      "admins",
      "settings",
    ];
    booleanPages.forEach((page) => {
      if (
        data.permissions!.pages?.[page as keyof AdminPermissions["pages"]] !==
        undefined
      ) {
        mergedPages[page as keyof AdminPermissions["pages"]] =
          data.permissions!.pages![page as keyof AdminPermissions["pages"]];
      }
    });

    updateData.permissions = {
      ...oldPerms,
      pages: mergedPages,
    } as AdminPermissions;
  }

  const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Admin",
    action: "Update",
    description: `Updated admin: ${oldAdmin.email}`,
    recordId: admin?._id,
    oldData: JSON.parse(JSON.stringify(oldAdmin)),
    newData: JSON.parse(JSON.stringify(admin)),
  });

  revalidatePath("/admins");
  return JSON.parse(JSON.stringify(admin));
}

export async function deleteAdmin(id: string) {
  await requireSuperAdmin();
  await connectToDatabase();
  const user = await currentUser();

  const adminToDelete = await Admin.findById(id);
  if (!adminToDelete) throw new Error("Admin not found");

  // Check if this is the last superadmin
  if (adminToDelete.role === "superadmin") {
    const superAdminsCount = await Admin.countDocuments({
      role: "superadmin",
    });
    if (superAdminsCount <= 1) {
      throw new Error("Cannot delete the last superadmin");
    }
  }

  await Admin.findByIdAndDelete(id);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Admin",
    action: "Delete",
    description: `Deleted admin: ${adminToDelete.email}`,
    recordId: adminToDelete._id,
    oldData: JSON.parse(JSON.stringify(adminToDelete)),
  });

  revalidatePath("/admins");
}

export async function getOrCreateCurrentAdmin() {
  await connectToDatabase();
  const user = await currentUser();

  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  let admin = await Admin.findOne({ email });

  if (!admin) {
    // Only create admin if there are no existing admins (first user)
    const existingAdminsCount = await Admin.countDocuments();
    if (existingAdminsCount === 0) {
      admin = await Admin.create({
        email,
        role: "superadmin",
      });
    } else {
      // Otherwise, return null to prevent access
      return null;
    }
  }

  return JSON.parse(JSON.stringify(admin));
}
