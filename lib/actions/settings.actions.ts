"use server";

import { connectToDatabase } from "@/lib/database";
import Settings from "@/lib/database/models/settings.model";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";
import { checkWritePermissionServer } from "./permission-actions";

interface Owner {
  name: string;
  email: string;
}

interface SettingsDoc {
  _id: string;
  owners: Owner[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getSettings() {
  await connectToDatabase();

  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      owners: [
        { name: "Owner 1", email: "owner1@example.com" },
        { name: "Owner 2", email: "owner2@example.com" },
      ],
    });
  }

  return JSON.parse(JSON.stringify(settings));
}

export async function updateSettings(data: Partial<SettingsDoc>) {
  await checkWritePermissionServer("settings");
  await connectToDatabase();
  const user = await currentUser();

  const oldSettings = await Settings.findOne();
  let settings;

  if (oldSettings) {
    settings = await Settings.findByIdAndUpdate(oldSettings._id, data, {
      new: true,
    });
  } else {
    settings = await Settings.create(data);
  }

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Settings",
    action: "Update",
    description: "Updated settings",
    recordId: settings._id,
    oldData: JSON.parse(JSON.stringify(oldSettings)),
    newData: JSON.parse(JSON.stringify(settings)),
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/withdrawals");
  revalidatePath("/income");
  revalidatePath("/expenses");
  revalidatePath("/reports");
  return JSON.parse(JSON.stringify(settings));
}
