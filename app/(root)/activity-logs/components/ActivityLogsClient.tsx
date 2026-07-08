"use client";

import { useState, useEffect, useCallback } from "react";
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
import { getActivityLogs } from "@/lib/actions/activity-log.actions";
import { exportToExcel, exportToCSV, getDateRange } from "@/lib/export-utils";

interface ActivityLog {
  _id: string;
  date: Date;
  adminEmail: string;
  module: string;
  action: string;
  description: string;
  createdAt: Date;
}

export default function ActivityLogsClient({
  initialLogs,
}: {
  initialLogs: ActivityLog[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [period, setPeriod] = useState("thisMonth");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadLogs = useCallback(async () => {
    const params: {
      search?: string;
      module?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = { search, limit: 100 };
    if (moduleFilter && moduleFilter !== "all") params.module = moduleFilter;
    if (actionFilter && actionFilter !== "all") params.action = actionFilter;
    if (period === "custom" && startDate && endDate) {
      params.startDate = new Date(startDate);
      params.endDate = new Date(endDate);
    } else if (period !== "custom") {
      const range = getDateRange(period);
      params.startDate = range.startDate;
      params.endDate = range.endDate;
    }
    const { logs: newLogs } = await getActivityLogs(params);
    setLogs(newLogs);
  }, [search, moduleFilter, actionFilter, period, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportExcel = () => {
    const data = logs.map((log) => ({
      Date: formatDate(log.date),
      Time: new Date(log.date).toLocaleTimeString(),
      Admin: log.adminEmail,
      Module: log.module,
      Action: log.action,
      Description: log.description,
    }));
    exportToExcel(data, "activity-logs.xlsx", "Activity Logs");
  };

  const handleExportCSV = () => {
    const data = logs.map((log) => ({
      Date: formatDate(log.date),
      Time: new Date(log.date).toLocaleTimeString(),
      Admin: log.adminEmail,
      Module: log.module,
      Action: log.action,
      Description: log.description,
    }));
    exportToCSV(data, "activity-logs.csv");
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
            <SelectItem value="Category">Category</SelectItem>
            <SelectItem value="Withdrawal">Withdrawal</SelectItem>
            <SelectItem value="Settings">Settings</SelectItem>
            <SelectItem value="Reports">Reports</SelectItem>
            <SelectItem value="Customers">Customers</SelectItem>
            <SelectItem value="Admins">Admins</SelectItem>
            <SelectItem value="Billing">Billing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Create">Create</SelectItem>
            <SelectItem value="Update">Update</SelectItem>
            <SelectItem value="Delete">Delete</SelectItem>
            <SelectItem value="Export">Export</SelectItem>
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
              <TableHead>Date & Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  {formatDate(log.date)}{" "}
                  {new Date(log.date).toLocaleTimeString()}
                </TableCell>
                <TableCell>{log.adminEmail}</TableCell>
                <TableCell>
                  <Badge>{log.module}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.action === "Create"
                        ? "default"
                        : log.action === "Update"
                          ? "secondary"
                          : log.action === "Delete"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
