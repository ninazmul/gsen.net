"use server";

import { connectToDatabase } from "@/lib/database";
import Expense from "@/lib/database/models/expense.model";
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

// Define types
interface ExpenseDoc {
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

export interface ImportExpenseRow {
  categoryName: string;
  amount: number;
  date: string | Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
}

async function resolveExpenseOwner(
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

export async function createExpense(data: {
  category: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
}) {
  await checkWritePermissionServer("expenses");
  await connectToDatabase();
  const user = await currentUser();

  const finalOwner = data.owner || (await resolveExpenseOwner());
  const expense = await Expense.create({ ...data, owner: finalOwner });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Expense",
    action: "Create",
    description: `Created expense of ${data.amount} SAR`,
    recordId: expense._id,
    newData: JSON.parse(JSON.stringify(expense)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(expense));
}

export async function importExpensesFromExcel(rows: ImportExpenseRow[]) {
  await checkWritePermissionServer("expenses");
  await connectToDatabase();
  const user = await currentUser();

  if (!rows?.length) {
    return { importedCount: 0 };
  }

  const createdExpenses = [];
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
      type: "Expense",
    });

    if (!category) {
      throw new Error(
        `Row ${index + 2}: Category "${categoryName}" was not found`,
      );
    }

    const owner = await resolveExpenseOwner(row.owner);
    const expense = await Expense.create({
      category: category._id,
      amount,
      date: dateValue,
      paymentMethod,
      referenceNumber: row.referenceNumber?.toString().trim() || undefined,
      description: row.description?.toString().trim() || undefined,
      owner,
    });

    createdExpenses.push(expense);
  }

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Expense",
    action: "Create",
    description: `Imported ${createdExpenses.length} expenses from Excel`,
    newData: JSON.parse(JSON.stringify(createdExpenses)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");

  return { importedCount: createdExpenses.length };
}

export async function getExpenses(params?: {
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

  const query: FilterQuery<ExpenseDoc> = {
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

  const expenses = await Expense.find(query)
    .populate("category")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Expense.countDocuments(query);

  return {
    expenses: JSON.parse(JSON.stringify(expenses)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateExpense(id: string, data: Partial<ExpenseDoc>) {
  await checkWritePermissionServer("expenses");
  await connectToDatabase();
  const user = await currentUser();

  const oldExpense = await Expense.findById<ExpenseDoc>(id);
  const expense = await Expense.findByIdAndUpdate<ExpenseDoc>(id, data, {
    new: true,
  });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Expense",
    action: "Update",
    description: `Updated expense of ${oldExpense?.amount} SAR`,
    recordId: expense?._id,
    oldData: JSON.parse(JSON.stringify(oldExpense)),
    newData: JSON.parse(JSON.stringify(expense)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(expense));
}

export async function softDeleteExpense(id: string) {
  await checkWritePermissionServer("expenses");
  await connectToDatabase();
  const user = await currentUser();

  const expense = await Expense.findById<ExpenseDoc>(id);
  await Expense.findByIdAndUpdate(id, { deletedAt: new Date() });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Expense",
    action: "Delete",
    description: `Soft deleted expense of ${expense?.amount} SAR`,
    recordId: expense?._id,
    oldData: JSON.parse(JSON.stringify(expense)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function restoreExpense(id: string) {
  await checkWritePermissionServer("expenses");
  await connectToDatabase();
  const user = await currentUser();

  const expense = await Expense.findById<ExpenseDoc>(id);
  await Expense.findByIdAndUpdate(id, { deletedAt: null });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Expense",
    action: "Restore",
    description: `Restored expense of ${expense?.amount} SAR`,
    recordId: expense?._id,
    newData: JSON.parse(JSON.stringify(expense)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
}
