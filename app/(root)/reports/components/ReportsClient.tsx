"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import {
  getIncomeReport,
  getExpenseReport,
  getProfitReport,
  getCategoryReport,
  getMonthlyPerformanceReport,
  logReportExport,
} from "@/lib/actions/reports.actions";
import { getCategories } from "@/lib/actions/category.actions";
import {
  exportToExcel,
  exportToCSV,
  getDateRange,
  exportToPDF,
} from "@/lib/export-utils";
import IncomeReportTemplate from "./IncomeReportTemplate";
import ExpenseReportTemplate from "./ExpenseReportTemplate";
import ProfitReportTemplate from "./ProfitReportTemplate";
import CategoryReportTemplate from "./CategoryReportTemplate";
import MonthlyReportTemplate from "./MonthlyReportTemplate";

// Define types
interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  active: boolean;
}

interface Income {
  _id: string;
  title: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

interface Expense {
  _id: string;
  title: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

interface MonthlyData {
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitPercent: number;
}

interface MonthlyReport {
  monthlyData: MonthlyData[];
  yearlyTotal: {
    income: number;
    expenses: number;
    profit: number;
  };
}

export default function ReportsClient({
  initialMonthlyReport,
}: {
  initialMonthlyReport: MonthlyReport;
}) {
  const [period, setPeriod] = useState("thisMonth");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState("all");
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("income");
  const [incomeReport, setIncomeReport] = useState<{
    incomes: Income[];
    total: number;
  }>({ incomes: [], total: 0 });
  const [expenseReport, setExpenseReport] = useState<{
    expenses: Expense[];
    total: number;
  }>({ expenses: [], total: 0 });
  const [profitReport, setProfitReport] = useState<{
    incomes: Income[];
    expenses: Expense[];
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  }>({
    incomes: [],
    expenses: [],
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [categoryReport, setCategoryReport] = useState<
    {
      category: Category;
      total: number;
      count: number;
    }[]
  >([]);
  const [monthlyReport, setMonthlyReport] =
    useState<MonthlyReport>(initialMonthlyReport);

  // Refs for PDF export
  const incomeReportTemplateRef = useRef<HTMLDivElement>(null);
  const expenseReportTemplateRef = useRef<HTMLDivElement>(null);
  const profitReportTemplateRef = useRef<HTMLDivElement>(null);
  const categoryReportTemplateRef = useRef<HTMLDivElement>(null);
  const monthlyReportTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCategories() {
      const incomeCats = await getCategories({ type: "Income" });
      const expenseCats = await getCategories({ type: "Expense" });
      setIncomeCategories(incomeCats);
      setExpenseCategories(expenseCats);
    }
    loadCategories();
  }, []);

  const loadIncomeReport = useCallback(async () => {
    const params: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
    } = {};
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    if (selectedIncomeCategory && selectedIncomeCategory !== "all") {
      params.category = selectedIncomeCategory;
    }
    const report = await getIncomeReport(params);
    setIncomeReport(report);
  }, [period, startDate, endDate, selectedIncomeCategory]);

  const loadExpenseReport = useCallback(async () => {
    const params: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
    } = {};
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    if (selectedExpenseCategory && selectedExpenseCategory !== "all") {
      params.category = selectedExpenseCategory;
    }
    const report = await getExpenseReport(params);
    setExpenseReport(report);
  }, [period, startDate, endDate, selectedExpenseCategory]);

