"use server";

import { connectToDatabase } from "@/lib/database";
import Income from "@/lib/database/models/income.model";
import Expense from "@/lib/database/models/expense.model";
import Withdrawal from "@/lib/database/models/withdrawal.model";
import { getSettings } from "./settings.actions";
import { getRecentActivityLogs } from "./activity-log.actions";

export async function getDashboardData() {
  await connectToDatabase();

  const settings = await getSettings();
  const recentLogs = await getRecentActivityLogs(10);

  const totalIncome = await Income.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalExpenses = await Expense.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const withdrawals = await Withdrawal.aggregate([
    {
      $group: {
        _id: "$owner",
        totalWithdrawn: { $sum: "$amount" },
      },
    },
  ]);

  const income = totalIncome[0]?.total || 0;
  const expenses = totalExpenses[0]?.total || 0;
  const netProfit = income - expenses;

  // Aggregate Income and Expense by owner
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

  // Today range queries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Current month range queries
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Aggregate Today's Income and Expense by owner
  const todayIncomeByOwner = await Income.aggregate([
    {
      $match: {
        deletedAt: null,
        date: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    {
      $group: {
        _id: "$owner",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const todayExpensesByOwner = await Expense.aggregate([
    {
      $match: {
        deletedAt: null,
        date: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    {
      $group: {
        _id: "$owner",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const todayWithdrawals = await Withdrawal.aggregate([
    {
      $match: {
        date: { $gte: startOfToday, $lte: endOfToday },
      },
    },
    {
      $group: {
        _id: "$owner",
        totalWithdrawn: { $sum: "$amount" },
      },
    },
  ]);

  // Calculate owner balances with transaction totals
  interface Owner {
    name: string;
    email: string;
  }
  interface WithdrawalAgg {
    _id: string;
    totalWithdrawn: number;
  }
  const ownerBalances = (settings.owners as Owner[]).map((owner) => {
    const totalIncome =
      totalIncomeByOwner.find((i) => i._id === owner.name)?.total || 0;
    const totalExpenses =
      totalExpensesByOwner.find((e) => e._id === owner.name)?.total || 0;
    const withdrawn =
      (withdrawals as WithdrawalAgg[]).find((w) => w._id === owner.name)
        ?.totalWithdrawn || 0;
    const balance = totalIncome - totalExpenses - withdrawn;

    const todayIncome =
      todayIncomeByOwner.find((i) => i._id === owner.name)?.total || 0;
    const todayExpenses =
      todayExpensesByOwner.find((e) => e._id === owner.name)?.total || 0;
    const todayWithdrawn =
      (todayWithdrawals as WithdrawalAgg[]).find((w) => w._id === owner.name)
        ?.totalWithdrawn || 0;
    const todayBalance = todayIncome - todayExpenses - todayWithdrawn;

    return {
      name: owner.name,
      totalIncome,
      totalExpenses,
      withdrawn,
      balance,
      todayIncome,
      todayExpenses,
      todayWithdrawn,
      todayBalance,
    };
  });

  // Monthly performance
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 12, 0, 23, 59, 59, 999);

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
  let previousMonthProfit = 0;

  for (let month = 0; month < 12; month++) {
    const mIncome = incomeMap.get(month + 1) || 0;
    const mExpense = expenseMap.get(month + 1) || 0;
    const mProfit = mIncome - mExpense;
    const profitPercent = mIncome > 0 ? (mProfit / mIncome) * 100 : 0;
    const changeFromPrev = mProfit - previousMonthProfit;

    monthlyData.push({
      month: month + 1,
      monthName: new Date(currentYear, month).toLocaleString("default", {
        month: "long",
      }),
      income: mIncome,
      expenses: mExpense,
      profit: mProfit,
      changeFromPrev,
      profitPercent,
    });

    previousMonthProfit = mProfit;
  }

  // Expense breakdown by category
  const expenseBreakdown = await Expense.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
  ]);

  // Income breakdown by category
  const incomeBreakdown = await Income.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
  ]);

  // Recent transactions
  const recentIncomes = await Income.find({ deletedAt: null })
    .populate("category")
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .lean();

  const recentExpenses = await Expense.find({ deletedAt: null })
    .populate("category")
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .lean();

  return {
    summary: {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit,
      ownerBalances,
      currentMonthIncome: incomeMap.get(new Date().getMonth() + 1) || 0,
      currentMonthIncomeCount: await Income.countDocuments({
        deletedAt: null,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    },
    monthlyPerformance: monthlyData,
    expenseBreakdown: JSON.parse(JSON.stringify(expenseBreakdown)),
    incomeBreakdown: JSON.parse(JSON.stringify(incomeBreakdown)),
    charts: {
      monthlyIncome: monthlyData.map((m) => ({
        month: m.monthName,
        amount: m.income,
      })),
      monthlyExpenses: monthlyData.map((m) => ({
        month: m.monthName,
        amount: m.expenses,
      })),
      monthlyProfit: monthlyData.map((m) => ({
        month: m.monthName,
        amount: m.profit,
      })),
    },
    recentTransactions: {
      incomes: JSON.parse(JSON.stringify(recentIncomes)),
      expenses: JSON.parse(JSON.stringify(recentExpenses)),
    },
    recentLogs: JSON.parse(JSON.stringify(recentLogs)),
  };
}
