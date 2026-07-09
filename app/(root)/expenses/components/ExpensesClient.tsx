"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import ExpenseForm from "./ExpenseForm";
import { getExpenses, softDeleteExpense } from "@/lib/actions/expense.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { exportToExcel, exportToCSV, getDateRange } from "@/lib/export-utils";

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
  title: string;
  category: string | Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  deletedAt?: Date;
}

export default function ExpensesClient({
  initialExpenses,
}: {
  initialExpenses: Expense[];
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [period, setPeriod] = useState("thisMonth");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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
    } = { search };
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
    const { expenses: newExpenses } = await getExpenses(params);
    setExpenses(newExpenses);
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
      Title: exp.title,
      Category:
        typeof exp.category === "object" ? exp.category.name : exp.category,
      Amount: exp.amount,
      Date: formatDate(exp.date),
      PaymentMethod: exp.paymentMethod,
      ReferenceNumber: exp.referenceNumber || "",
      Description: exp.description || "",
    }));
    exportToExcel(data, "expenses.xlsx", "Expenses");
    toast.success("Excel exported successfully");
  };

  const handleExportCSV = () => {
    const data = expenses.map((exp) => ({
      Title: exp.title,
      Category:
        typeof exp.category === "object" ? exp.category.name : exp.category,
      Amount: exp.amount,
      Date: formatDate(exp.date),
      PaymentMethod: exp.paymentMethod,
      ReferenceNumber: exp.referenceNumber || "",
      Description: exp.description || "",
    }));
    exportToCSV(data, "expenses.csv");
    toast.success("CSV exported successfully");
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <ExpenseForm
                onSuccess={() => {
                  setIsAddOpen(false);
                  loadExpenses();
                  toast.success("Expense added successfully");
                }}
              />
            </DialogContent>
          </Dialog>
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
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
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
                <TableCell>{expense.referenceNumber || "-"}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {expense.description}
                </TableCell>
                <TableCell className="flex gap-2">
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
                    <DialogContent className="max-w-2xl bg-white">
                      <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                      </DialogHeader>
                      <ExpenseForm
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleSoftDelete(expense._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
