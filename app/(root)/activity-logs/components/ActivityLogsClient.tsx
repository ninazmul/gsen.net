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
import { Download, Eye } from "lucide-react";
import { getActivityLogs } from "@/lib/actions/activity-log.actions";
import { exportToExcel, exportToCSV, getDateRange } from "@/lib/export-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Pagination from "@/components/shared/Pagination";

interface ActivityLog {
  _id: string;
  date: Date;
  adminEmail: string;
  module: string;
  action: string;
  description: string;
  recordId?: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  browser?: string;
  userAgent?: string;
  createdAt: Date;
}

const IGNORED_KEYS = [
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "clerkUserId",
  "deletedAt",
];

function formatKey(key: string): string {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1).replace(/_/g, " ");
}

function formatValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return "-";

  if (
    key === "date" ||
    key === "createdAt" ||
    key === "updatedAt" ||
    key === "deletedAt"
  ) {
    try {
      const d = new Date(value as string | number | Date);
      if (!isNaN(d.getTime())) {
        return `${formatDate(d)} ${d.toLocaleTimeString()}`;
      }
    } catch {
      // Ignored
    }
    return String(value);
  }

  if (key === "amount") {
    if (typeof value === "number") {
      return `৳${value.toFixed(2)}`;
    }
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "True" : "False"}
      </Badge>
    );
  }

  if (typeof value === "object") {
    if (key === "permissions") {
      return (
        <pre className="text-xs max-h-40 overflow-y-auto p-2 bg-muted rounded border border-border font-mono">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc pl-4 space-y-1 text-xs">
          {value.map((item, idx) => (
            <li key={idx}>
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <pre className="text-xs max-h-40 overflow-y-auto p-2 bg-muted rounded border border-border font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

function ActivityDetailsView({ log }: { log: ActivityLog }) {
  const isUpdate = log.action === "Update";
  const oldObj = (log.oldData as Record<string, unknown>) || {};
  const newObj = (log.newData as Record<string, unknown>) || {};

  const allKeys = Array.from(
    new Set([...Object.keys(oldObj), ...Object.keys(newObj)]),
  ).filter((key) => !IGNORED_KEYS.includes(key));

  if (isUpdate) {
    const changedKeys = allKeys.filter(
      (key) => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key]),
    );

    if (changedKeys.length === 0) {
      return (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No fields were modified or differences were inside excluded metadata.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-semibold">Changes Summary</h3>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="min-w-[180px]">Field</TableHead>
                <TableHead className="min-w-[250px] text-red-600">
                  Old Value
                </TableHead>
                <TableHead className="min-w-[250px] text-green-600">
                  New Value
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {changedKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-foreground/70 whitespace-nowrap">
                    {formatKey(key)}
                  </TableCell>

                  <TableCell className="bg-rose-50/10 text-muted-foreground break-words whitespace-pre-wrap dark:bg-rose-900/10 line-through decoration-red-400">
                    {formatValue(key, oldObj[key])}
                  </TableCell>

                  <TableCell className="bg-green-50/10 font-semibold break-words whitespace-pre-wrap dark:bg-green-900/10">
                    {formatValue(key, newObj[key])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const dataObject = log.action === "Delete" ? oldObj : newObj;

  const displayKeys = Object.keys(dataObject).filter(
    (key) => !IGNORED_KEYS.includes(key),
  );

  if (displayKeys.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No record details available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="border-b pb-2 text-lg font-semibold">
        Record Details ({log.action === "Delete" ? "Deleted Data" : "New Data"})
      </h3>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-[180px]">Field</TableHead>
              <TableHead className="min-w-[350px]">Value</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayKeys.map((key) => (
              <TableRow key={key}>
                <TableCell className="font-medium text-foreground/70 whitespace-nowrap">
                  {formatKey(key)}
                </TableCell>

                <TableCell className="break-words whitespace-pre-wrap">
                  {formatValue(key, dataObject[key])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ActivityLogsClient({
  initialLogs,
  initialTotalPages,
}: {
  initialLogs: ActivityLog[];
  initialTotalPages: number;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
      page?: number;
    } = { search, limit: 10, page: currentPage };
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
    const { logs: newLogs, totalPages: newTotalPages } =
      await getActivityLogs(params);
    setLogs(newLogs);
    setTotalPages(newTotalPages);
  }, [
    search,
    moduleFilter,
    actionFilter,
    period,
    startDate,
    endDate,
    currentPage,
  ]);

  // Reset to page 1 when any filters change
  useEffect(() => {
    setCurrentPage(1);
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
      <div className="flex flex-wrap justify-between items-center gap-4">
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
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-purple-[#0F0A19]">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-xl font-bold sm:text-2xl">
              Activity Log Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 overflow-y-auto p-6">
              {/* Metadata */}
              <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2">
                <div>
                  <span className="block text-sm text-muted-foreground">
                    Date & Time
                  </span>
                  <p className="mt-1 break-words font-medium">
                    {formatDate(selectedLog.date)}{" "}
                    {new Date(selectedLog.date).toLocaleTimeString()}
                  </p>
                </div>

                <div>
                  <span className="block text-sm text-muted-foreground">
                    Admin
                  </span>
                  <p className="mt-1 break-all font-medium">
                    {selectedLog.adminEmail}
                  </p>
                </div>

                <div>
                  <span className="block text-sm text-muted-foreground">
                    Module
                  </span>
                  <Badge variant="outline" className="mt-2 w-fit font-semibold">
                    {selectedLog.module}
                  </Badge>
                </div>

                <div>
                  <span className="block text-sm text-muted-foreground">
                    Action
                  </span>

                  <Badge
                    className="mt-2 w-fit"
                    variant={
                      selectedLog.action === "Create"
                        ? "default"
                        : selectedLog.action === "Update"
                          ? "secondary"
                          : selectedLog.action === "Delete"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {selectedLog.action}
                  </Badge>
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-sm text-muted-foreground">
                    Description
                  </span>

                  <p className="mt-1 break-words font-medium">
                    {selectedLog.description}
                  </p>
                </div>

                {(selectedLog.ipAddress || selectedLog.browser) && (
                  <div className="grid grid-cols-1 gap-4 border-t pt-4 text-sm sm:col-span-2 sm:grid-cols-2">
                    {selectedLog.ipAddress && (
                      <div>
                        <span className="block text-muted-foreground">
                          IP Address
                        </span>

                        <p className="mt-1 break-all font-mono">
                          {selectedLog.ipAddress}
                        </p>
                      </div>
                    )}

                    {selectedLog.browser && (
                      <div>
                        <span className="block text-muted-foreground">
                          Browser / OS
                        </span>

                        <p className="mt-1 break-words">
                          {selectedLog.browser}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Details */}
              <div className="w-full">
                <ActivityDetailsView log={selectedLog} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
