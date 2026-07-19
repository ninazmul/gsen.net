"use server";

import { connectToDatabase } from "@/lib/database";
import Income from "@/lib/database/models/income.model";
import Category from "@/lib/database/models/category.model";
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

export interface ImportIncomeRow {
  categoryName: string;
  amount: number;
  date: string | Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
}

async function resolveIncomeOwner(
  fallbackOwner?: string,
): Promise<string | undefined> {
  if (fallbackOwner && fallbackOwner.trim()) {
    return fallbackOwner.trim();
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  if (!userEmail) {
    return undefined;
  }

  const settings = await getSettings();
  const match = (settings.owners as Owner[]).find(
    (o) =>
      o.email &&
      o.email.trim().toLowerCase() === userEmail.trim().toLowerCase(),
  );

  return match?.name;
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
    description: `Created income of ${data.amount} SAR`,
    recordId: income._id,
    newData: JSON.parse(JSON.stringify(income)),
  });

  revalidatePath("/income");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(income));
}

export async function importIncomesFromExcel(rows: ImportIncomeRow[]) {
  await checkWritePermissionServer("income");
  await connectToDatabase();
  const user = await currentUser();

  if (!rows?.length) {
    return { importedCount: 0 };
  }

  const createdIncomes = [];
  const normalizedRows = rows.filter(
    (row) =>
      row &&
      Object.values(row).some(
        (value) => value !== "" && value !== undefined && value !== null,
      ),
  );

  for (const [index, row] of normalizedRows.entries()) {
    const categoryName = row.categoryName?.toString().trim();
    const amount = Number(row.amount);
    const paymentMethod = row.paymentMethod?.toString().trim();
    const dateValue = row.date instanceof Date ? row.date : new Date(row.date);

    if (!categoryName) {
      throw new Error(`Row ${index + 2}: Category name is required`);
    }

    if (!paymentMethod) {
      throw new Error(`Row ${index + 2}: Payment method is required`);
    }

    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error(
        `Row ${index + 2}: Amount must be a valid positive number`,
      );
    }

    if (Number.isNaN(dateValue.getTime())) {
      throw new Error(`Row ${index + 2}: Date is invalid`);
    }

    const category = await Category.findOne({
      name: {
        $regex: `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      type: "Income",
    });

    if (!category) {
      throw new Error(
        `Row ${index + 2}: Category "${categoryName}" was not found`,
      );
    }

    const owner = await resolveIncomeOwner(row.owner);
    const income = await Income.create({
      category: category._id,
      amount,
      date: dateValue,
      paymentMethod,
      referenceNumber: row.referenceNumber?.toString().trim() || undefined,
      description: row.description?.toString().trim() || undefined,
      owner,
    });

    createdIncomes.push(income);
  }

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Income",
    action: "Create",
    description: `Imported ${createdIncomes.length} incomes from Excel`,
    newData: JSON.parse(JSON.stringify(createdIncomes)),
  });

  revalidatePath("/income");
  revalidatePath("/");

  return { importedCount: createdIncomes.length };
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
    description: `Updated income of ${oldIncome?.amount} SAR`,
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
    description: `Soft deleted income of ${income?.amount} SAR`,
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
    description: `Restored income of ${income?.amount} SAR`,
    recordId: income?._id,
    newData: JSON.parse(JSON.stringify(income)),
  });

  revalidatePath("/income");
  revalidatePath("/");
}