  const loadProfitReport = useCallback(async () => {
    const params: {
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    const report = await getProfitReport(params);
    setProfitReport(report);
  }, [period, startDate, endDate]);

  const loadCategoryReport = useCallback(async () => {
    const params: {
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    const report = await getCategoryReport(params);
    setCategoryReport(report);
  }, [period, startDate, endDate]);

  const loadMonthlyReport = useCallback(async () => {
    const report = await getMonthlyPerformanceReport(parseInt(year));
    setMonthlyReport(report);
  }, [year]);

  // Load initial reports
  useEffect(() => {
    loadIncomeReport();
    loadExpenseReport();
    loadProfitReport();
    loadCategoryReport();
    loadMonthlyReport();
  }, [
    loadIncomeReport,
    loadExpenseReport,
    loadProfitReport,
    loadCategoryReport,
    loadMonthlyReport,
  ]);

  // Load reports when relevant filters change
  useEffect(() => {
    if (activeTab === "income") {
      loadIncomeReport();
    } else if (activeTab === "expenses") {
      loadExpenseReport();
    } else if (activeTab === "profit") {
      loadProfitReport();
    } else if (activeTab === "category") {
      loadCategoryReport();
    }
  }, [
    activeTab,
    period,
    startDate,
    endDate,
    selectedIncomeCategory,
    selectedExpenseCategory,
    loadIncomeReport,
    loadExpenseReport,
    loadProfitReport,
    loadCategoryReport,
  ]);

  // Load monthly report when year changes
  useEffect(() => {
    loadMonthlyReport();
  }, [year, loadMonthlyReport]);

  const handleExportIncome = async (format: "xlsx" | "csv" | "pdf") => {
    if (format === "pdf") {
      await exportToPDF(incomeReportTemplateRef.current, "income-report.pdf");
    } else {
      const data = incomeReport.incomes.map((inc) => ({
        Title: inc.title,
        Category:
          typeof inc.category === "object" ? inc.category.name : inc.category,
        Amount: inc.amount,
        Date: formatDate(inc.date),
        PaymentMethod: inc.paymentMethod,
        ReferenceNumber: inc.referenceNumber || "",
        Description: inc.description || "",
      }));
      if (format === "xlsx") {
        exportToExcel(data, "income-report.xlsx", "Income Report");
      } else {
        exportToCSV(data, "income-report.csv");
      }
    }
    await logReportExport("income", format);
  };

  const handleExportExpense = async (format: "xlsx" | "csv" | "pdf") => {
    if (format === "pdf") {
      await exportToPDF(expenseReportTemplateRef.current, "expense-report.pdf");
    } else {
      const data = expenseReport.expenses.map((exp) => ({
        Title: exp.title,
        Category:
          typeof exp.category === "object" ? exp.category.name : exp.category,
        Amount: exp.amount,
        Date: formatDate(exp.date),
        PaymentMethod: exp.paymentMethod,
        ReferenceNumber: exp.referenceNumber || "",
        Description: exp.description || "",
      }));
      if (format === "xlsx") {
        exportToExcel(data, "expense-report.xlsx", "Expense Report");
      } else {
        exportToCSV(data, "expense-report.csv");
      }
    }
    await logReportExport("expense", format);
  };

  const handleExportCategory = async (format: "xlsx" | "csv" | "pdf") => {
    if (format === "pdf") {
      await exportToPDF(
        categoryReportTemplateRef.current,
        "category-report.pdf",
      );
    } else {
      const data = categoryReport.map((item) => ({
        Category: item.category.name,
        Type: item.category.type,
        Total: item.total,
        Count: item.count,
      }));
      if (format === "xlsx") {
        exportToExcel(data, "category-report.xlsx", "Category Report");
      } else {
        exportToCSV(data, "category-report.csv");
      }
    }
    await logReportExport("category", format);
  };

  const handleExportMonthly = async (format: "xlsx" | "csv" | "pdf") => {
    if (format === "pdf") {
      await exportToPDF(monthlyReportTemplateRef.current, "monthly-report.pdf");
    } else {
      const data = monthlyReport.monthlyData.map((item) => ({
        Month: item.monthName,
        Income: item.totalIncome,
        Expenses: item.totalExpenses,
        Profit: item.profit,
        "Profit %": item.profitPercent.toFixed(2) + "%",
      }));
      if (format === "xlsx") {
        exportToExcel(data, "monthly-report.xlsx", "Monthly Performance");
      } else {
        exportToCSV(data, "monthly-report.csv");
      }
    }
    await logReportExport("monthly", format);
  };

  const handleExportProfit = async () => {
    await exportToPDF(profitReportTemplateRef.current, "profit-report.pdf");
    await logReportExport("profit", "pdf");
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && (
            <>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
              />
            </>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="income"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="income">Income Report</TabsTrigger>
          <TabsTrigger value="expenses">Expense Report</TabsTrigger>
          <TabsTrigger value="profit">Profit Report</TabsTrigger>
          <TabsTrigger value="category">Category Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <div className="p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-semibold">Income Report</h3>
                <Select
                  value={selectedIncomeCategory}
                  onValueChange={setSelectedIncomeCategory}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {incomeCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExportIncome("xlsx")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportIncome("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportIncome("pdf")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="p-4 border-t">
              <p className="text-lg font-semibold">
                Total Income:{" "}
                <span className="text-green-600">
                  ৳{incomeReport.total.toFixed(2)}
                </span>
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeReport.incomes.map((income) => (
                  <TableRow key={income._id}>
                    <TableCell>{income.title}</TableCell>
                    <TableCell>
                      <Badge>
                        {typeof income.category === "object"
                          ? income.category.name
                          : income.category}
                      </Badge>
                    </TableCell>
                    <TableCell>৳{income.amount.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(income.date)}</TableCell>
                    <TableCell>{income.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <div className="p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-semibold">Expense Report</h3>
                <Select
                  value={selectedExpenseCategory}
                  onValueChange={setSelectedExpenseCategory}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExportExpense("xlsx")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportExpense("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportExpense("pdf")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="p-4 border-t">
              <p className="text-lg font-semibold">
                Total Expenses:{" "}
                <span className="text-red-600">
                  ৳{expenseReport.total.toFixed(2)}
                </span>
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseReport.expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>
                      <Badge>
                        {typeof expense.category === "object"
                          ? expense.category.name
                          : expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>৳{expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <Card>
            <div className="p-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Profit Report</h3>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleExportProfit}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <Card className="p-4">
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ৳{profitReport.totalIncome.toFixed(2)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{profitReport.totalExpenses.toFixed(2)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    profitReport.netProfit >= 0
                      ? "text-[#3e0078]"
                      : "text-red-600"
                  }`}
                >
                  ৳{profitReport.netProfit.toFixed(2)}
                </p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="category">
          <Card>
            <div className="p-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Category Report</h3>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExportCategory("xlsx")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportCategory("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportCategory("pdf")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryReport.map((item) => (
                  <TableRow key={item.category._id}>
                    <TableCell>{item.category.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.category.type === "Income"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {item.category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>৳{item.total.toFixed(2)}</TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-semibold">
                  Monthly Performance - {year}
                </h3>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleExportMonthly("xlsx")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportMonthly("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportMonthly("pdf")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <Card className="p-4">
                <p className="text-sm text-gray-500">Yearly Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ৳{monthlyReport.yearlyTotal.income.toFixed(2)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Yearly Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{monthlyReport.yearlyTotal.expenses.toFixed(2)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">Yearly Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    monthlyReport.yearlyTotal.profit >= 0
                      ? "text-[#3e0078]"
                      : "text-red-600"
                  }`}
                >
                  ৳{monthlyReport.yearlyTotal.profit.toFixed(2)}
                </p>
              </Card>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Profit %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyReport.monthlyData.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell>{item.monthName}</TableCell>
                    <TableCell>৳{item.totalIncome.toFixed(2)}</TableCell>
                    <TableCell>৳{item.totalExpenses.toFixed(2)}</TableCell>
                    <TableCell
                      className={
                        item.profit >= 0
                          ? "text-[#3e0078] font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      ৳{item.profit.toFixed(2)}
                    </TableCell>
                    <TableCell>{item.profitPercent.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden Report Templates for PDF Export */}
      <div className="absolute left-[-9999px] top-0">
        <IncomeReportTemplate
          incomes={incomeReport.incomes}
          total={incomeReport.total}
          ref={incomeReportTemplateRef}
        />
      </div>
      <div className="absolute left-[-9999px] top-0">
        <ExpenseReportTemplate
          expenses={expenseReport.expenses}
          total={expenseReport.total}
          ref={expenseReportTemplateRef}
        />
      </div>
      <div className="absolute left-[-9999px] top-0">
        <ProfitReportTemplate
          incomes={profitReport.incomes}
          expenses={profitReport.expenses}
          totalIncome={profitReport.totalIncome}
          totalExpenses={profitReport.totalExpenses}
          netProfit={profitReport.netProfit}
          ref={profitReportTemplateRef}
        />
      </div>
      <div className="absolute left-[-9999px] top-0">
        <CategoryReportTemplate
          categories={categoryReport}
          ref={categoryReportTemplateRef}
        />
      </div>
      <div className="absolute left-[-9999px] top-0">
        <MonthlyReportTemplate
          monthlyData={monthlyReport.monthlyData}
          yearlyTotal={monthlyReport.yearlyTotal}
          year={year}
          ref={monthlyReportTemplateRef}
        />
      </div>
    </div>
  );
}
