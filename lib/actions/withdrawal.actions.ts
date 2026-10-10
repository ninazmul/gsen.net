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
import { getCurrentAdmin } from "./admin.actions";

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

export interface OwnerSettlementInfo {
  ownerName: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  numOwners: number;
  profitShare: number;
  alreadyWithdrawn: number;
  availableSettlement: number;
  totalBusinessBalance: number;
  maxWithdrawable: number;
}

export async function getOwnerSettlementWithdrawalInfo(
  ownerName?: string,
): Promise<OwnerSettlementInfo> {
  await connectToDatabase();
  const settings = await getSettings();
  const owners = (settings?.owners || []) as { name: string; email: string }[];
  const numOwners = owners.length || 1;

  let targetOwner = ownerName;
  if (!targetOwner) {
    const admin = await getCurrentAdmin();
    const match = owners.find(
      (o) =>
        o.email &&
        admin?.email &&
        o.email.trim().toLowerCase() === admin.email.trim().toLowerCase(),
    );
    targetOwner = match?.name || "";
  }

  // 1. Calculate Total Income and Total Expenses (matching dashboard Section 3)
  const [totalIncomeRes, totalExpenseRes, totalWithdrawalsRes] = await Promise.all([
    Income.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Withdrawal.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalIncome = totalIncomeRes[0]?.total || 0;
  const totalExpense = totalExpenseRes[0]?.total || 0;
  const totalWithdrawnAll = totalWithdrawalsRes[0]?.total || 0;
  const netProfit = totalIncome - totalExpense;
  const totalBusinessBalance = Math.max(0, netProfit - totalWithdrawnAll);

  // 2. Equal Profit Share per owner calculated from Net Profit
  const profitShare = numOwners > 0 ? netProfit / numOwners : 0;

  // 3. Target owner's already withdrawn total
  const ownerWithdrawalRes = targetOwner
    ? await Withdrawal.aggregate([
        { $match: { owner: targetOwner } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
    : [];
  const alreadyWithdrawn = ownerWithdrawalRes[0]?.total || 0;

  // 4. Available Settlement Amount from Dashboard: profitShare - alreadyWithdrawn
  const availableSettlement = Math.max(0, profitShare - alreadyWithdrawn);

  // 5. Max Withdrawable cannot exceed available settlement nor company treasury
  const maxWithdrawable = Math.min(availableSettlement, totalBusinessBalance);

  return {
    ownerName: targetOwner || "",
    totalIncome,
    totalExpense,
    netProfit,
    numOwners,
    profitShare,
    alreadyWithdrawn,
    availableSettlement,
    totalBusinessBalance,
    maxWithdrawable,
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
  const admin = await getCurrentAdmin();

  const settings = await getSettings();
  const owners = (settings?.owners || []) as { name: string; email: string }[];

  // Find owner matching logged-in admin email
  const matchingOwner = owners.find(
    (o) =>
      o.email &&
      admin?.email &&
      o.email.trim().toLowerCase() === admin.email.trim().toLowerCase(),
  );

  if (!matchingOwner) {
    throw new Error("Only registered business owners can perform withdrawals.");
  }

  // Force owner to only withdraw for his own
  const ownerName = matchingOwner.name;

  // Calculate settlement withdrawal limit (from dashboard net profit and expense)
  const settlementInfo = await getOwnerSettlementWithdrawalInfo(ownerName);

  if (settlementInfo.availableSettlement <= 0) {
    throw new Error(
      "You have reached your maximum profit share withdrawal limit (0.00 SAR available).",
    );
  }

  if (data.amount > settlementInfo.availableSettlement) {
    throw new Error(
      `Amount exceeds your available settlement limit of ${settlementInfo.availableSettlement.toFixed(2)} SAR (based on net profit share).`,
    );
  }

  if (data.amount > settlementInfo.totalBusinessBalance) {
    throw new Error(
      `Amount exceeds available company treasury balance of ${settlementInfo.totalBusinessBalance.toFixed(2)} SAR.`,
    );
  }

  const withdrawal = await Withdrawal.create({
    owner: ownerName,
    amount: data.amount,
    date: data.date,
    description: data.description,
  });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Withdrawal",
    action: "Create",
    description: `Created withdrawal for ${ownerName} of ${data.amount} SAR`,
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
  const admin = await getCurrentAdmin();

  const oldWithdrawal = await Withdrawal.findById<WithdrawalDoc>(id);
  if (!oldWithdrawal) {
    throw new Error("Withdrawal not found");
  }

  const settings = await getSettings();
  const owners = (settings?.owners || []) as { name: string; email: string }[];

  const matchingOwner = owners.find(
    (o) =>
      o.email &&
      admin?.email &&
      o.email.trim().toLowerCase() === admin.email.trim().toLowerCase(),
  );

  // Non-superadmins can only edit their own withdrawals
  if (admin?.role !== "superadmin" && matchingOwner?.name !== oldWithdrawal.owner) {
    throw new Error("You can only modify your own withdrawals.");
  }

  // Prevent changing the owner
  if (data.owner && data.owner !== oldWithdrawal.owner) {
    throw new Error("Cannot change the owner of a withdrawal.");
  }

  // Check settlement limit if amount is being changed
  if (data.amount !== undefined) {
    const settlementInfo = await getOwnerSettlementWithdrawalInfo(oldWithdrawal.owner);
    const maxAllowedSettlement = settlementInfo.availableSettlement + oldWithdrawal.amount;
    const maxAllowedTreasury = settlementInfo.totalBusinessBalance + oldWithdrawal.amount;

    if (data.amount > maxAllowedSettlement) {
      throw new Error(
        `Amount exceeds your available settlement limit of ${maxAllowedSettlement.toFixed(2)} SAR.`,
      );
    }

    if (data.amount > maxAllowedTreasury) {
      throw new Error(
        `Amount exceeds available company treasury balance of ${maxAllowedTreasury.toFixed(2)} SAR.`,
      );
    }
  }

  const withdrawal = await Withdrawal.findByIdAndUpdate<WithdrawalDoc>(
    id,
    {
      ...data,
      owner: oldWithdrawal.owner, // always preserve original owner
    },
    { new: true },
  );

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Withdrawal",
    action: "Update",
    description: `Updated withdrawal for ${oldWithdrawal.owner}`,
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
  const admin = await getCurrentAdmin();

  const withdrawal = await Withdrawal.findById<WithdrawalDoc>(id);
  if (!withdrawal) {
    throw new Error("Withdrawal not found");
  }

  const settings = await getSettings();
  const owners = (settings?.owners || []) as { name: string; email: string }[];

  const matchingOwner = owners.find(
    (o) =>
      o.email &&
      admin?.email &&
      o.email.trim().toLowerCase() === admin.email.trim().toLowerCase(),
  );

  // Non-superadmins can only delete their own withdrawals
  if (admin?.role !== "superadmin" && matchingOwner?.name !== withdrawal.owner) {
    throw new Error("You can only delete your own withdrawals.");
  }

  await Withdrawal.findByIdAndDelete(id);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Withdrawal",
    action: "Delete",
    description: `Deleted withdrawal for ${withdrawal.owner}`,
    recordId: withdrawal._id,
    oldData: JSON.parse(JSON.stringify(withdrawal)),
  });

  revalidatePath("/withdrawals");
  revalidatePath("/");
}
