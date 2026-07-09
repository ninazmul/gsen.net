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

interface ActivityLog {
  _id: string;
  date: Date;
  adminEmail: string;
  module: string;
  action: string;
  description: string;
  recordId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  browser?: string;
  userAgent?: string;
  createdAt: Date;
}

const IGNORED_KEYS = ["_id", "__v", "createdAt", "updatedAt", "clerkUserId", "deletedAt"];

function formatKey(key: string): string {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1).replace(/_/g, " ");
}

function formatValue(key: string, value: any): React.ReactNode {
  if (value === null || value === undefined) return "-";

  if (key === "date" || key === "createdAt" || key === "updatedAt" || key === "deletedAt") {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return `${formatDate(d)} ${d.toLocaleTimeString()}`;
      }
    } catch (_) {}
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
        <pre className="text-xs max-h-40 overflow-y-auto p-2 bg-gray-50 rounded border font-mono">
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
      <pre className="text-xs max-h-40 overflow-y-auto p-2 bg-gray-50 rounded border font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

function ActivityDetailsView({ log }: { log: ActivityLog }) {
  const isUpdate = log.action === "Update";
  const oldObj = log.oldData || {};
  const newObj = log.newData || {};

  const allKeys = Array.from(
    new Set([
      ...Object.keys(oldObj),
      ...Object.keys(newObj),
    ])
  ).filter((key) => !IGNORED_KEYS.includes(key));

  if (isUpdate) {
    const changedKeys = allKeys.filter(
      (key) => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])
    );

    if (changedKeys.length === 0) {
      return (
        <div className="text-sm text-gray-500 py-4 text-center">
          No fields were modified or differences were inside excluded metadata.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Changes Summary</h3>
        <div className="border rounded-md overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-1/3">Field</TableHead>
                <TableHead className="w-1/3 text-red-600">Old Value</TableHead>
                <TableHead className="w-1/3 text-green-600">New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changedKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-gray-700">{formatKey(key)}</TableCell>
                  <TableCell className="bg-red-50/20 text-gray-500 line-through decoration-red-200">
                    {formatValue(key, oldObj[key])}
                  </TableCell>
                  <TableCell className="bg-green-50/20 text-gray-900 font-semibold">
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
    (key) => !IGNORED_KEYS.includes(key)
  );

  if (displayKeys.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        No record details available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2">
        Record Details ({log.action === "Delete" ? "Deleted Data" : "New Data"})
      </h3>
      <div className="border rounded-md overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-1/3">Field</TableHead>
              <TableHead className="w-2/3">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayKeys.map((key) => (
              <TableRow key={key}>
                <TableCell className="font-medium text-gray-700">{formatKey(key)}</TableCell>
                <TableCell className="text-gray-900">
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
}: {
  initialLogs: ActivityLog[];
}) {
  const [logs, setLogs] = useState(initialLogs);
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
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Activity Log Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 mt-4">
              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border text-sm">
                <div>
                  <span className="text-gray-500 block">Date & Time</span>
                  <span className="font-medium">
                    {formatDate(selectedLog.date)}{" "}
                    {new Date(selectedLog.date).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Admin</span>
                  <span className="font-medium">{selectedLog.adminEmail}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Module</span>
                  <div>
                    <Badge variant="outline" className="font-semibold mt-1">
                      {selectedLog.module}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block">Action</span>
                  <div>
                    <Badge
                      variant={
                        selectedLog.action === "Create"
                          ? "default"
                          : selectedLog.action === "Update"
                            ? "secondary"
                            : selectedLog.action === "Delete"
                              ? "destructive"
                              : "outline"
                      }
                      className="mt-1"
                    >
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block">Description</span>
                  <span className="font-medium text-gray-805">
                    {selectedLog.description}
                  </span>
                </div>
                {(selectedLog.ipAddress || selectedLog.browser) && (
                  <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-2 mt-2 text-xs text-gray-500">
                    {selectedLog.ipAddress && (
                      <div>
                        <span>IP Address: </span>
                        <span className="font-mono">{selectedLog.ipAddress}</span>
                      </div>
                    )}
                    {selectedLog.browser && (
                      <div>
                        <span>Browser/OS: </span>
                        <span>{selectedLog.browser}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Details View */}
              <ActivityDetailsView log={selectedLog} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
