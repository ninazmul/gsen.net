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
import { getSettings } from "./settings.actions";

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

export async function getWithdrawalBalances(): Promise<{
  ownerBalances: { name: string; email: string; balance: number }[];
  totalBalance: number;
}> {
  await connectToDatabase();
  const settings = await getSettings();
  const owners = settings?.owners || [];

  const totalIncomeByOwner = await Income.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: "$owner",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const totalExpensesByOwner = await Expense.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: "$owner",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const withdrawals = await Withdrawal.aggregate([
    {
      $group: {
        _id: "$owner",
        totalWithdrawn: { $sum: "$amount" },
      },
    },
  ]);

  let totalBalance = 0;
  const ownerBalances = (owners as { name: string; email: string }[]).map(
    (owner) => {
      const totalIncome =
        totalIncomeByOwner.find((i) => i._id === owner.name)?.total || 0;
      const totalExpenses =
        totalExpensesByOwner.find((e) => e._id === owner.name)?.total || 0;
      const withdrawn =
        withdrawals.find((w) => w._id === owner.name)?.totalWithdrawn || 0;
      const balance = totalIncome - totalExpenses - withdrawn;
      totalBalance += balance;

      return {
        name: owner.name,
        email: owner.email,
        balance,
      };
    },
  );

  return {
    ownerBalances,
    totalBalance,
  };
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

  // Check total available balance (no need to limit to owner's own balance)
  const { totalBalance } = await getWithdrawalBalances();
  if (data.amount > totalBalance) {
    throw new Error(
      `Insufficient balance. Total Available: ⃁${totalBalance.toFixed(2)}`,
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

  // Check total available balance if amount or owner is changed (no need to limit to owner's own balance)
  if (data.amount !== undefined || data.owner !== undefined) {
    const newAmount =
      data.amount !== undefined ? data.amount : oldWithdrawal.amount;

    const { totalBalance } = await getWithdrawalBalances();
    // Since totalBalance includes the old withdrawal, the true total balance before this withdrawal was:
    const baseTotalBalance = totalBalance + oldWithdrawal.amount;

    if (newAmount > baseTotalBalance) {
      throw new Error(
        `Insufficient balance. Total Available: ⃁${baseTotalBalance.toFixed(2)}`,
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
