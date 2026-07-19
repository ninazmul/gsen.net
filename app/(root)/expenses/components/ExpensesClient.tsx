"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Download, Eye, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import ExpenseForm from "./ExpenseForm";
import {
  getExpenses,
  importExpensesFromExcel,
  softDeleteExpense,
} from "@/lib/actions/expense.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { exportToExcel, exportToCSV, getDateRange } from "@/lib/export-utils";
import { useWritePermission } from "@/lib/hooks/useWritePermission";
import { type Admin } from "@/lib/actions/admin.actions";
import Pagination from "@/components/shared/Pagination";

// Define types
interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  active: boolean;
}

interface Expense {
  _id: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
  deletedAt?: Date;
}

export default function ExpensesClient({
  initialExpenses,
  initialTotalPages,
  currentAdmin,
}: {
  initialExpenses: Expense[];
  initialTotalPages: number;
  currentAdmin: Admin | null;
}) {
  const hasWriteAccess = useWritePermission(currentAdmin, "expenses");
  const [expenses, setExpenses] = useState(initialExpenses);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [period, setPeriod] = useState("thisMonth");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories({ type: "Expense" });
      setCategories(cats);
    }
    loadCategories();
  }, []);

  const loadExpenses = useCallback(async () => {
    const params: {
      search?: string;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = { search, page: currentPage, limit: 10 };
    if (categoryFilter) {
      params.category = categoryFilter;
    }
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    const { expenses: newExpenses, totalPages: newTotalPages } =
      await getExpenses(params);
    setExpenses(newExpenses);
    setTotalPages(newTotalPages);
  }, [search, categoryFilter, period, startDate, endDate, currentPage]);

  // Reset to page 1 when any filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, period, startDate, endDate]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSoftDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await softDeleteExpense(id);
        toast.success("Expense deleted successfully");
        loadExpenses();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete expense";
        toast.error(errorMessage);
      }
    }
  };

  const handleExportExcel = () => {
    const data = expenses.map((exp) => ({
      Category:
        typeof exp.category === "object" ? exp.category.name : exp.category,
      Amount: exp.amount,
      Date: formatDate(exp.date),
      PaymentMethod: exp.paymentMethod,
      Owner: exp.owner || "-",
      ReferenceNumber: exp.referenceNumber || "",
      Description: exp.description || "",
    }));
    exportToExcel(data, "expenses.xlsx", "Expenses");
    toast.success("Excel exported successfully");
  };

  const handleExportCSV = () => {
    const data = expenses.map((exp) => ({
      Category:
        typeof exp.category === "object" ? exp.category.name : exp.category,
      Amount: exp.amount,
      Date: formatDate(exp.date),
      PaymentMethod: exp.paymentMethod,
      Owner: exp.owner || "-",
      ReferenceNumber: exp.referenceNumber || "",
      Description: exp.description || "",
    }));
    exportToCSV(data, "expenses.csv");
    toast.success("CSV exported successfully");
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Category Name": "Utilities",
        Amount: 250,
        Date: "2026-07-19",
        "Payment Method": "Cash",
        Owner: "admin@example.com",
        "Reference Number": "REF-001",
        Description: "Monthly electricity bill",
      },
    ];

    exportToExcel(
      templateData,
      "expense-import-template.xlsx",
      "Expense Import",
    );
    toast.success("Import template downloaded successfully");
  };

  const getCellValue = (
    row: Record<string, unknown>,
    possibleKeys: string[],
  ) => {
    const normalizedKeys = Object.keys(row).map((key) =>
      key.trim().toLowerCase(),
    );

    for (const key of possibleKeys) {
      const match = normalizedKeys.indexOf(key.trim().toLowerCase());
      if (match >= 0) {
        return row[Object.keys(row)[match]];
      }
    }

    return undefined;
  };

  const handleImportExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
        },
      );

      const payload = rows
        .filter((row) =>
          Object.values(row).some(
            (value) => value !== "" && value !== undefined && value !== null,
          ),
        )
        .map((row) => ({
          categoryName:
            String(
              getCellValue(row, [
                "Category Name",
                "Category",
                "categoryName",
              ]) ?? "",
            ).trim() || "Uncategorized",
          amount: Number(getCellValue(row, ["Amount", "amount"]) ?? 0) || 1,
          date:
            String(getCellValue(row, ["Date", "date"]) ?? "").trim() ||
            new Date().toISOString().split("T")[0],
          paymentMethod:
            String(
              getCellValue(row, [
                "Payment Method",
                "PaymentMethod",
                "paymentMethod",
              ]) ?? "",
            ).trim() || "Cash",
          referenceNumber: String(
            getCellValue(row, [
              "Reference Number",
              "ReferenceNumber",
              "referenceNumber",
            ]) ?? "",
          ).trim(),
          description: String(
            getCellValue(row, ["Description", "description"]) ?? "",
          ).trim(),
          owner: String(getCellValue(row, ["Owner", "owner"]) ?? "").trim(),
        }));

      if (!payload.length) {
        toast.error("No rows found in the uploaded file");
        return;
      }

      const result = await importExpensesFromExcel(payload);
      const summaryMessage =
        result.failedCount > 0
          ? `Import complete: ${result.importedCount} expenses imported, ${result.failedCount} failed${result.errors[0] ? `. First issue: ${result.errors[0]}` : ""}`
          : `${result.importedCount} expenses imported successfully`;
      if (result.importedCount > 0) {
        toast.success(summaryMessage);
      } else {
        toast.error(summaryMessage);
      }
      await loadExpenses();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to import expense data";
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          {hasWriteAccess && (
            <>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Template
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import Excel"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImportExcel}
              />
            </>
          )}
          {hasWriteAccess && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <ExpenseForm
                  currentAdmin={currentAdmin}
                  onSuccess={() => {
                    setIsAddOpen(false);
                    loadExpenses();
                    toast.success("Expense added successfully");
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoryFilter || "all"}
          onValueChange={(value) =>
            setCategoryFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell>
                  <Badge>
                    {typeof expense.category === "object"
                      ? expense.category.name
                      : expense.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {expense.amount.toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">SAR</span>
                </TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>{expense.paymentMethod}</TableCell>
                <TableCell>{expense.owner || "-"}</TableCell>
                <TableCell>{expense.referenceNumber || "-"}</TableCell>
                <TableCell className="">
                  {/* View Description */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setSelectedDescription(
                            expense.description || "No description available",
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md bg-white dark:bg-[#0F0A19]">
                      <DialogHeader>
                        <DialogTitle>Expense Description</DialogTitle>
                      </DialogHeader>

                      <div className="mt-4 text-sm whitespace-pre-wrap">
                        {selectedDescription}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="flex gap-2">
                  {hasWriteAccess && (
                    <Dialog
                      open={isEditOpen && editingExpense?._id === expense._id}
                      onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditingExpense(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingExpense(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
                        <DialogHeader>
                          <DialogTitle>Edit Expense</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm
                          currentAdmin={currentAdmin}
                          expense={editingExpense ?? undefined}
                          onSuccess={() => {
                            setIsEditOpen(false);
                            setEditingExpense(null);
                            loadExpenses();
                            toast.success("Expense updated successfully");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  {hasWriteAccess && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleSoftDelete(expense._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
