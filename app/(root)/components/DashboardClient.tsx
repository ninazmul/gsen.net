"use client";

import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Wallet,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "next-themes";

interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
}

interface Income {
  _id: string;
  title: string;
  category: Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

interface Expense {
  _id: string;
  title: string;
  category: Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

interface ActivityLog {
  _id: string;
  date: Date;
  adminEmail: string;
  module: string;
  action: string;
  description: string;
  recordId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  browser?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OwnerBalance {
  name: string;
  totalIncome: number;
  totalExpenses: number;
  withdrawn: number;
  balance: number;
}

interface MonthlyData {
  month: number;
  monthName: string;
  income: number;
  expenses: number;
  profit: number;
  changeFromPrev: number;
  profitPercent: number;
}

interface BreakdownItem {
  _id: string;
  total: number;
  category: Category;
}

type DashboardClientProps = {
  data: {
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netProfit: number;
      ownerBalances: OwnerBalance[];
    };
    monthlyPerformance: MonthlyData[];
    expenseBreakdown: BreakdownItem[];
    incomeBreakdown: BreakdownItem[];
    charts: {
      monthlyIncome: { month: string; amount: number }[];
      monthlyExpenses: { month: string; amount: number }[];
      monthlyProfit: { month: string; amount: number }[];
    };
    recentTransactions: {
      incomes: Income[];
      expenses: Expense[];
    };
    recentLogs: ActivityLog[];
  };
};

export default function DashboardClient({ data }: DashboardClientProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const COLOR_PALETTE = [
    "#7c3aed",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  const tooltipBg = isDark ? "#1e1b2e" : "#ffffff";
  const tooltipBorder = isDark ? "#2e2b3e" : "#e2e8f0";

  return (
    <div className="py-6 flex flex-col gap-8 px-4 bg-background min-h-screen">
      {/* Summary Metrics Cards */}
      <h2 className="text-2xl font-bold uppercase text-purple-900 dark:text-purple-400">
        1. Business Summary
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Metric 1: Total Income */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50/50 dark:bg-green-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl shadow-inner group-hover:bg-green-600 group-hover:text-white dark:group-hover:bg-green-700 transition-colors duration-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Income
              </p>
              <h2 className="text-2xl font-extrabold text-card-foreground tracking-tight">
                ৳
                {data.summary.totalIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                <span className="bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  Total earnings
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metric 2: Total Expenses */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 dark:bg-rose-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shadow-inner group-hover:bg-rose-600 group-hover:text-white dark:group-hover:bg-rose-700 transition-colors duration-300">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Expenses
              </p>
              <h2 className="text-2xl font-extrabold text-card-foreground tracking-tight">
                ৳
                {data.summary.totalExpenses.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <span className="bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                  Total costs incurred
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metric 3: Net Profit */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 dark:bg-purple-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shadow-inner group-hover:bg-[#3e0078] group-hover:text-white dark:group-hover:bg-purple-700 transition-colors duration-300">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Net Profit
              </p>
              <h2
                className={`text-2xl font-extrabold tracking-tight ${data.summary.netProfit >= 0 ? "text-card-foreground" : "text-rose-600 dark:text-rose-400"}`}
              >
                ৳
                {data.summary.netProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`px-2 py-0.5 rounded-full ${data.summary.netProfit >= 0 ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"}`}
                >
                  {data.summary.netProfit >= 0
                    ? "Net business profit"
                    : "Net loss"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metric 4: Available Balance */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50/50 dark:bg-sky-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl shadow-inner group-hover:bg-sky-600 group-hover:text-white dark:group-hover:bg-sky-700 transition-colors duration-300">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Available Balance
              </p>
              {(() => {
                const totalBalance = data.summary.ownerBalances.reduce(
                  (sum, o) => sum + o.balance,
                  0,
                );
                return (
                  <>
                    <h2
                      className={`text-2xl font-extrabold tracking-tight ${totalBalance >= 0 ? "text-card-foreground" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      ৳
                      {totalBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium">
                      <span className="bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">
                        {totalBalance >= 0 ? "Net withdrawable" : "Overdrawn"}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Business Entry Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold uppercase text-purple-900 dark:text-purple-400">
          2. Daily Business Entry
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.summary.ownerBalances.map((owner, index) => (
            <div
              key={index}
              className="rounded-2xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#3e0078] to-[#6d28d9] dark:from-[#2d0059] dark:to-[#4c1d95] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-bold tracking-wider uppercase text-sm">
                    {owner.name}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="bg-card px-5 py-5 grid grid-cols-4 gap-3 rounded-t-xl">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Income
                  </p>
                  <p className="text-base font-bold text-green-600 dark:text-green-400">
                    ৳
                    {owner.totalIncome.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Expenses
                  </p>
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                    ৳
                    {owner.totalExpenses.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Withdrawn
                  </p>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                    ৳
                    {owner.withdrawn.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Balance
                  </p>
                  <p
                    className={`text-base font-bold ${owner.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                  >
                    ৳
                    {owner.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Owner Balance & Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner Balances — spans 2 cols */}
        <Card className="lg:col-span-2 p-5 shadow-sm border border-border bg-card">
          <h2 className="text-2xl font-bold uppercase text-purple-900 dark:text-purple-400 text-card-foreground mb-5">
            3. Owner Balance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left pb-3 text-muted-foreground font-semibold pr-4">
                    Owner
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-semibold px-3">
                    Total Sales
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-semibold px-3">
                    Total Expenses
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-semibold px-3">
                    Profit
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-semibold px-3">
                    Withdraw
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-semibold pl-3">
                    Current Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.summary.ownerBalances.map((owner, index) => {
                  const profit = owner.totalIncome - owner.totalExpenses;
                  const initials = owner.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={index}
                      className="border-b border-border/60 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3e0078] to-[#6d28d9] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-card-foreground">
                            {owner.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right font-semibold text-card-foreground tabular-nums">
                        ৳{" "}
                        {owner.totalIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="py-4 px-3 text-right font-semibold text-card-foreground tabular-nums">
                        ৳{" "}
                        {owner.totalExpenses.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td
                        className={`py-4 px-3 text-right font-bold tabular-nums ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                      >
                        ৳{" "}
                        {profit.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="py-4 px-3 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                        ৳{" "}
                        {owner.withdrawn.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td
                        className={`py-4 pl-3 text-right font-bold tabular-nums ${owner.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                      >
                        ৳{" "}
                        {owner.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
                {/* Total Company Row */}
                {(() => {
                  const totIncome = data.summary.ownerBalances.reduce(
                    (s, o) => s + o.totalIncome,
                    0,
                  );
                  const totExpenses = data.summary.ownerBalances.reduce(
                    (s, o) => s + o.totalExpenses,
                    0,
                  );
                  const totProfit = totIncome - totExpenses;
                  const totWithdrawn = data.summary.ownerBalances.reduce(
                    (s, o) => s + o.withdrawn,
                    0,
                  );
                  const totBalance = data.summary.ownerBalances.reduce(
                    (s, o) => s + o.balance,
                    0,
                  );
                  return (
                    <tr className="bg-muted/30 border-t-2 border-border font-bold">
                      <td className="py-4 pr-4 text-card-foreground text-sm">
                        Total (Company)
                      </td>
                      <td className="py-4 px-3 text-right text-card-foreground tabular-nums">
                        ৳{" "}
                        {totIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="py-4 px-3 text-right text-card-foreground tabular-nums">
                        ৳{" "}
                        {totExpenses.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td
                        className={`py-4 px-3 text-right tabular-nums ${totProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                      >
                        ৳{" "}
                        {totProfit.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="py-4 px-3 text-right text-rose-600 dark:text-rose-400 tabular-nums">
                        ৳{" "}
                        {totWithdrawn.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td
                        className={`py-4 pl-3 text-right tabular-nums ${totBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                      >
                        ৳{" "}
                        {totBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Expense Category Details */}
        <Card className="p-6 shadow-sm border border-border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold uppercase text-purple-900 dark:text-purple-400 text-card-foreground tracking-tight">
              6. Expense Category Details
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Donut Chart */}
            <div className="flex-shrink-0 w-full md:w-64 flex items-center justify-center relative">
              {(() => {
                const totalExpense = data.expenseBreakdown.reduce(
                  (s, e) => s + e.total,
                  0,
                );
                return (
                  <div className="relative">
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie
                          data={
                            data.expenseBreakdown.length > 0
                              ? data.expenseBreakdown
                              : [{ category: { name: "No Data" }, total: 1 }]
                          }
                          dataKey="total"
                          nameKey="category.name"
                          cx="50%"
                          cy="50%"
                          innerRadius={68}
                          outerRadius={105}
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {data.expenseBreakdown.length > 0 ? (
                            data.expenseBreakdown.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  COLOR_PALETTE[index % COLOR_PALETTE.length]
                                }
                                stroke="none"
                              />
                            ))
                          ) : (
                            <Cell fill="#e2e8f0" stroke="none" />
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `৳${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            name,
                          ]}
                          contentStyle={{
                            background: tooltipBg,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: "8px",
                            color: isDark ? "#e2e8f0" : "#1e293b",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xs text-muted-foreground font-medium">
                        Total Expense
                      </p>
                      <p className="text-xl font-extrabold text-card-foreground leading-tight">
                        ৳
                        {totalExpense.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This Month
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Category Table */}
            <div className="flex-1 w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-3 text-muted-foreground font-semibold">
                      Category
                    </th>
                    <th className="text-right pb-3 text-muted-foreground font-semibold">
                      This Month
                    </th>
                    <th className="text-right pb-3 text-muted-foreground font-semibold">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const totalExpense = data.expenseBreakdown.reduce(
                      (s, e) => s + e.total,
                      0,
                    );
                    return data.expenseBreakdown
                      .slice()
                      .sort((a, b) => b.total - a.total)
                      .map((entry, index) => {
                        const pct =
                          totalExpense > 0
                            ? (entry.total / totalExpense) * 100
                            : 0;
                        return (
                          <tr
                            key={index}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      COLOR_PALETTE[
                                        index % COLOR_PALETTE.length
                                      ],
                                  }}
                                />
                                <span className="font-medium text-card-foreground">
                                  {entry.category.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-right font-semibold text-card-foreground tabular-nums">
                              ৳{" "}
                              {entry.total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-3 text-right text-muted-foreground font-medium tabular-nums">
                              {pct.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      });
                  })()}
                  {data.expenseBreakdown.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground text-sm"
                      >
                        No expense data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border">
            <a
              href="/reports"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#3e0078] dark:text-purple-400 hover:underline"
            >
              <Activity className="w-4 h-4" />
              View Detailed Report
            </a>
          </div>
        </Card>
      </div>

      <div className="py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GESN.NET. All rights reserved.
      </div>
    </div>
  );
}
