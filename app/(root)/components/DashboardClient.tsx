"use client";

import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  CalendarDays,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

  const chartTickColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#1e1b2e" : "#ffffff";
  const tooltipBorder = isDark ? "#2e2b3e" : "#e2e8f0";

  return (
    <div className="py-6 flex flex-col gap-8 px-4 bg-background min-h-screen">
      {/* Top Banner Card with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3e0078] to-[#6d28d9] dark:from-[#2d0059] dark:to-[#4c1d95] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-purple-900/20">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              GSEN NET Dashboard
            </h1>
            <p className="text-purple-100 mt-2 text-sm md:text-base font-light">
              Welcome back, Admin! Here is your business overview and activity analysis.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs md:text-sm font-medium">
            <CalendarDays className="w-4 h-4 text-purple-200 animate-pulse" />
            <span>{formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Metric 1: Total Income */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50/50 dark:bg-green-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Income</p>
              <h2 className="text-3xl font-extrabold text-card-foreground tracking-tight">
                ৳{data.summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl shadow-inner group-hover:bg-green-600 group-hover:text-white dark:group-hover:bg-green-700 transition-colors duration-300">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
            <span className="bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">Total earnings</span>
          </div>
        </Card>

        {/* Metric 2: Total Expenses */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 dark:bg-rose-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expenses</p>
              <h2 className="text-3xl font-extrabold text-card-foreground tracking-tight">
                ৳{data.summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shadow-inner group-hover:bg-rose-600 group-hover:text-white dark:group-hover:bg-rose-700 transition-colors duration-300">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span className="bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">Total costs incurred</span>
          </div>
        </Card>

        {/* Metric 3: Net Profit */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 dark:bg-purple-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Profit</p>
              <h2 className={`text-3xl font-extrabold tracking-tight ${data.summary.netProfit >= 0 ? "text-card-foreground" : "text-rose-600 dark:text-rose-400"}`}>
                ৳{data.summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shadow-inner group-hover:bg-[#3e0078] group-hover:text-white dark:group-hover:bg-purple-700 transition-colors duration-300">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
            <span className={`px-2 py-0.5 rounded-full ${data.summary.netProfit >= 0 ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"}`}>
              {data.summary.netProfit >= 0 ? "Net business profit" : "Net loss"}
            </span>
          </div>
        </Card>

        {/* Metric 4: Owner Count */}
        <Card className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 dark:bg-amber-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stakeholders</p>
              <h2 className="text-3xl font-extrabold text-card-foreground tracking-tight">
                {data.summary.ownerBalances.length}
              </h2>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl shadow-inner group-hover:bg-amber-600 group-hover:text-white dark:group-hover:bg-amber-700 transition-colors duration-300">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span className="bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Profit sharing members</span>
          </div>
        </Card>
      </div>

      {/* Owner Overview Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-card-foreground">Owner Summaries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.summary.ownerBalances.map((owner, index) => (
            <Card key={index} className="relative overflow-hidden bg-card p-6 shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 dark:bg-purple-900/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-card-foreground tracking-tight">{owner.name}</h3>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-[#3e0078] dark:text-purple-400 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Income</p>
                  <p className="text-base font-bold text-green-600 dark:text-green-400">
                    ৳{owner.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                    ৳{owner.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground">Withdrawn</p>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                    ৳{owner.withdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className={`text-lg font-extrabold ${owner.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}>
                    ৳{owner.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income Chart */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-[#3e0078] dark:text-purple-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">Monthly Income</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.charts.monthlyIncome}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <XAxis dataKey="month" tickLine={false} tick={{ fill: chartTickColor, fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTickColor, fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "rgba(124, 58, 237, 0.06)" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", color: isDark ? "#e2e8f0" : "#1e293b" }}
                formatter={(value) => [`৳${Number(value).toFixed(2)}`, "Income"]}
              />
              <Bar dataKey="amount" fill={COLOR_PALETTE[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Expenses Chart */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">Monthly Expenses</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.charts.monthlyExpenses}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <XAxis dataKey="month" tickLine={false} tick={{ fill: chartTickColor, fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTickColor, fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "rgba(239, 68, 68, 0.06)" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", color: isDark ? "#e2e8f0" : "#1e293b" }}
                formatter={(value) => [`৳${Number(value).toFixed(2)}`, "Expenses"]}
              />
              <Bar dataKey="amount" fill={COLOR_PALETTE[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">Expense Breakdown</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.expenseBreakdown}
                dataKey="total"
                nameKey="category.name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              >
                {data.expenseBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `৳${Number(value).toFixed(2)}`}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", color: isDark ? "#e2e8f0" : "#1e293b" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables Grid: Monthly Performance & Owner Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Table */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <h2 className="text-lg font-bold text-card-foreground mb-4 pb-2 border-b border-border">Monthly Performance</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-muted-foreground">Month</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Income</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Expenses</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyPerformance
                  .slice(-6)
                  .reverse()
                  .map((month) => (
                    <TableRow key={month.month} className="hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="font-medium text-muted-foreground">{month.monthName}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400 font-medium">
                        ৳{month.income.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-rose-600 dark:text-rose-400 font-medium">
                        ৳{month.expenses.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`font-bold ${
                          month.profit >= 0 ? "text-[#3e0078] dark:text-purple-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        ৳{month.profit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Owner Balances */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <h2 className="text-lg font-bold text-card-foreground mb-4 pb-2 border-b border-border">Owner Balances</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-muted-foreground">Owner</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Total Income</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Total Expense</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Withdrawn</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.summary.ownerBalances.map((owner, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors border-border">
                    <TableCell className="font-medium text-card-foreground">{owner.name}</TableCell>
                    <TableCell className="text-green-600 dark:text-green-400 font-semibold">
                      ৳{owner.totalIncome.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-rose-600 dark:text-rose-400 font-semibold">
                      ৳{owner.totalExpenses.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-rose-600 dark:text-rose-400 font-semibold">
                      ৳{owner.withdrawn.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`font-bold ${owner.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      ৳{owner.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Category Breakdown */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <h2 className="text-lg font-bold text-card-foreground mb-4 pb-2 border-b border-border">Income Category Breakdown</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-muted-foreground">Category</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.incomeBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      No income records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.incomeBreakdown.map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="font-semibold text-card-foreground flex items-center">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 ring-2 ring-background shadow-sm"
                          style={{ backgroundColor: item.category.color || "#10b981" }}
                        />
                        {item.category.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                        ৳{item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Expense Category Breakdown */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <h2 className="text-lg font-bold text-card-foreground mb-4 pb-2 border-b border-border">Expense Category Breakdown</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-muted-foreground">Category</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenseBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      No expense records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.expenseBreakdown.map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="font-semibold text-card-foreground flex items-center">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 ring-2 ring-background shadow-sm"
                          style={{ backgroundColor: item.category.color || "#ef4444" }}
                        />
                        {item.category.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                        ৳{item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Recent Income & Expenses Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Income Table */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <div className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">Recent Income</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Payment</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.incomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      No recent incomes.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentTransactions.incomes.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-card-foreground">
                        <div>
                          <p className="text-sm">{tx.title}</p>
                          {tx.description && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[140px] font-normal mt-0.5">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/50 text-muted-foreground border-border">
                          {tx.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="font-medium">{tx.paymentMethod}</span>
                        {tx.referenceNumber && (
                          <span className="block text-[9px] text-muted-foreground font-mono mt-0.5">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400 text-sm">
                        ৳{tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Recent Expense Table */}
        <Card className="p-5 shadow-sm border border-border bg-card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">Recent Expenses</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Payment</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      No recent expenses.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentTransactions.expenses.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-card-foreground">
                        <div>
                          <p className="text-sm">{tx.title}</p>
                          {tx.description && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[140px] font-normal mt-0.5">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/50 text-muted-foreground border-border">
                          {tx.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="font-medium">{tx.paymentMethod}</span>
                        {tx.referenceNumber && (
                          <span className="block text-[9px] text-muted-foreground font-mono mt-0.5">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400 text-sm">
                        ৳{tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Recent Activity Full-width Table */}
      <Card className="p-5 shadow-sm border border-border bg-card">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-[#3e0078] dark:text-purple-400 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-card-foreground">Recent Activity Log</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentLogs.slice(0, 6).map((log) => (
            <div
              key={log._id}
              className="flex justify-between items-center border border-border p-4 rounded-xl bg-muted/20 hover:bg-muted/40 hover:border-border hover:shadow-sm transition-all duration-200"
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm text-card-foreground tracking-tight">{log.description}</p>
                <p className="text-xs text-muted-foreground">
                  By <span className="font-medium text-foreground/70">{log.adminEmail}</span> • <span className="font-medium text-foreground/70">{log.action}</span>
                </p>
              </div>
              <div className="text-right space-y-1.5">
                <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-card border-border text-[#3e0078] dark:text-purple-400 dark:border-purple-800">
                  {log.module}
                </Badge>
                <p className="text-[10px] text-muted-foreground block font-mono">
                  {formatDate(log.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
