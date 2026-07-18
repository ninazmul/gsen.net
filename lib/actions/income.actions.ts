"use server";

import { connectToDatabase } from "@/lib/database";
import Income from "@/lib/database/models/income.model";
import { revalidatePath } from "next/cache";
import type { FilterQuery, Types } from "mongoose";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";
import { checkWritePermissionServer } from "./permission-actions";
import { getSettings } from "./settings.actions";

interface Owner {
  name: string;
  email: string;
}

interface IncomeDoc {
  _id: string;
  category: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createIncome(data: {
  category: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
}) {
  await checkWritePermissionServer("income");
  await connectToDatabase();
  const user = await currentUser();

  let finalOwner = data.owner;
  if (!finalOwner) {
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    if (userEmail) {
      const settings = await getSettings();
      const match = (settings.owners as Owner[]).find(
        (o) =>
          o.email &&
          o.email.trim().toLowerCase() === userEmail.trim().toLowerCase(),
      );
      if (match) {
        finalOwner = match.name;
      }
    }
  }

  const income = await Income.create({ ...data, owner: finalOwner });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Income",
    action: "Create",
    description: `Created income of ⃁${data.amount}`,
    recordId: income._id,
    newData: JSON.parse(JSON.stringify(income)),
  });

  revalidatePath("/income");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(income));
}

export async function getIncomes(params?: {
  owner?: string | Types.ObjectId;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  const {
    owner,
    category,
    startDate,
    endDate,
    search = "",
    page = 1,
    limit = 10,
  } = params || {};

  const skip = (page - 1) * limit;

  const query: FilterQuery<IncomeDoc> = {
    deletedAt: null,
  };

  // Owner filter
  if (owner) {
    query.owner = owner;
  }

  if (category) {
    query.category = category;
  }

  if (startDate && endDate) {
    query.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { referenceNumber: { $regex: search, $options: "i" } },
    ];
  }

  const incomes = await Income.find(query)
    .populate("category")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Income.countDocuments(query);

  return {
    incomes: JSON.parse(JSON.stringify(incomes)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateIncome(id: string, data: Partial<IncomeDoc>) {
  await checkWritePermissionServer("income");
  await connectToDatabase();
  const user = await currentUser();

  const oldIncome = await Income.findById<IncomeDoc>(id);
  const income = await Income.findByIdAndUpdate<IncomeDoc>(id, data, {
    new: true,
  });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Income",
    action: "Update",
    description: `Updated income of ⃁${oldIncome?.amount}`,
    recordId: income?._id,
    oldData: JSON.parse(JSON.stringify(oldIncome)),
    newData: JSON.parse(JSON.stringify(income)),
  });

  revalidatePath("/income");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(income));
}

export async function softDeleteIncome(id: string) {
  await checkWritePermissionServer("income");
  await connectToDatabase();
  const user = await currentUser();

  const income = await Income.findById<IncomeDoc>(id);
  await Income.findByIdAndUpdate(id, { deletedAt: new Date() });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Income",
    action: "Delete",
    description: `Soft deleted income of ⃁${income?.amount}`,
    recordId: income?._id,
    oldData: JSON.parse(JSON.stringify(income)),
  });

  revalidatePath("/income");
  revalidatePath("/");
}

export async function restoreIncome(id: string) {
  await checkWritePermissionServer("income");
  await connectToDatabase();
  const user = await currentUser();

  const income = await Income.findById<IncomeDoc>(id);
  await Income.findByIdAndUpdate(id, { deletedAt: null });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Income",
    action: "Restore",
    description: `Restored income of ⃁${income?.amount}`,
    recordId: income?._id,
    newData: JSON.parse(JSON.stringify(income)),
  });

  revalidatePath("/income");
  revalidatePath("/");
}
