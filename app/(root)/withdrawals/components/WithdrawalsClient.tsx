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
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import WithdrawalForm from "./WithdrawalForm";
import {
  getWithdrawals,
  deleteWithdrawal,
} from "@/lib/actions/withdrawal.actions";
import { exportToExcel, exportToCSV, getDateRange } from "@/lib/export-utils";
import { getSettings } from "@/lib/actions/settings.actions";
import { useWritePermission } from "@/lib/hooks/useWritePermission";
import { type Admin } from "@/lib/actions/admin.actions";
import Pagination from "@/components/shared/Pagination";

interface Withdrawal {
  _id: string;
  owner: string;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Owner {
  name: string;
}

export default function WithdrawalsClient({
  initialWithdrawals,
  initialTotalPages,
  currentAdmin,
}: {
  initialWithdrawals: Withdrawal[];
  initialTotalPages: number;
  currentAdmin: Admin | null;
}) {
  const hasWriteAccess = useWritePermission(currentAdmin, "withdrawals");
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [period, setPeriod] = useState("thisMonth");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState<Withdrawal | null>(
    null,
  );

  useEffect(() => {
    async function loadSettings() {
      const settings = await getSettings();
      setOwners(settings.owners || []);
    }
    loadSettings();
  }, []);

  const loadWithdrawals = useCallback(async () => {
    const params: {
      search?: string;
      limit?: number;
      owner?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
    } = { search, limit: 10, page: currentPage };
    if (ownerFilter) {
      params.owner = ownerFilter;
    }
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    const { withdrawals: newWithdrawals, totalPages: newTotalPages } =
      await getWithdrawals(params);
    setWithdrawals(newWithdrawals);
    setTotalPages(newTotalPages);
  }, [search, ownerFilter, period, startDate, endDate, currentPage]);

  // Reset to page 1 when any filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, ownerFilter, period, startDate, endDate]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this withdrawal?")) {
      try {
        await deleteWithdrawal(id);
        toast.success("Withdrawal deleted successfully");
        loadWithdrawals();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to delete withdrawal";
        toast.error(errorMessage);
      }
    }
  };

  const handleExportExcel = () => {
    const data = withdrawals.map((w) => ({
      Owner: w.owner,
      Amount: w.amount,
      Date: formatDate(w.date),
      Description: w.description || "",
    }));
    exportToExcel(data, "withdrawals.xlsx", "Withdrawals");
    toast.success("Excel exported successfully");
  };

  const handleExportCSV = () => {
    const data = withdrawals.map((w) => ({
      Owner: w.owner,
      Amount: w.amount,
      Date: formatDate(w.date),
      Description: w.description || "",
    }));
    exportToCSV(data, "withdrawals.csv");
    toast.success("CSV exported successfully");
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Withdrawals</h1>
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
                  <Plus className="mr-2 h-4 w-4" /> Add Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
                <DialogHeader>
                  <DialogTitle>Add New Withdrawal</DialogTitle>
                </DialogHeader>
                <WithdrawalForm
                  currentAdmin={currentAdmin}
                  onSuccess={() => {
                    setIsAddOpen(false);
                    loadWithdrawals();
                    toast.success("Withdrawal added successfully");
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search withdrawals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={ownerFilter || "all"}
          onValueChange={(value) =>
            setOwnerFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner.name} value={owner.name}>
                {owner.name}
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
              <TableHead>Owner</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal._id}>
                <TableCell>{withdrawal.owner}</TableCell>
                <TableCell>﷼{withdrawal.amount.toFixed(2)}</TableCell>
                <TableCell>{formatDate(withdrawal.date)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {withdrawal.description}
                </TableCell>
                <TableCell className="flex gap-2">
                  {hasWriteAccess && (
                    <Dialog
                      open={
                        isEditOpen && editingWithdrawal?._id === withdrawal._id
                      }
                      onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditingWithdrawal(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingWithdrawal(withdrawal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white dark:bg-[#0F0A19]">
                        <DialogHeader>
                          <DialogTitle>Edit Withdrawal</DialogTitle>
                        </DialogHeader>
                        <WithdrawalForm
                          withdrawal={editingWithdrawal ?? undefined}
                          currentAdmin={currentAdmin}
                          onSuccess={() => {
                            setIsEditOpen(false);
                            setEditingWithdrawal(null);
                            loadWithdrawals();
                            toast.success("Withdrawal updated successfully");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  {hasWriteAccess && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(withdrawal._id)}
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
