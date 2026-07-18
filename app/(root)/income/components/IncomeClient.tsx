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
import { Plus, Edit, Trash2, Download, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import IncomeForm from "./IncomeForm";
import { getIncomes, softDeleteIncome } from "@/lib/actions/income.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { exportToExcel, exportToCSV, getDateRange } from "@/lib/export-utils";
import { useWritePermission } from "@/lib/hooks/useWritePermission";
import { type Admin } from "@/lib/actions/admin.actions";
import Pagination from "@/components/shared/Pagination";

interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
  active: boolean;
}

interface Income {
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

export default function IncomeClient({
  initialIncomes,
  initialTotalPages,
  currentAdmin,
}: {
  initialIncomes: Income[];
  initialTotalPages: number;
  currentAdmin: Admin | null;
}) {
  const hasWriteAccess = useWritePermission(currentAdmin, "income");
  const [incomes, setIncomes] = useState(initialIncomes);
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
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [selectedDescription, setSelectedDescription] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories({ type: "Income" });
      setCategories(cats);
    }
    loadCategories();
  }, []);

  const loadIncomes = useCallback(async () => {
    const params: {
      search?: string;
      limit?: number;
      category?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
    } = { search, limit: 10, page: currentPage };
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
    const { incomes: newIncomes, totalPages: newTotalPages } =
      await getIncomes(params);
    setIncomes(newIncomes);
    setTotalPages(newTotalPages);
  }, [search, categoryFilter, period, startDate, endDate, currentPage]);

  // Reset to page 1 when any filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, period, startDate, endDate]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const handleSoftDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this income?")) {
      try {
        await softDeleteIncome(id);
        toast.success("Income deleted successfully");
        loadIncomes();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete income";
        toast.error(errorMessage);
      }
    }
  };

  const handleExportExcel = () => {
    const data = incomes.map((inc) => ({
      Category:
        typeof inc.category === "object" ? inc.category.name : inc.category,
      Amount: inc.amount,
      Date: formatDate(inc.date),
      PaymentMethod: inc.paymentMethod,
      Owner: inc.owner || "-",
      ReferenceNumber: inc.referenceNumber || "",
      Description: inc.description || "",
    }));
    exportToExcel(data, "incomes.xlsx", "Incomes");
    toast.success("Excel exported successfully");
  };

  const handleExportCSV = () => {
    const data = incomes.map((inc) => ({
      Category:
        typeof inc.category === "object" ? inc.category.name : inc.category,
      Amount: inc.amount,
      Date: formatDate(inc.date),
      PaymentMethod: inc.paymentMethod,
      Owner: inc.owner || "-",
      ReferenceNumber: inc.referenceNumber || "",
      Description: inc.description || "",
    }));
    exportToCSV(data, "incomes.csv");
    toast.success("CSV exported successfully");
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Income</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          {hasWriteAccess && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add Income
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
                <DialogHeader>
                  <DialogTitle>Add New Income</DialogTitle>
                </DialogHeader>
                <IncomeForm
                  currentAdmin={currentAdmin}
                  onSuccess={() => {
                    setIsAddOpen(false);
                    loadIncomes();
                    toast.success("Income added successfully");
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search income..."
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
            {incomes.map((income) => (
              <TableRow key={income._id}>
                <TableCell>
                  <Badge>
                    {typeof income.category === "object"
                      ? income.category.name
                      : income.category}
                  </Badge>
                </TableCell>
                <TableCell>﷼{income.amount.toFixed(2)}</TableCell>
                <TableCell>{formatDate(income.date)}</TableCell>
                <TableCell>{income.paymentMethod}</TableCell>
                <TableCell>{income.owner || "-"}</TableCell>
                <TableCell>{income.referenceNumber || "-"}</TableCell>
                <TableCell className="">
                  {/* View Description */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setSelectedDescription(
                            income.description || "No description available",
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md bg-white dark:bg-[#0F0A19]">
                      <DialogHeader>
                        <DialogTitle>Income Description</DialogTitle>
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
                      open={isEditOpen && editingIncome?._id === income._id}
                      onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditingIncome(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingIncome(income)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl bg-white dark:bg-[#0F0A19]">
                        <DialogHeader>
                          <DialogTitle>Edit Income</DialogTitle>
                        </DialogHeader>
                        <IncomeForm
                          currentAdmin={currentAdmin}
                          income={editingIncome ?? undefined}
                          onSuccess={() => {
                            setIsEditOpen(false);
                            setEditingIncome(null);
                            loadIncomes();
                            toast.success("Income updated successfully");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  {hasWriteAccess && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleSoftDelete(income._id)}
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
