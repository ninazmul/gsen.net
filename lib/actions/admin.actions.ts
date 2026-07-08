"use server";

import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log.actions";

export async function checkIsAdmin(): Promise<boolean> {
  await connectToDatabase();
  const user = await currentUser();
  if (!user) return false;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return false;

  const admin = await Admin.findOne({ email });
  return !!admin;
}

export async function getAdmins() {
  await connectToDatabase();
  const admins = await Admin.find();
  return JSON.parse(JSON.stringify(admins));
}

export async function createAdmin(email: string) {
  await connectToDatabase();
  const user = await currentUser();

  const admin = await Admin.create({ email });

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

export async function deleteAdmin(id: string) {
  await connectToDatabase();
  const user = await currentUser();

  const adminToDelete = await Admin.findById(id);
  if (!adminToDelete) throw new Error("Admin not found");

  // Check if this is the last admin
  const adminsCount = await Admin.countDocuments();
  if (adminsCount <= 1) {
    throw new Error("Cannot delete the last admin");
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
      admin = await Admin.create({ email });
    } else {
      // Otherwise, return null to prevent access
      return null;
    }
  }

  return JSON.parse(JSON.stringify(admin));
}
