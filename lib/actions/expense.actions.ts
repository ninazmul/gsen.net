"use server";

import { connectToDatabase } from "@/lib/database";
import Expense from "@/lib/database/models/expense.model";
import { revalidatePath } from "next/cache";
import type { FilterQuery } from "mongoose";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";
import { checkWritePermissionServer } from "./permission-actions";

// Define types
interface ExpenseDoc {
  _id: string;
  title: string;
  category: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createExpense(data: {
  title: string;
  category: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}) {
  await checkWritePermissionServer("expenses");
  await connectToDatabase();
  const user = await currentUser();

  const expense = await Expense.create(data);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Expense",
    action: "Create",
    description: `Created expense: ${data.title}`,
    recordId: expense._id,
    newData: JSON.parse(JSON.stringify(expense)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(expense));
}

export async function getExpenses(params?: {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  const {
    category,
    startDate,
    endDate,
    search = "",
    page = 1,
    limit = 10,
  } = params || {};
  const skip = (page - 1) * limit;

  const query: FilterQuery<ExpenseDoc> = { deletedAt: null };

  if (category) query.category = category;
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { referenceNumber: { $regex: search, $options: "i" } },
    ];
  }

  const expenses = await Expense.find<ExpenseDoc>(query)
    .populate("category")
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

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
    description: `Updated expense: ${oldExpense?.title}`,
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
    description: `Soft deleted expense: ${expense?.title}`,
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
    description: `Restored expense: ${expense?.title}`,
    recordId: expense?._id,
    newData: JSON.parse(JSON.stringify(expense)),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
}
