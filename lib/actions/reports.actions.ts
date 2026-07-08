"use server";

import { connectToDatabase } from "@/lib/database";
import Income from "@/lib/database/models/income.model";
import Expense from "@/lib/database/models/expense.model";
import Category from "@/lib/database/models/category.model";
import { logActivity } from "./activity-log.actions";
import { currentUser } from "@clerk/nextjs/server";

export async function getIncomeReport(params?: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}) {
  await connectToDatabase();
  const { startDate, endDate, category } = params || {};

  const match: Record<string, unknown> = { deletedAt: null };
  if (startDate && endDate) {
    match.date = { $gte: startDate, $lte: endDate };
  }
  if (category) {
    match.category = category;
  }

  const incomes = await Income.find(match)
    .populate("category")
    .sort({ date: -1 });

  const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return {
    incomes: JSON.parse(JSON.stringify(incomes)),
    total,
  };
}

export async function getExpenseReport(params?: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}) {
  await connectToDatabase();
  const { startDate, endDate, category } = params || {};

  const match: Record<string, unknown> = { deletedAt: null };
  if (startDate && endDate) {
    match.date = { $gte: startDate, $lte: endDate };
  }
  if (category) {
    match.category = category;
  }

  const expenses = await Expense.find(match)
    .populate("category")
    .sort({ date: -1 });

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return {
    expenses: JSON.parse(JSON.stringify(expenses)),
    total,
  };
}

export async function getProfitReport(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  await connectToDatabase();
  const { startDate, endDate } = params || {};

  const incomeMatch: Record<string, unknown> = { deletedAt: null };
  const expenseMatch: Record<string, unknown> = { deletedAt: null };

  if (startDate && endDate) {
    incomeMatch.date = { $gte: startDate, $lte: endDate };
    expenseMatch.date = { $gte: startDate, $lte: endDate };
  }

  const incomes = await Income.find(incomeMatch).populate("category");
  const expenses = await Expense.find(expenseMatch).populate("category");

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return {
    incomes: JSON.parse(JSON.stringify(incomes)),
    expenses: JSON.parse(JSON.stringify(expenses)),
    totalIncome,
    totalExpenses,
    netProfit,
  };
}

export async function getCategoryReport(params?: {
  startDate?: Date;
  endDate?: Date;
  type?: "Income" | "Expense";
}) {
  await connectToDatabase();
  const { startDate, endDate, type } = params || {};

  const categories = await Category.find(type ? { type } : {});

  const report = await Promise.all(
    categories.map(async (cat) => {
      const Model = cat.type === "Income" ? Income : Expense;
      const match: Record<string, unknown> = { deletedAt: null, category: cat._id };

      if (startDate && endDate) {
        match.date = { $gte: startDate, $lte: endDate };
      }

      const items = await Model.find(match);
      const total = items.reduce((sum, item) => sum + item.amount, 0);

      return {
        category: JSON.parse(JSON.stringify(cat)),
        total,
        count: items.length,
      };
    }),
  );

  return report;
}

export async function getMonthlyPerformanceReport(year?: number) {
  await connectToDatabase();
  const y = year || new Date().getFullYear();

  const monthlyData = [];

  for (let month = 0; month < 12; month++) {
    const startDate = new Date(y, month, 1);
    const endDate = new Date(y, month + 1, 0);

    const incomes = await Income.find({
      deletedAt: null,
      date: { $gte: startDate, $lte: endDate },
    });
    const expenses = await Expense.find({
      deletedAt: null,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalIncome - totalExpenses;
    const profitPercent = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

    monthlyData.push({
      month: month + 1,
      monthName: new Date(y, month).toLocaleString("default", {
        month: "long",
      }),
      totalIncome,
      totalExpenses,
      profit,
      profitPercent,
    });
  }

  const yearlyTotal = monthlyData.reduce(
    (acc, m) => ({
      income: acc.income + m.totalIncome,
      expenses: acc.expenses + m.totalExpenses,
      profit: acc.profit + m.profit,
    }),
    { income: 0, expenses: 0, profit: 0 },
  );

  return {
    monthlyData,
    yearlyTotal,
  };
}

export async function logReportExport(
  reportType: string,
  format: "xlsx" | "csv",
) {
  const user = await currentUser();

  await logActivity({
    adminEmail: user?.emailAddresses[0]?.emailAddress || "",
    module: "Reports",
    action: "Export",
    description: `Exported ${reportType} report as ${format.toUpperCase()}`,
  });
}
