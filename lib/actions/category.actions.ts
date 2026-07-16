"use server";

import { connectToDatabase } from "@/lib/database";
import Category from "@/lib/database/models/category.model";
import Income from "@/lib/database/models/income.model";
import Expense from "@/lib/database/models/expense.model";
import { revalidatePath } from "next/cache";
import type { FilterQuery } from "mongoose";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";
import { checkWritePermissionServer } from "./permission-actions";

interface CategoryDoc {
  _id: string;
  name: string;
  type: "Income" | "Expense";
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function createCategory(data: {
  name: string;
  type: "Income" | "Expense";
  color?: string;
}) {
  await checkWritePermissionServer("categories");
  await connectToDatabase();
  const user = await currentUser();

  const category = await Category.create(data);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Category",
    action: "Create",
    description: `Created category: ${data.name}`,
    recordId: category._id,
    newData: JSON.parse(JSON.stringify(category)),
  });

  revalidatePath("/categories");
  return JSON.parse(JSON.stringify(category));
}

export async function getCategories(params?: {
  type?: "Income" | "Expense";
  active?: boolean;
}) {
  await connectToDatabase();
  const { type, active } = params || {};

  const query: FilterQuery<CategoryDoc> = {};
  if (type) query.type = type;
  if (active !== undefined) query.active = active;

  const categories = await Category.find<CategoryDoc>(query).sort({ name: 1 });

  return JSON.parse(JSON.stringify(categories));
}

export async function getCategoryById(id: string) {
  await connectToDatabase();
  const category = await Category.findById<CategoryDoc>(id);
  return JSON.parse(JSON.stringify(category));
}

export async function updateCategory(id: string, data: Partial<CategoryDoc>) {
  await checkWritePermissionServer("categories");
  await connectToDatabase();
  const user = await currentUser();

  const oldCategory = await Category.findById<CategoryDoc>(id);
  const category = await Category.findByIdAndUpdate<CategoryDoc>(id, data, {
    new: true,
  });

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Category",
    action: "Update",
    description: `Updated category: ${oldCategory?.name}`,
    recordId: category?._id,
    oldData: JSON.parse(JSON.stringify(oldCategory)),
    newData: JSON.parse(JSON.stringify(category)),
  });

  revalidatePath("/categories");
  return JSON.parse(JSON.stringify(category));
}

export async function deleteCategory(id: string) {
  await checkWritePermissionServer("categories");
  await connectToDatabase();
  const user = await currentUser();

  const category = await Category.findById<CategoryDoc>(id);

  // Check if category is used in any income or expense records
  const incomeCount = await Income.countDocuments({
    category: id,
    deletedAt: null,
  });
  const expenseCount = await Expense.countDocuments({
    category: id,
    deletedAt: null,
  });

  if (incomeCount > 0 || expenseCount > 0) {
    throw new Error(
      "Cannot delete category: it is used in income or expense records.",
    );
  }

  await Category.findByIdAndDelete(id);

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Category",
    action: "Delete",
    description: `Deleted category: ${category?.name}`,
    recordId: category?._id,
    oldData: JSON.parse(JSON.stringify(category)),
  });

  revalidatePath("/categories");
}

export async function seedDefaultCategories() {
  await connectToDatabase();

  const incomeCategories = [
    { name: "Internet Bills", type: "Income" },
    { name: "Installation", type: "Income" },
    { name: "Device Sales", type: "Income" },
    { name: "Service Charge", type: "Income" },
    { name: "Maintenance", type: "Income" },
    { name: "Others", type: "Income" },
  ];

  const expenseCategories = [
    { name: "ISP Bills", type: "Expense" },
    { name: "Salary", type: "Expense" },
    { name: "Fuel", type: "Expense" },
    { name: "Rent", type: "Expense" },
    { name: "Maintenance", type: "Expense" },
    { name: "Equipment", type: "Expense" },
    { name: "Office", type: "Expense" },
    { name: "Marketing", type: "Expense" },
    { name: "Miscellaneous", type: "Expense" },
  ];

  const allCategories = [...incomeCategories, ...expenseCategories];

  for (const cat of allCategories) {
    const exists = await Category.findOne({ name: cat.name, type: cat.type });
    if (!exists) {
      await Category.create(cat);
    }
  }
}
