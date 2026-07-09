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
  Wallet
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  share: number;
  ownerShare: number;
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
  const COLOR_PALETTE = [
    "#3e0078",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  return (
    <div className="py-6 flex flex-col gap-8 px-4 bg-slate-50/50 min-h-screen">
      {/* Top Banner Card with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3e0078] to-[#6d28d9] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-purple-900/10">
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
        <Card className="relative overflow-hidden bg-white p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</p>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                ৳{data.summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl shadow-inner group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="bg-green-50 px-2 py-0.5 rounded-full">Total earnings</span>
          </div>
        </Card>

        {/* Metric 2: Total Expenses */}
        <Card className="relative overflow-hidden bg-white p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                ৳{data.summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shadow-inner group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <span className="bg-rose-50 px-2 py-0.5 rounded-full">Total costs incurred</span>
          </div>
        </Card>

        {/* Metric 3: Net Profit */}
        <Card className="relative overflow-hidden bg-white p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</p>
              <h2 className={`text-3xl font-extrabold tracking-tight ${data.summary.netProfit >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                ৳{data.summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-inner group-hover:bg-[#3e0078] group-hover:text-white transition-colors duration-300">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
            <span className={`px-2 py-0.5 rounded-full ${data.summary.netProfit >= 0 ? "bg-purple-50 text-purple-700" : "bg-rose-50 text-rose-700"}`}>
              {data.summary.netProfit >= 0 ? "Net business profit" : "Net loss"}
            </span>
          </div>
        </Card>

        {/* Metric 4: Owner Count */}
        <Card className="relative overflow-hidden bg-white p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stakeholders</p>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {data.summary.ownerBalances.length}
              </h2>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span className="bg-amber-50 px-2 py-0.5 rounded-full">Profit sharing members</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income Chart */}
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 text-[#3e0078] rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Monthly Income</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.charts.monthlyIncome}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <XAxis dataKey="month" tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "rgba(62, 0, 120, 0.03)" }}
                contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                formatter={(value) => [`৳${Number(value).toFixed(2)}`, "Income"]}
              />
              <Bar dataKey="amount" fill={COLOR_PALETTE[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Expenses Chart */}
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Monthly Expenses</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.charts.monthlyExpenses}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <XAxis dataKey="month" tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "rgba(239, 68, 68, 0.03)" }}
                contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                formatter={(value) => [`৳${Number(value).toFixed(2)}`, "Expenses"]}
              />
              <Bar dataKey="amount" fill={COLOR_PALETTE[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Expense Breakdown</h2>
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
              <Tooltip formatter={(value) => `৳${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables Grid: Monthly Performance & Owner Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Table */}
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Monthly Performance</h2>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Month</TableHead>
                  <TableHead className="font-semibold text-slate-700">Income</TableHead>
                  <TableHead className="font-semibold text-slate-700">Expenses</TableHead>
                  <TableHead className="font-semibold text-slate-700">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyPerformance
                  .slice(-6)
                  .reverse()
                  .map((month) => (
                    <TableRow key={month.month} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-600">{month.monthName}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ৳{month.income.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-rose-600 font-medium">
                        ৳{month.expenses.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`font-bold ${
                          month.profit >= 0 ? "text-[#3e0078]" : "text-rose-600"
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
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Owner Balances</h2>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Owner</TableHead>
                  <TableHead className="font-semibold text-slate-700">Share</TableHead>
                  <TableHead className="font-semibold text-slate-700">Owner Share</TableHead>
                  <TableHead className="font-semibold text-slate-700">Withdrawn</TableHead>
                  <TableHead className="font-semibold text-slate-700">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.summary.ownerBalances.map((owner, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-800">{owner.name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{owner.share}%</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      ৳{owner.ownerShare.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-rose-600 font-semibold">
                      ৳{owner.withdrawn.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`font-bold ${owner.balance >= 0 ? "text-green-600" : "text-rose-600"}`}
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
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Income Category Breakdown</h2>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.incomeBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                      No income records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.incomeBreakdown.map((item) => (
                    <TableRow key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-semibold text-slate-700 flex items-center">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 ring-2 ring-white shadow-sm"
                          style={{ backgroundColor: item.category.color || "#10b981" }}
                        />
                        {item.category.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
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
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Expense Category Breakdown</h2>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenseBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                      No expense records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.expenseBreakdown.map((item) => (
                    <TableRow key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-semibold text-slate-700 flex items-center">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 ring-2 ring-white shadow-sm"
                          style={{ backgroundColor: item.category.color || "#ef4444" }}
                        />
                        {item.category.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600">
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
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Recent Income</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Title</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Payment</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.incomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                      No recent incomes.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentTransactions.incomes.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        <div>
                          <p className="text-sm">{tx.title}</p>
                          {tx.description && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px] font-normal mt-0.5">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-600 border-slate-200">
                          {tx.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span className="font-medium">{tx.paymentMethod}</span>
                        {tx.referenceNumber && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 text-sm">
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
        <Card className="p-5 shadow-sm border border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Recent Expenses</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Title</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Payment</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                      No recent expenses.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentTransactions.expenses.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        <div>
                          <p className="text-sm">{tx.title}</p>
                          {tx.description && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px] font-normal mt-0.5">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-600 border-slate-200">
                          {tx.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span className="font-medium">{tx.paymentMethod}</span>
                        {tx.referenceNumber && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 text-sm">
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
      <Card className="p-5 shadow-sm border border-slate-100 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <div className="p-1.5 bg-indigo-50 text-[#3e0078] rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Recent Activity Log</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentLogs.slice(0, 6).map((log) => (
            <div
              key={log._id}
              className="flex justify-between items-center border border-slate-100 p-4 rounded-xl bg-slate-50/30 hover:bg-slate-50/80 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm text-slate-700 tracking-tight">{log.description}</p>
                <p className="text-xs text-slate-400">
                  By <span className="font-medium text-slate-500">{log.adminEmail}</span> • <span className="font-medium text-slate-500">{log.action}</span>
                </p>
              </div>
              <div className="text-right space-y-1.5">
                <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-white border-slate-200 text-[#3e0078]">
                  {log.module}
                </Badge>
                <p className="text-[10px] text-slate-400 block font-mono">
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
