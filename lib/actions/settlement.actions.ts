"use server";

import { connectToDatabase } from "@/lib/database";
import Settlement from "@/lib/database/models/settlement.model";
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

  const trimmedNotes = data.notes?.trim() || undefined;

  // Create settlement record only — no withdrawal side-effects
  const settlement = await Settlement.create({
    fromOwner: data.fromOwner,
    toOwner: data.toOwner,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    date: new Date(),
    month: data.month,
    year: data.year,
    notes: trimmedNotes,
    createdAdminEmail: adminEmail,
  });

  // Log activity with note if available
  const noteSnippet = trimmedNotes ? ` (Note: ${trimmedNotes})` : "";
  await logActivity({
    adminEmail,
    module: "Settlement",
    action: "Create",
    description: `Settlement Payment: ${data.fromOwner} paid ${data.toOwner} ${data.amount} SAR via ${data.paymentMethod}${noteSnippet}`,
    recordId: settlement._id,
    newData: JSON.parse(JSON.stringify(settlement)),
  });

  revalidatePath("/");

  return JSON.parse(JSON.stringify(settlement));
}

export async function deleteSettlementPayment(settlementId: string) {
  await checkWritePermissionServer("withdrawals");
  await connectToDatabase();
  const user = await currentUser();
  const adminEmail = user?.emailAddresses[0]?.emailAddress || "";

  const settlement = await Settlement.findById(settlementId);
  if (!settlement) {
    throw new Error("Settlement record not found");
  }

  await Settlement.findByIdAndDelete(settlementId);

  await logActivity({
    adminEmail,
    module: "Settlement",
    action: "Delete",
    description: `Deleted Settlement Payment: ${settlement.fromOwner} to ${settlement.toOwner} of ${settlement.amount} SAR`,
    recordId: settlementId,
    oldData: JSON.parse(JSON.stringify(settlement)),
  });

  revalidatePath("/");

  return { success: true };
}

export async function getSettlements(month?: number, year?: number) {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (month !== undefined && month !== null && month > 0) {
    query.month = month;
  }
  if (year !== undefined && year !== null) {
    query.year = year;
  }
  const settlements = await Settlement.find(query).sort({ date: -1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(settlements));
}
