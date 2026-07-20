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
  user?: any,
  settings?: any,
): Promise<string | undefined> {
  if (fallbackOwner && fallbackOwner.trim()) {
    return fallbackOwner.trim();
  }

  const currentUserObj = user !== undefined ? user : await currentUser();
  const userEmail = currentUserObj?.emailAddresses[0]?.emailAddress;
  if (!userEmail) {
    return undefined;
  }

  const settingsObj = settings !== undefined ? settings : await getSettings();
  const match = (settingsObj.owners as Owner[]).find(
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

  const finalOwner = data.owner || (await resolveExpenseOwner(undefined, user));
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
  const settings = await getSettings();

  if (!rows?.length) {
    return { importedCount: 0, failedCount: 0, errors: [] };
  }

  const createdExpenses = [];
  const normalizedRows = rows.filter(
    (row) =>
      row &&
      Object.values(row).some(
        (value) => value !== "" && value !== undefined && value !== null,
      ),
  );
  const errors: string[] = [];

  for (const [index, row] of normalizedRows.entries()) {
    try {
      const categoryName =
        row.categoryName?.toString().trim() || "Uncategorized";
      const parsedAmount = Number(row.amount);
      const amount =
        Number.isNaN(parsedAmount) || parsedAmount <= 0 ? 1 : parsedAmount;
      const paymentMethod = row.paymentMethod?.toString().trim() || "Cash";
      const rawDate = row.date?.toString().trim();
      let parsedDate: Date;
      if (rawDate && /^\d+(\.\d+)?$/.test(rawDate)) {
        const num = Number(rawDate);
        if (num >= 10000 && num <= 100000) {
          parsedDate = new Date((num - 25569) * 86400 * 1000);
        } else {
          parsedDate = new Date(rawDate);
        }
      } else {
        parsedDate = rawDate ? new Date(rawDate) : new Date();
      }
      const dateValue = Number.isNaN(parsedDate.getTime())
        ? new Date()
        : parsedDate;

      let category = await Category.findOne({
        name: {
          $regex: `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
        type: "Expense",
      });

      if (!category) {
        category = await Category.create({
          name: categoryName,
          type: "Expense",
          color: "#3e0078",
          active: true,
        });
      }

      const owner = await resolveExpenseOwner(row.owner, user, settings);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Row ${index + 2}: ${message}`);
    }
  }

  if (createdExpenses.length) {
    await logActivity({
      adminEmail: user?.emailAddresses[0]?.emailAddress || "",
      module: "Expense",
      action: "Create",
      description: `Imported ${createdExpenses.length} expenses from Excel`,
      newData: JSON.parse(JSON.stringify(createdExpenses)),
    });
  }

  revalidatePath("/expenses");
  revalidatePath("/");

  return {
    importedCount: createdExpenses.length,
    failedCount: errors.length,
    errors,
  };
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
