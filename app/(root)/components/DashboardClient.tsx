"use client";

import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Wallet,
  User,
  Calendar,
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
  todayIncome: number;
  todayExpenses: number;
  todayWithdrawn: number;
  todayBalance: number;
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
      currentMonthIncome: number;
      currentMonthIncomeCount: number;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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

        {/* Metric 5: Monthly Income */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50/50 dark:bg-teal-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl shadow-inner group-hover:bg-teal-600 group-hover:text-white dark:group-hover:bg-teal-700 transition-colors duration-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 w-full">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Monthly Income
              </p>
              <h2 className="text-2xl font-extrabold text-card-foreground tracking-tight">
                ৳
                {(data.summary.currentMonthIncome || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <span className="bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                  {data.summary.currentMonthIncomeCount || 0} transaction{(data.summary.currentMonthIncomeCount || 0) !== 1 ? "s" : ""} this month
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
          {(() => {
            const ownerColors = [
              {
                from: "from-purple-50",
                to: "to-violet-100",
                darkFrom: "dark:from-purple-900/20",
                darkTo: "dark:to-violet-900/20",
                border: "border-purple-100",
                darkBorder: "dark:border-purple-900/30",
                iconBg: "bg-purple-100",
                darkIconBg: "dark:bg-purple-900/30",
                iconColor: "text-purple-700",
                darkIconColor: "dark:text-purple-400",
                text: "text-purple-900",
                darkText: "dark:text-purple-300",
              },
              {
                from: "from-sky-50",
                to: "to-cyan-100",
                darkFrom: "dark:from-sky-900/20",
                darkTo: "dark:to-cyan-900/20",
                border: "border-sky-100",
                darkBorder: "dark:border-sky-900/30",
                iconBg: "bg-sky-100",
                darkIconBg: "dark:bg-sky-900/30",
                iconColor: "text-sky-700",
                darkIconColor: "dark:text-sky-400",
                text: "text-sky-900",
                darkText: "dark:text-sky-300",
              },
              {
                from: "from-emerald-50",
                to: "to-teal-100",
                darkFrom: "dark:from-emerald-900/20",
                darkTo: "dark:to-teal-900/20",
                border: "border-emerald-100",
                darkBorder: "dark:border-emerald-900/30",
                iconBg: "bg-emerald-100",
                darkIconBg: "dark:bg-emerald-900/30",
                iconColor: "text-emerald-700",
                darkIconColor: "dark:text-emerald-400",
                text: "text-emerald-900",
                darkText: "dark:text-emerald-300",
              },
              {
                from: "from-amber-50",
                to: "to-orange-100",
                darkFrom: "dark:from-amber-900/20",
                darkTo: "dark:to-orange-900/20",
                border: "border-amber-100",
                darkBorder: "dark:border-amber-900/30",
                iconBg: "bg-amber-100",
                darkIconBg: "dark:bg-amber-900/30",
                iconColor: "text-amber-700",
                darkIconColor: "dark:text-amber-400",
                text: "text-amber-900",
                darkText: "dark:text-amber-300",
              },
              {
                from: "from-rose-50",
                to: "to-pink-100",
                darkFrom: "dark:from-rose-900/20",
                darkTo: "dark:to-pink-900/20",
                border: "border-rose-100",
                darkBorder: "dark:border-rose-900/30",
                iconBg: "bg-rose-100",
                darkIconBg: "dark:bg-rose-900/30",
                iconColor: "text-rose-700",
                darkIconColor: "dark:text-rose-400",
                text: "text-rose-900",
                darkText: "dark:text-rose-300",
              },
            ];

            return data.summary.ownerBalances.map((owner, index) => {
              const c = ownerColors[index % ownerColors.length];
              return (
                <Card
                  key={index}
                  className="overflow-hidden border border-border shadow-sm bg-card hover:shadow-xl transition-all duration-300"
                >
                  {/* Header */}
                  <div
                    className={`bg-gradient-to-r ${c.from} ${c.to} ${c.darkFrom} ${c.darkTo} px-5 py-4 flex items-center justify-between border-b ${c.border} ${c.darkBorder}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${c.iconBg} ${c.darkIconBg} rounded-full`}>
                        <Users className={`w-4 h-4 ${c.iconColor} ${c.darkIconColor}`} />
                      </div>
                      <span className={`${c.text} ${c.darkText} font-bold tracking-wider uppercase text-sm`}>
                        {owner.name}
                      </span>
                    </div>
                  </div>

              {/* Stats Grid */}
              <div className="px-5 py-5 grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Today&apos;s Income
                  </p>
                  <p className="text-base font-bold text-green-600 dark:text-green-400">
                    ৳
                    {owner.todayIncome.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Today&apos;s Expenses
                  </p>
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                    ৳
                    {owner.todayExpenses.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Today&apos;s Withdraw
                  </p>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                    ৳
                    {owner.todayWithdrawn.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    Today&apos;s Balance
                  </p>
                  <p
                    className={`text-base font-bold ${owner.todayBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                  >
                    ৳
                    {owner.todayBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </Card>
              );
            });
          })()}
        </div>
      </div>

      {/* Partner Settlement Overview & Smart Insights */}
      <div className="space-y-4">
        {/* Partner Settlement Overview */}
        <Card className="p-6 shadow-sm border border-border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-2xl font-bold uppercase text-purple-900 dark:text-purple-400 tracking-tight">
                3. Partner Settlement Overview
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Profit share and withdrawal status at a glance.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {(() => {
              const totalBalance = data.summary.ownerBalances.reduce(
                (s, o) => s + o.balance,
                0,
              );
              const totalNetProfit = data.summary.netProfit;
              const numOwners = data.summary.ownerBalances.length || 1;
              const equalShare = totalNetProfit / numOwners;

              return data.summary.ownerBalances.map((owner, index) => {
                const alreadyTaken = owner.withdrawn;
                const profitShare = equalShare;
                // Remaining the owner can still take from their share
                const remainingDue = Math.max(0, profitShare - alreadyTaken);
                // How much they've gone over their share
                const overdrawAmount = Math.max(0, alreadyTaken - profitShare);
                const isOverdrawn = alreadyTaken > profitShare;
                const totalBizBalance = totalBalance;

                const sharePercent =
                  numOwners > 0
                    ? Math.round(100 / numOwners)
                    : 0;

                return (
                  <div
                    key={index}
                    className={`rounded-xl border-2 p-5 transition-all ${isOverdrawn
                        ? "border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20"
                        : "border-green-200 dark:border-green-900 bg-green-50/20 dark:bg-green-950/10"
                      }`}
                  >
                    {/* Owner Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3e0078] to-[#6d28d9] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          <User />
                        </div>
                        <span className="font-bold text-base uppercase tracking-wide text-card-foreground">
                          {owner.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase ${isOverdrawn
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                          }`}
                      >
                        {isOverdrawn ? "Overdrawn" : "Available"}
                      </span>
                    </div>

                    {/* Settlement Rows */}
                    <div className="space-y-2 text-sm">
                      {/* Profit Share */}
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                          Profit Share ({sharePercent}%)
                        </span>
                        <span className="font-semibold text-card-foreground tabular-nums">
                          ৳{" "}
                          {profitShare.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      </div>

                      {/* Already Taken */}
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                          Already Taken (Withdrawn)
                        </span>
                        <span className="font-semibold text-card-foreground tabular-nums">
                          ৳{" "}
                          {alreadyTaken.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      </div>

                      {/* Remaining Due */}
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                          Remaining Due (Can Take)
                        </span>
                        <span
                          className={`font-bold tabular-nums ${remainingDue > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                            }`}
                        >
                          ৳{" "}
                          {remainingDue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Overdrawn / Due to Company */}
                      <div className="flex items-center justify-between py-2">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                          Overdrawn / Due to Company
                        </span>
                        <span
                          className={`font-bold tabular-nums ${overdrawAmount > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground"
                            }`}
                        >
                          ৳{" "}
                          {overdrawAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div
                      className={`mt-4 flex items-start gap-3 rounded-lg p-3 ${isOverdrawn
                          ? "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900"
                          : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${isOverdrawn
                            ? "border-rose-500 text-rose-500"
                            : "border-green-500 text-green-500"
                          }`}
                      >
                        {isOverdrawn ? (
                          <span className="text-xs font-black leading-none">!</span>
                        ) : (
                          <svg
                            viewBox="0 0 12 12"
                            className="w-3 h-3 fill-current"
                          >
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${isOverdrawn
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-green-700 dark:text-green-400"
                            }`}
                        >
                          {isOverdrawn
                            ? "You are overdrawn."
                            : `You can withdraw up to ৳ ${remainingDue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${isOverdrawn
                              ? "text-rose-500 dark:text-rose-500"
                              : "text-green-600 dark:text-green-500"
                            }`}
                        >
                          {isOverdrawn
                            ? "Company will recover this amount from future profits."
                            : "based on your profit share."}
                        </p>
                      </div>
                    </div>

                    {/* Total available business balance note */}
                    {!isOverdrawn && totalBizBalance > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground text-right">
                        Total business balance: ৳{" "}
                        {totalBizBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    )}
                  </div>
                );
              });
            })()}
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
