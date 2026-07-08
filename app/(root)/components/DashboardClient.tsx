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
}

interface Expense {
  _id: string;
  title: string;
  category: Category;
  amount: number;
  date: Date;
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

interface ExpenseBreakdownItem {
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
    expenseBreakdown: ExpenseBreakdownItem[];
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

  // Combine recent incomes and expenses
  const recentTransactions = [
    ...data.recentTransactions.incomes.map((i) => ({
      ...i,
      type: "income" as const,
    })),
    ...data.recentTransactions.expenses.map((e) => ({
      ...e,
      type: "expense" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="py-6 flex flex-col gap-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight">
        📊 GSEN NET Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5 shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-500">Total Income</p>
          <h2 className="text-3xl font-bold text-green-600">
            ৳{data.summary.totalIncome.toFixed(2)}
          </h2>
        </Card>

        <Card className="p-5 shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <h2 className="text-3xl font-bold text-red-600">
            ৳{data.summary.totalExpenses.toFixed(2)}
          </h2>
        </Card>

        <Card className="p-5 shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-500">Net Profit</p>
          <h2
            className={`text-3xl font-bold ${
              data.summary.netProfit >= 0 ? "text-[#3e0078]" : "text-red-600"
            }`}
          >
            ৳{data.summary.netProfit.toFixed(2)}
          </h2>
        </Card>

        <Card className="p-5 shadow-sm hover:shadow-md transition">
          <p className="text-sm text-gray-500">Owner Balances</p>
          <h2 className="text-3xl font-bold text-yellow-600">
            {data.summary.ownerBalances.length}
          </h2>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Income Chart */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Monthly Income</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.charts.monthlyIncome}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `৳${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="amount" fill={COLOR_PALETTE[0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Expenses Chart */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Monthly Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.charts.monthlyExpenses}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `৳${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="amount" fill={COLOR_PALETTE[3]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.expenseBreakdown}
                dataKey="total"
                nameKey="category.name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Performance Table */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Monthly Performance</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthlyPerformance
                .slice(-6)
                .reverse()
                .map((month) => (
                  <TableRow key={month.month}>
                    <TableCell>{month.monthName}</TableCell>
                    <TableCell className="text-green-600">
                      ৳{month.income.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      ৳{month.expenses.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`font-bold ${
                        month.profit >= 0 ? "text-[#3e0078]" : "text-red-600"
                      }`}
                    >
                      ৳{month.profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        {/* Owner Balances */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Owner Balances</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Owner Share</TableHead>
                <TableHead>Total Withdrawn</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.summary.ownerBalances.map((owner, index) => (
                <TableRow key={index}>
                  <TableCell>{owner.name}</TableCell>
                  <TableCell>{owner.share}%</TableCell>
                  <TableCell className="text-green-600">
                    ৳{owner.ownerShare.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-red-600">
                    ৳{owner.withdrawn.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`font-bold ${owner.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ৳{owner.balance.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{tx.title}</p>
                  <p className="text-sm text-gray-500">
                    {typeof tx.category === "object"
                      ? tx.category.name
                      : tx.category}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      tx.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}৳{tx.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {data.recentLogs.slice(0, 5).map((log) => (
              <div
                key={log._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{log.description}</p>
                  <p className="text-sm text-gray-500">
                    {log.adminEmail} • {log.module} • {log.action}
                  </p>
                </div>
                <div className="text-right">
                  <Badge>{log.module}</Badge>
                  <p className="text-sm text-gray-500">
                    {formatDate(log.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
