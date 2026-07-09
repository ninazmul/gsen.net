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
          <p className="text-sm text-gray-500">Owner Count</p>
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

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Category Breakdown */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Income Category Breakdown</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
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
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
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
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Expense Category Breakdown</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
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
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.category.color || "#ef4444" }}
                        />
                        {item.category.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
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

      {/* Recent Income & Expenses Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Income Table */}
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Income</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                    <TableRow key={tx._id}>
                      <TableCell className="text-xs text-gray-500">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p>{tx.title}</p>
                          {tx.description && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {tx.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {tx.paymentMethod}
                        {tx.referenceNumber && (
                          <span className="block text-[10px] text-gray-400">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
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
        <Card className="p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                    <TableRow key={tx._id}>
                      <TableCell className="text-xs text-gray-500">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p>{tx.title}</p>
                          {tx.description && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {tx.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {tx.paymentMethod}
                        {tx.referenceNumber && (
                          <span className="block text-[10px] text-gray-400">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
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

      {/* Recent Activity */}
      <Card className="p-5 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentLogs.slice(0, 6).map((log) => (
            <div
              key={log._id}
              className="flex justify-between items-center border p-3 rounded-md bg-gray-50/50 hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-medium text-sm text-gray-800">{log.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {log.adminEmail} • {log.action}
                </p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant="outline">{log.module}</Badge>
                <p className="text-[10px] text-gray-400">
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
