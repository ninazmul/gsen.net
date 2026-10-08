"use server";

import { connectToDatabase } from "@/lib/database";
import Settlement from "@/lib/database/models/settlement.model";
import Withdrawal from "@/lib/database/models/withdrawal.model";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";
import { checkWritePermissionServer } from "./permission-actions";

export async function createSettlementPayment(data: {
  fromOwner: string;
  toOwner: string;
  amount: number;
  paymentMethod: "Cash" | "Bank Transfer";
  month?: number;
  year?: number;
  notes?: string;
}) {
  await checkWritePermissionServer("withdrawals");
  await connectToDatabase();
  const user = await currentUser();
  const adminEmail = user?.emailAddresses[0]?.emailAddress || "";

  // 1. Create settlement record
  const settlement = await Settlement.create({
    fromOwner: data.fromOwner,
    toOwner: data.toOwner,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    date: new Date(),
    month: data.month,
    year: data.year,
    notes: data.notes,
    createdAdminEmail: adminEmail,
  });

  // 2. Also record withdrawal for the recipient so withdrawn balance reflects in Section 3
  await Withdrawal.create({
    owner: data.toOwner,
    amount: data.amount,
    date: new Date(),
    description: `Settlement payment received from ${data.fromOwner} (${data.paymentMethod})`,
  });

  // 3. Log activity
  await logActivity({
    adminEmail,
    module: "Withdrawal",
    action: "Create",
    description: `Settlement Payment: ${data.fromOwner} paid ${data.toOwner} ${data.amount} SAR via ${data.paymentMethod}`,
    recordId: settlement._id,
    newData: JSON.parse(JSON.stringify(settlement)),
  });

  revalidatePath("/");
  revalidatePath("/withdrawals");

  return JSON.parse(JSON.stringify(settlement));
}

export async function getSettlements() {
  await connectToDatabase();
  const settlements = await Settlement.find().sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(settlements));
}
