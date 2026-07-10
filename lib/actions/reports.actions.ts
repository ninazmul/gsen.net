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
    .sort({ date: -1 })
    .lean();

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
    .sort({ date: -1 })
    .lean();

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

  const incomes = await Income.find(incomeMatch).populate("category").lean();
  const expenses = await Expense.find(expenseMatch).populate("category").lean();

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

  const categories = await Category.find(type ? { type } : {}).lean() as unknown as Array<{
    _id: { toString(): string };
    name: string;
    type: "Income" | "Expense";
    color: string;
    active: boolean;
  }>;

  const match: Record<string, unknown> = { deletedAt: null };
  if (startDate && endDate) {
    match.date = { $gte: startDate, $lte: endDate };
  }

  const [incomeAgg, expenseAgg] = await Promise.all([
    (!type || type === "Income")
      ? Income.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$category",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),
    (!type || type === "Expense")
      ? Expense.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$category",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),
  ]);

  const incomeMap = new Map<string, { total: number; count: number }>();
  incomeAgg.forEach((item) => {
    if (item._id) incomeMap.set(item._id.toString(), item);
  });

  const expenseMap = new Map<string, { total: number; count: number }>();
  expenseAgg.forEach((item) => {
    if (item._id) expenseMap.set(item._id.toString(), item);
  });

  const report = categories.map((cat) => {
    const catIdStr = cat._id.toString();
    const aggData = cat.type === "Income" ? incomeMap.get(catIdStr) : expenseMap.get(catIdStr);

    return {
      category: JSON.parse(JSON.stringify(cat)),
      total: aggData?.total || 0,
      count: aggData?.count || 0,
    };
  });

  return report;
}

export async function getMonthlyPerformanceReport(year?: number) {
  await connectToDatabase();
  const y = year || new Date().getFullYear();
  const startOfYear = new Date(y, 0, 1);
  const endOfYear = new Date(y, 12, 0, 23, 59, 59, 999);

  const [incomeMonthly, expenseMonthly] = await Promise.all([
    Income.aggregate([
      {
        $match: {
          deletedAt: null,
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$amount" },
        },
      },
    ]),
    Expense.aggregate([
      {
        $match: {
          deletedAt: null,
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const incomeMap = new Map<number, number>();
  incomeMonthly.forEach((item) => {
    if (item._id) incomeMap.set(item._id, item.total);
  });

  const expenseMap = new Map<number, number>();
  expenseMonthly.forEach((item) => {
    if (item._id) expenseMap.set(item._id, item.total);
  });

  const monthlyData = [];

  for (let month = 0; month < 12; month++) {
    const totalIncome = incomeMap.get(month + 1) || 0;
    const totalExpenses = expenseMap.get(month + 1) || 0;
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
