"use server";

import { connectToDatabase } from "@/lib/database";
import Withdrawal from "@/lib/database/models/withdrawal.model";
import Income from "@/lib/database/models/income.model";
import Expense from "@/lib/database/models/expense.model";
import { revalidatePath } from "next/cache";
import type { FilterQuery } from "mongoose";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";
import { checkWritePermissionServer } from "./permission-actions";

interface WithdrawalDoc {
  _id: string;
  owner: string;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getOwnerBalance(ownerName: string): Promise<number> {
  await connectToDatabase();

  const totalIncome = await Income.aggregate([
    { $match: { deletedAt: null, owner: ownerName } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalExpenses = await Expense.aggregate([
    { $match: { deletedAt: null, owner: ownerName } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const income = totalIncome[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;

  const totalWithdrawn = await Withdrawal.aggregate([
    { $match: { owner: ownerName } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const withdrawn = totalWithdrawn[0]?.total || 0;

  return income - expenses - withdrawn;
}

export async function createWithdrawal(data: {
  owner: string;
  amount: number;
  date: Date;
  description?: string;
}) {
  await checkWritePermissionServer("withdrawals");
  await connectToDatabase();
  const user = await currentUser();

  // Check available balance
  const availableBalance = await getOwnerBalance(data.owner);
  if (data.amount > availableBalance) {
    throw new Error(
      `Insufficient balance. Available: ৳${availableBalance.toFixed(2)}`,
    );
  }

  const withdrawal = await Withdrawal.create(data);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Withdrawal",
    action: "Create",
    description: `Created withdrawal for ${data.owner}`,
    recordId: withdrawal._id,
    newData: JSON.parse(JSON.stringify(withdrawal)),
  });

  revalidatePath("/withdrawals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(withdrawal));
}

export async function getWithdrawals(params?: {
  owner?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  const {
    owner,
    startDate,
    endDate,
    search = "",
    page = 1,
    limit = 10,
  } = params || {};
  const skip = (page - 1) * limit;

  const query: FilterQuery<WithdrawalDoc> = {};

  if (owner) query.owner = owner;
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  if (search) {
    query.$or = [
      { owner: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const withdrawals = await Withdrawal.find<WithdrawalDoc>(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Withdrawal.countDocuments(query);

  return {
    withdrawals: JSON.parse(JSON.stringify(withdrawals)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateWithdrawal(
  id: string,
  data: Partial<WithdrawalDoc>,
) {
  await checkWritePermissionServer("withdrawals");
  await connectToDatabase();
  const user = await currentUser();

  const oldWithdrawal = await Withdrawal.findById<WithdrawalDoc>(id);
  if (!oldWithdrawal) {
    throw new Error("Withdrawal not found");
  }

  // Check available balance if amount or owner is changed
  if (data.amount !== undefined || data.owner !== undefined) {
    const newOwner = data.owner || oldWithdrawal.owner;
    const newAmount =
      data.amount !== undefined ? data.amount : oldWithdrawal.amount;

    // Calculate what the balance would be after this change
    // Temporarily "undo" the old withdrawal for calculation
    const totalIncome = await Income.aggregate([
      { $match: { deletedAt: null, owner: newOwner } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = await Expense.aggregate([
      { $match: { deletedAt: null, owner: newOwner } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const income = totalIncome[0]?.total || 0;
    const expenses = totalExpenses[0]?.total || 0;

    // Get total withdrawals excluding this one
    const totalWithdrawn = await Withdrawal.aggregate([
      { $match: { owner: newOwner, _id: { $ne: oldWithdrawal._id } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const withdrawn = totalWithdrawn[0]?.total || 0;

    const availableBalance = income - expenses - withdrawn;
    if (newAmount > availableBalance) {
      throw new Error(
        `Insufficient balance. Available: ৳${availableBalance.toFixed(2)}`,
      );
    }
  }

  const withdrawal = await Withdrawal.findByIdAndUpdate<WithdrawalDoc>(
    id,
    data,
    { new: true },
  );

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Withdrawal",
    action: "Update",
    description: `Updated withdrawal for ${oldWithdrawal?.owner}`,
    recordId: withdrawal?._id,
    oldData: JSON.parse(JSON.stringify(oldWithdrawal)),
    newData: JSON.parse(JSON.stringify(withdrawal)),
  });

  revalidatePath("/withdrawals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(withdrawal));
}

export async function deleteWithdrawal(id: string) {
  await checkWritePermissionServer("withdrawals");
  await connectToDatabase();
  const user = await currentUser();

  const withdrawal = await Withdrawal.findById<WithdrawalDoc>(id);
  await Withdrawal.findByIdAndDelete(id);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Withdrawal",
    action: "Delete",
    description: `Deleted withdrawal for ${withdrawal?.owner}`,
    recordId: withdrawal?._id,
    oldData: JSON.parse(JSON.stringify(withdrawal)),
  });

  revalidatePath("/withdrawals");
  revalidatePath("/");
}
