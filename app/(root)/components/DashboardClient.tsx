"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Wallet,
  User,
  Plus,
  ReceiptText,
  History,
  CalendarDays,
  ArrowRightLeft,
  CheckCircle2,

  Scale,
  ArrowRight,
  Info,
  ShoppingBag,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getExpenses } from "@/lib/actions/expense.actions";
import { getIncomes } from "@/lib/actions/income.actions";
import { getSettings } from "@/lib/actions/settings.actions";
import { getExpenseBreakdownByMonth } from "@/lib/actions/dashboard.actions";
import IncomeForm from "../income/components/IncomeForm";
import ExpenseForm from "../expenses/components/ExpenseForm";
import { type Admin } from "@/lib/actions/admin.actions";

interface Category {
  _id: string;
  name: string;
  type: string;
  color: string;
}

interface Income {
  _id: string;
  category: Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
  createdAt?: Date;
}

interface Expense {
  _id: string;
  category: Category;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  owner?: string;
  createdAt?: Date;
}

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
  updatedAt: Date;
}

interface MonthlyOwnerBalance {
  month: number;
  income: number;
  expenses: number;
  withdrawn: number;
  balance: number;
}

interface OwnerBalance {
  name: string;
  totalIncome: number;
  totalExpenses: number;
  withdrawn: number;
  balance: number;
  todayIncome: number;
  todayExpenses: number;
  todayWithdrawn: number;
  todayBalance: number;
  monthlyBalances?: MonthlyOwnerBalance[];
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
      currentMonthIncome: number;
      currentMonthExpenses: number;
      currentMonthIncomeCount: number;
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
  currentAdmin: Admin | null;
};

type EntryMode = "sale" | "expense";
type HistoryPeriod = "today" | "week" | "month" | "custom";
type HistoryType = "all" | "sale" | "expense";

interface PartnerHistoryItem {
  id: string;
  type: "sale" | "expense";
  category: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
}

interface OwnerSetting {
  name: string;
  email: string;
}

export default function DashboardClient({
  data,
  currentAdmin,
}: DashboardClientProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedDailyMonth, setSelectedDailyMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>("sale");
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPartner, setHistoryPartner] = useState("");
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>("today");
  const [historyType, setHistoryType] = useState<HistoryType>("all");
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [historyItems, setHistoryItems] = useState<PartnerHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [ownerEmailLookup, setOwnerEmailLookup] = useState<
    Record<string, string>
  >({});
  const [selectedBreakdownMonth, setSelectedBreakdownMonth] = useState<string>(
    (new Date().getMonth() + 1).toString(),
  );
  const [expenseBreakdown, setExpenseBreakdown] = useState<BreakdownItem[]>([]);
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(true);
  const [selectedSettlementMonth, setSelectedSettlementMonth] = useState<string>(
    (new Date().getMonth() + 1).toString(),
  );

  useEffect(() => {
    let isMounted = true;
    async function loadBreakdown() {
      setIsBreakdownLoading(true);
      try {
        if (selectedBreakdownMonth === "all") {
          if (isMounted) {
            setExpenseBreakdown(data.expenseBreakdown);
          }
        } else {
          const month = parseInt(selectedBreakdownMonth);
          const breakdown = await getExpenseBreakdownByMonth(month);
          if (isMounted) {
            setExpenseBreakdown(breakdown);
          }
        }
      } catch (error) {
        console.error("Error loading breakdown:", error);
        toast.error("Failed to load expense breakdown");
      } finally {
        if (isMounted) {
          setIsBreakdownLoading(false);
        }
      }
    }
    loadBreakdown();
    return () => {
      isMounted = false;
    };
  }, [selectedBreakdownMonth, data.expenseBreakdown]);

  useEffect(() => {
    let isMounted = true;

    async function loadOwnerEmails() {
      try {
        const settings = await getSettings();
        if (!isMounted) return;

        const owners = (settings?.owners || []) as OwnerSetting[];
        const lookup = owners.reduce((acc: Record<string, string>, owner) => {
          if (owner?.name) {
            acc[owner.name] = owner.email || "";
          }
          return acc;
        }, {});

        setOwnerEmailLookup(lookup);
      } catch (error) {
        console.error("Error loading owner emails:", error);
      }
    }

    loadOwnerEmails();

    return () => {
      isMounted = false;
    };
  }, []);

  const COLOR_PALETTE = [
    "#7c3aed",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  const tooltipBg = isDark ? "#1e1b2e" : "#ffffff";
  const tooltipBorder = isDark ? "#2e2b3e" : "#e2e8f0";

  const formatCurrency = (amount: number) => (
    <>
      {amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
      <span className="text-xs text-muted-foreground">SAR</span>
    </>
  );

  const selectedPerformanceMonth =
    data.monthlyPerformance.find((m) => m.month === selectedDailyMonth)
      ?.monthName || "Selected Month";

  // const combinedPartnerSummary = useMemo(() => {
  //   return data.summary.ownerBalances.reduce(
  //     (summary, owner) => {
  //       const monthly = owner.monthlyBalances?.find(
  //         (m) => m.month === selectedDailyMonth,
  //       );

  //       summary.todaySales += owner.todayIncome;
  //       summary.todayExpenses += owner.todayExpenses;
  //       summary.monthSales += monthly?.income || 0;
  //       summary.monthExpenses += monthly?.expenses || 0;

  //       return summary;
  //     },
  //     {
  //       todaySales: 0,
  //       todayExpenses: 0,
  //       monthSales: 0,
  //       monthExpenses: 0,
  //     },
  //   );
  // }, [data.summary.ownerBalances, selectedDailyMonth]);

  const openEntryModal = (mode: EntryMode, partner: string) => {
    setEntryMode(mode);
    setSelectedPartner(partner);
    setEntryOpen(true);
  };

  const openHistorySheet = (partner: string) => {
    setHistoryPartner(partner);
    setHistoryPeriod("today");
    setHistoryType("all");
    setCustomStartDate(new Date().toISOString().split("T")[0]);
    setCustomEndDate(new Date().toISOString().split("T")[0]);
    setHistoryOpen(true);
  };

  const getHistoryRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (historyPeriod === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (historyPeriod === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (historyPeriod === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else {
      const customStart = new Date(customStartDate);
      const customEnd = new Date(customEndDate);
      customStart.setHours(0, 0, 0, 0);
      customEnd.setHours(23, 59, 59, 999);
      return { startDate: customStart, endDate: customEnd };
    }

    return { startDate: start, endDate: end };
  }, [customEndDate, customStartDate, historyPeriod]);

  useEffect(() => {
    if (!historyOpen || !historyPartner) return;

    async function loadHistory() {
      setIsHistoryLoading(true);
      try {
        const { startDate, endDate } = getHistoryRange();
        const requests = [];

        if (historyType === "all" || historyType === "sale") {
          requests.push(
            getIncomes({
              owner: historyPartner,
              startDate,
              endDate,
              page: 1,
              limit: 200,
            }),
          );
        }

        if (historyType === "all" || historyType === "expense") {
          requests.push(
            getExpenses({
              owner: historyPartner,
              startDate,
              endDate,
              page: 1,
              limit: 200,
            }),
          );
        }

        const results = await Promise.all(requests);
        const nextItems: PartnerHistoryItem[] = [];

        results.forEach((result) => {
          if ("incomes" in result) {
            result.incomes.forEach((income: Income) => {
              nextItems.push({
                id: income._id,
                type: "sale",
                category:
                  typeof income.category === "object"
                    ? income.category.name
                    : "Sales",
                amount: income.amount,
                date: new Date(income.date),
                paymentMethod: income.paymentMethod,
                referenceNumber: income.referenceNumber,
                description: income.description,
              });
            });
          }

          if ("expenses" in result) {
            result.expenses.forEach((expense: Expense) => {
              nextItems.push({
                id: expense._id,
                type: "expense",
                category:
                  typeof expense.category === "object"
                    ? expense.category.name
                    : "Expense",
                amount: expense.amount,
                date: new Date(expense.date),
                paymentMethod: expense.paymentMethod,
                referenceNumber: expense.referenceNumber,
                description: expense.description,
              });
            });
          }
        });

        setHistoryItems(
          nextItems.sort((a, b) => b.date.getTime() - a.date.getTime()),
        );
      } catch (error) {
        console.error("Error loading partner history:", error);
        toast.error("Failed to load partner history");
      } finally {
        setIsHistoryLoading(false);
      }
    }

    loadHistory();
  }, [
    historyOpen,
    historyPartner,
    historyPeriod,
    historyType,
    customStartDate,
    customEndDate,
    getHistoryRange,
  ]);

  const handleEntrySuccess = () => {
    toast.success(
      entryMode === "sale"
        ? "Sale added successfully"
        : "Expense added successfully",
    );
    setEntryOpen(false);
    router.refresh();
  };

  return (
    <div className="py-4 px-3 sm:px-4 lg:px-5 max-w-8xl mx-auto flex flex-col gap-4 bg-background min-h-screen">
      {/* Monthly Business Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/40 pb-2">
        <h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-300 tracking-tight flex items-center gap-2.5">
          <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
          1. Monthly Business Summary
        </h2>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Select Month:
          </span>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-[180px] bg-card border-border text-card-foreground shadow-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {data.monthlyPerformance.map((item) => (
                <SelectItem key={item.month} value={item.month.toString()}>
                  {item.monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {(() => {
        const monthData = data.monthlyPerformance.find(
          (m) => m.month === selectedMonth,
        );
        const monthlyIncome = monthData
          ? monthData.income
          : data.summary.currentMonthIncome || 0;
        const monthlyExpenses = monthData
          ? monthData.expenses
          : data.summary.currentMonthExpenses || 0;
        const monthlyNetProfit = monthlyIncome - monthlyExpenses;

        return (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Monthly Income */}
            <div className="group relative overflow-hidden rounded-xl border border-green-200/60 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="absolute left-0 top-0 h-full w-1 bg-green-500" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition-all duration-300 group-hover:bg-green-500 group-hover:text-white dark:bg-green-900/40">
                  <TrendingUp className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Monthly Income
                  </p>

                  <h2 className="mt-0.5 md:text-xl lg:text-2xl font-black tracking-tight">
                    {monthlyIncome.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs lg:text-lg text-muted-foreground">
                      SAR
                    </span>
                  </h2>
                </div>
              </div>
            </div>

            {/* Monthly Expenses */}
            <div className="group relative overflow-hidden rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-all duration-300 group-hover:bg-rose-500 group-hover:text-white dark:bg-rose-900/40">
                  <TrendingDown className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Monthly Expenses
                  </p>

                  <h2 className="mt-0.5 md:text-xl lg:text-2xl font-black tracking-tight">
                    {monthlyExpenses.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs lg:text-lg text-muted-foreground">
                      SAR
                    </span>
                  </h2>
                </div>
              </div>
            </div>

            {/* Monthly Net Profit */}
            <div className="group relative overflow-hidden rounded-xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="absolute left-0 top-0 h-full w-1 bg-purple-500" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all duration-300 group-hover:bg-purple-500 group-hover:text-white dark:bg-[#0F0A19]/40">
                  <DollarSign className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Monthly Net Profit
                  </p>

                  <h2
                    className={`mt-0.5 md:text-xl lg:text-2xl font-black tracking-tight ${
                      monthlyNetProfit >= 0
                        ? "text-card-foreground"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {monthlyNetProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs lg:text-lg text-muted-foreground">
                      SAR
                    </span>
                  </h2>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Daily & Monthly Partner Performance */}
      <div className="space-y-3 rounded-2xl border border-[#8B5CF6]/20 p-4 shadow-xl shadow-[#8B5CF6]/10 dark:from-[#8B5CF6]/15 dark:via-card dark:to-background sm:p-4">
        <div className="flex flex-col gap-2.5 border-b border-[#8B5CF6]/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-purple-950 dark:text-purple-300 md:text-2xl">
              <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
              2. Daily & Monthly Partner Performance
            </h2>
            <p className="hidden lg:block mt-0.5 text-sm font-medium text-muted-foreground">
              Combined and partner-level sales, expenses, and net performance.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Month
            </span>
            <Select
              value={selectedDailyMonth.toString()}
              onValueChange={(val) => setSelectedDailyMonth(parseInt(val))}
            >
              <SelectTrigger className="w-full border-[#8B5CF6]/30 bg-card text-card-foreground shadow-sm sm:w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {data.monthlyPerformance.map((item) => (
                  <SelectItem key={item.month} value={item.month.toString()}>
                    {item.monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.summary.ownerBalances.map((owner, index) => {
            const monthly = owner.monthlyBalances?.find(
              (m) => m.month === selectedDailyMonth,
            );
            const monthSales = monthly?.income || 0;
            const monthExpenses = monthly?.expenses || 0;
            const monthNet = monthSales - monthExpenses;
            const todayNet = owner.todayIncome - owner.todayExpenses;
            const ownerEmail = ownerEmailLookup[owner.name] || "";
            const canManageOwner = Boolean(
              currentAdmin?.email &&
              ownerEmail &&
              currentAdmin.email.trim().toLowerCase() ===
                ownerEmail.trim().toLowerCase(),
            );

            return (
              <Card
                key={`${owner.name}-${index}`}
                className="overflow-hidden border border-[#8B5CF6]/35 bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#8B5CF6]/40 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between gap-2.5 border-b border-border/70 bg-gradient-to-r from-[#8B5CF6]/35 to-transparent px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-white shadow-md">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black uppercase tracking-wide text-card-foreground">
                        {owner.name}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Partner performance
                      </p>
                    </div>
                  </div>
                  <Badge className="border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/10">
                    {selectedPerformanceMonth}
                  </Badge>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Today
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-xl border border-green-200/60 bg-green-50/70 p-2.5 dark:border-green-900/30 dark:bg-green-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Sales
                        </p>
                        <p className="mt-0.5 text-base font-black text-green-600 dark:text-green-400">
                          {formatCurrency(owner.todayIncome)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-rose-200/60 bg-rose-50/70 p-2.5 dark:border-rose-900/30 dark:bg-rose-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Expenses
                        </p>
                        <p className="mt-0.5 text-base font-black text-rose-600 dark:text-rose-400">
                          {formatCurrency(owner.todayExpenses)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-purple-200/60 bg-purple-50/70 p-2.5 dark:border-purple-900/30 dark:bg-purple-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Net
                        </p>
                        <p
                          className={`mt-0.5 text-base font-black ${
                            todayNet >= 0
                              ? "text-[#8B5CF6]"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {formatCurrency(todayNet)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                      This Month
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-xl border border-green-200/60 bg-green-50/70 p-2.5 dark:border-green-900/30 dark:bg-green-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Sales
                        </p>
                        <p className="mt-0.5 text-base font-black text-green-600 dark:text-green-400">
                          {formatCurrency(monthSales)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-rose-200/60 bg-rose-50/70 p-2.5 dark:border-rose-900/30 dark:bg-rose-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Expenses
                        </p>
                        <p className="mt-0.5 text-base font-black text-rose-600 dark:text-rose-400">
                          {formatCurrency(monthExpenses)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-purple-200/60 bg-purple-50/70 p-2.5 dark:border-purple-900/30 dark:bg-purple-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Net
                        </p>
                        <p
                          className={`mt-0.5 text-base font-black ${
                            monthNet >= 0
                              ? "text-[#8B5CF6]"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {formatCurrency(monthNet)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 border-t border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
                  <Button
                    type="button"
                    onClick={() => openEntryModal("sale", owner.name)}
                    disabled={!canManageOwner}
                    className="h-10 rounded-xl bg-[#22C55E] font-bold text-white shadow-lg shadow-green-500/20 hover:bg-[#16A34A] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    <Plus className="h-4 w-4" />
                    Add Sale
                  </Button>
                  <Button
                    type="button"
                    onClick={() => openEntryModal("expense", owner.name)}
                    disabled={!canManageOwner}
                    className="h-10 rounded-xl bg-[#F43F5E] font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-[#E11D48] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    <ReceiptText className="h-4 w-4" />
                    Add Expense
                  </Button>
                  <Button
                    type="button"
                    onClick={() => openHistorySheet(owner.name)}
                    className="h-10 rounded-xl bg-[#3B82F6] font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-[#2563EB] hover:shadow-xl"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* <Card className="overflow-hidden border-[#8B5CF6]/25 bg-card/95 shadow-lg">
          <div className="border-b border-border/60 bg-[#8B5CF6]/10 px-4 py-3 dark:bg-[#8B5CF6]/15">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6] text-white shadow-md">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Combined Business Summary
                </p>
                <h3 className="text-lg font-black text-card-foreground">
                  Today and {selectedPerformanceMonth}
                </h3>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 p-4 lg:grid-cols-2">
            {[
              {
                label: "Today",
                sales: combinedPartnerSummary.todaySales,
                expenses: combinedPartnerSummary.todayExpenses,
              },
              {
                label: selectedPerformanceMonth,
                sales: combinedPartnerSummary.monthSales,
                expenses: combinedPartnerSummary.monthExpenses,
              },
            ].map((summary) => {
              const net = summary.sales - summary.expenses;

              return (
                <div
                  key={summary.label}
                  className="rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm dark:bg-background/30"
                >
                  <p className="mb-4 text-sm font-black uppercase tracking-wider text-[#8B5CF6]">
                    {summary.label}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div className="rounded-xl border border-green-200/70 bg-green-50/70 p-2.5 dark:border-green-900/30 dark:bg-green-950/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Sales
                      </p>
                      <p className="mt-0.5 text-xl font-black text-green-600 dark:text-green-400">
                        {formatCurrency(summary.sales)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose-200/70 bg-rose-50/70 p-2.5 dark:border-rose-900/30 dark:bg-rose-950/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Expenses
                      </p>
                      <p className="mt-0.5 text-xl font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(summary.expenses)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-purple-200/70 bg-purple-50/70 p-2.5 dark:border-purple-900/30 dark:bg-purple-950/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Net
                      </p>
                      <p
                        className={`mt-0.5 text-xl font-black ${
                          net >= 0
                            ? "text-[#8B5CF6]"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatCurrency(net)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card> */}
      </div>

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#8B5CF6]/25 bg-white shadow-2xl shadow-[#8B5CF6]/20 dark:bg-[#0F0A19] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {entryMode === "sale" ? "Add Sale" : "Add Expense"}
            </DialogTitle>
            <DialogDescription>
              Partner auto-selected: {selectedPartner || "No partner selected"}
            </DialogDescription>
          </DialogHeader>
          {entryMode === "sale" ? (
            <IncomeForm
              currentAdmin={currentAdmin}
              defaultOwner={selectedPartner}
              onSuccess={() => {
                handleEntrySuccess();
              }}
            />
          ) : (
            <ExpenseForm
              currentAdmin={currentAdmin}
              defaultOwner={selectedPartner}
              onSuccess={() => {
                handleEntrySuccess();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full overflow-y-auto border-[#8B5CF6]/25 bg-white shadow-2xl shadow-blue-500/20 dark:bg-[#0F0A19] sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2.5 text-2xl font-black">
              <CalendarDays className="h-5 w-5 text-[#3B82F6]" />
              Partner History
            </SheetTitle>
            <SheetDescription>
              Showing history for {historyPartner || "selected partner"}.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={historyPeriod}
                  onValueChange={(value) =>
                    setHistoryPeriod(value as HistoryPeriod)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={historyType}
                  onValueChange={(value) =>
                    setHistoryType(value as HistoryType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="sale">Sales</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historyPeriod === "custom" && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="history-start-date">Start Date</Label>
                  <Input
                    id="history-start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history-end-date">End Date</Label>
                  <Input
                    id="history-end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {isHistoryLoading && (
                <div className="rounded-xl border border-border/70 p-4 text-center text-sm text-muted-foreground">
                  Loading history...
                </div>
              )}

              {!isHistoryLoading &&
                historyItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <Badge
                          className={`mb-2 ${
                            item.type === "sale"
                              ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
                          }`}
                        >
                          {item.type === "sale" ? "Sale" : "Expense"}
                        </Badge>
                        <p className="font-bold text-card-foreground">
                          {item.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.date.toLocaleDateString()} ·{" "}
                          {item.paymentMethod}
                          {item.referenceNumber
                            ? ` · Ref: ${item.referenceNumber}`
                            : ""}
                        </p>
                        {item.description && (
                          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <p
                        className={`shrink-0 text-base font-black ${
                          item.type === "sale"
                            ? "text-green-600 dark:text-green-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}

              {!isHistoryLoading && historyItems.length === 0 && (
                <div className="rounded-xl border border-border/70 p-5 text-center text-sm text-muted-foreground">
                  No partner history found for this filter.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Partner Settlement Overview */}
      <div className="space-y-3">
        <div className="border-b border-border/40 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-300 tracking-tight flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
            3. Owner Settlement Overview
          </h2>
          <p className="hidden lg:block text-sm text-muted-foreground mt-0.5 pl-4">
            Profit share and withdrawal status at a glance.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(() => {
            const totalBalance = data.summary.ownerBalances.reduce(
              (s, o) => s + o.balance,
              0,
            );
            const totalNetProfit = data.summary.netProfit;
            const numOwners = data.summary.ownerBalances.length || 1;
            const equalShare = totalNetProfit / numOwners;

            return data.summary.ownerBalances.map((owner, index) => {
              const alreadyTaken = owner.withdrawn;
              const profitShare = equalShare;
              // Remaining the owner can still take from their share
              const remainingDue = Math.max(0, profitShare - alreadyTaken);
              // How much they've gone over their share
              const overdrawAmount = Math.max(0, alreadyTaken - profitShare);
              const isOverdrawn = alreadyTaken > profitShare;
              const totalBizBalance = totalBalance;

              const sharePercent =
                numOwners > 0 ? Math.round(100 / numOwners) : 0;

              return (
                <Card
                  key={index}
                  className={`overflow-hidden border shadow-md bg-gradient-to-br from-card to-card/95 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${
                    isOverdrawn
                      ? "border-rose-300/60 dark:border-rose-900/40"
                      : "border-border/80"
                  }`}
                >
                  {/* Owner Header */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      isOverdrawn
                        ? "bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 border-rose-200/60 dark:border-rose-900/30"
                        : "bg-gradient-to-r from-purple-50 to-violet-100/50 dark:from-purple-950/20 dark:to-violet-900/10 border-purple-200/60 dark:border-purple-900/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3e0078] to-[#6d28d9] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                        <User />
                      </div>
                      <span className="font-bold text-base uppercase tracking-wide text-card-foreground">
                        {owner.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase ${
                        isOverdrawn
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                          : "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                      }`}
                    >
                      {isOverdrawn ? "Overdrawn" : "Available"}
                    </span>
                  </div>

                  {/* Settlement Stats */}
                  <div className="p-4 space-y-3">
                    {/* Profit Share */}
                    <div className="relative overflow-hidden rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-900/20 p-2.5 flex items-center justify-between">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-r-full" />
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                        Profit Share ({sharePercent}%)
                      </span>
                      <span className="text-base font-bold text-card-foreground tabular-nums">
                        {profitShare.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}{" "}
                        <span className="text-xs text-muted-foreground">
                          SAR
                        </span>
                      </span>
                    </div>

                    {/* Already Taken */}
                    <div className="relative overflow-hidden rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/20 p-2.5 flex items-center justify-between">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 dark:bg-amber-400 rounded-r-full" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Withdrawn
                      </span>
                      <span className="text-base font-bold text-card-foreground tabular-nums">
                        {alreadyTaken.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}{" "}
                        <span className="text-xs text-muted-foreground">
                          SAR
                        </span>
                      </span>
                    </div>

                    {/* Remaining Due */}
                    <div className="relative overflow-hidden rounded-xl bg-green-50/50 dark:bg-green-950/10 border border-green-200/50 dark:border-green-900/20 p-2.5 flex items-center justify-between">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-green-400 rounded-r-full" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                        Available
                      </span>
                      <span
                        className={`text-base font-bold tabular-nums ${
                          remainingDue > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {remainingDue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs text-muted-foreground">
                          SAR
                        </span>
                      </span>
                    </div>

                    {/* Overdrawn / Due to Company */}
                    <div className="relative overflow-hidden rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/20 p-2.5 flex items-center justify-between">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose-500 dark:bg-rose-400 rounded-r-full" />
                      <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                        Overdrawn
                      </span>
                      <span
                        className={`text-base font-bold tabular-nums ${
                          overdrawAmount > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {overdrawAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs text-muted-foreground">
                          SAR
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="px-5 pb-5">
                    <div
                      className={`flex items-start gap-2.5 rounded-xl p-2.5 ${
                        isOverdrawn
                          ? "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900"
                          : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                          isOverdrawn
                            ? "border-rose-500 text-rose-500"
                            : "border-green-500 text-green-500"
                        }`}
                      >
                        {isOverdrawn ? (
                          <span className="text-xs font-black leading-none">
                            !
                          </span>
                        ) : (
                          <svg
                            viewBox="0 0 12 12"
                            className="w-3 h-3 fill-current"
                          >
                            <path
                              d="M10 3L5 8.5 2 5.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            isOverdrawn
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-green-700 dark:text-green-400"
                          }`}
                        >
                          {isOverdrawn
                            ? "You are overdrawn."
                            : `You can withdraw up to ${remainingDue.toLocaleString(undefined, { minimumFractionDigits: 0 })} SAR.`}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isOverdrawn
                              ? "text-rose-500 dark:text-rose-500"
                              : "text-green-600 dark:text-green-500"
                          }`}
                        >
                          {isOverdrawn
                            ? "Company will recover this amount from future profits."
                            : "based on your profit share."}
                        </p>
                      </div>
                    </div>

                    {/* Total available business balance note */}
                    {!isOverdrawn && totalBizBalance > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground text-right">
                        Total balance:{" "}
                        {totalBizBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}{" "}
                        <span className="text-xs text-muted-foreground">
                          SAR
                        </span>
                      </p>
                    )}
                  </div>
                </Card>
              );
            });
          })()}
        </div>
      </div>

      {/* Cash Settlement Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/40 pb-2">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-300 tracking-tight flex items-center gap-2.5">
              <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
              4. Cash Settlement
            </h2>
            <p className="hidden lg:block text-sm text-muted-foreground mt-0.5 pl-4">
              Adjusts profit sharing based on what each owner already earned and holds.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Month:
            </span>
            <Select
              value={selectedSettlementMonth}
              onValueChange={setSelectedSettlementMonth}
            >
              <SelectTrigger className="w-[180px] bg-card border-border text-card-foreground shadow-sm">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {data.monthlyPerformance.map((item) => (
                  <SelectItem key={item.month} value={item.month.toString()}>
                    {item.monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(() => {
          const numOwners = data.summary.ownerBalances.length || 1;
          const isAllTime = selectedSettlementMonth === "all";
          const selectedMonthNum = isAllTime ? 0 : parseInt(selectedSettlementMonth);

          // Calculate totals based on selected filter
          let totalSales: number;
          let totalExpenses: number;
          let totalNetProfit: number;
          if (isAllTime) {
            totalSales = data.summary.totalIncome;
            totalExpenses = data.summary.totalExpenses;
            totalNetProfit = data.summary.netProfit;
          } else {
            totalSales = data.summary.ownerBalances.reduce((sum, owner) => {
              const monthly = owner.monthlyBalances?.find((m) => m.month === selectedMonthNum);
              return sum + (monthly?.income || 0);
            }, 0);
            totalExpenses = data.summary.ownerBalances.reduce((sum, owner) => {
              const monthly = owner.monthlyBalances?.find((m) => m.month === selectedMonthNum);
              return sum + (monthly?.expenses || 0);
            }, 0);
            totalNetProfit = totalSales - totalExpenses;
          }
          const fairShare = totalNetProfit / numOwners;
          const sharePercent = Math.round(100 / numOwners);

          // Each owner's sales, expenses, earned profit, withdrawals, and in-hand cash
          // Each owner's sell amount is collected directly and already with them
          const ownerData = data.summary.ownerBalances.map((owner) => {
            let sales: number;
            let expenses: number;
            let ownProfit: number;
            let withdrawn: number;
            if (isAllTime) {
              sales = owner.totalIncome;
              expenses = owner.totalExpenses;
              ownProfit = sales - expenses;
              withdrawn = owner.withdrawn;
            } else {
              const monthly = owner.monthlyBalances?.find((m) => m.month === selectedMonthNum);
              sales = monthly?.income || 0;
              expenses = monthly?.expenses || 0;
              ownProfit = sales - expenses;
              withdrawn = monthly?.withdrawn || 0;
            }
            // Total In Hand = sales collected (already with owner) minus expenses paid plus company withdrawals
            const totalInHand = ownProfit + withdrawn;
            const netSettlement = totalInHand - fairShare;
            const salesSharePercent = totalSales > 0 ? (sales / totalSales) * 100 : 0;

            return {
              name: owner.name,
              sales,
              expenses,
              ownProfit,
              withdrawn,
              totalInHand,
              fairShare,
              netSettlement,
              salesSharePercent,
            };
          });

          // Determine settlement transfers
          const payers = ownerData.filter((o) => o.netSettlement > 0.01);
          const receivers = ownerData.filter((o) => o.netSettlement < -0.01);

          // Build settlement transfers
          const transfers: { from: string; to: string; amount: number }[] = [];
          if (payers.length > 0 && receivers.length > 0) {
            let payerIdx = 0;
            let receiverIdx = 0;
            const payerRemaining = payers.map((p) => p.netSettlement);
            const receiverRemaining = receivers.map((r) => Math.abs(r.netSettlement));

            while (payerIdx < payers.length && receiverIdx < receivers.length) {
              const transferAmount = Math.min(
                payerRemaining[payerIdx],
                receiverRemaining[receiverIdx],
              );
              if (transferAmount > 0.01) {
                transfers.push({
                  from: payers[payerIdx].name,
                  to: receivers[receiverIdx].name,
                  amount: transferAmount,
                });
              }
              payerRemaining[payerIdx] -= transferAmount;
              receiverRemaining[receiverIdx] -= transferAmount;
              if (payerRemaining[payerIdx] < 0.01) payerIdx++;
              if (receiverRemaining[receiverIdx] < 0.01) receiverIdx++;
            }
          }

          const isSettled = transfers.length === 0;

          return (
            <Card className="overflow-hidden border border-border/80 shadow-md bg-gradient-to-br from-card to-card/95 hover:shadow-2xl transition-all duration-300">
              {/* Summary Header */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/10 border-b border-teal-200/60 dark:border-teal-900/30 px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                        Settlement Summary
                        <span className="text-xs font-bold text-teal-500 dark:text-teal-500 ml-1.5">
                          ({isAllTime
                            ? "All Time"
                            : data.monthlyPerformance.find((m) => m.month === selectedMonthNum)?.monthName || "Selected"
                          })
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>
                          Total Sold:{" "}
                          <strong className="text-card-foreground">
                            {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Net Profit:{" "}
                          <strong className="text-card-foreground">
                            {totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Fair Share ({sharePercent}%):{" "}
                          <strong className="text-card-foreground">
                            {fairShare.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                          </strong>
                        </span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs font-bold uppercase tracking-widest px-3 py-1 self-start sm:self-center ${
                      isSettled
                        ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                    }`}
                  >
                    {isSettled ? "Settled" : "Needs Settlement"}
                  </Badge>
                </div>
              </div>

              {/* Owner Breakdown */}
              <div className="p-4 space-y-4">
                {/* Partner Sales Comparison Banner */}
                <div className="rounded-xl border border-border/70 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-cyan-50/40 dark:from-emerald-950/10 dark:via-teal-950/10 dark:to-cyan-950/10 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Partner Sales (Sell Amount Already With Each Owner)
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Total Sales: <strong className="text-card-foreground">{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ownerData.map((owner, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-card/80 dark:bg-card/50 backdrop-blur-sm p-2.5 rounded-lg border border-border/60 shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              idx === 0 ? "bg-emerald-500" : "bg-teal-500"
                            }`}
                          />
                          <span className="font-bold text-xs uppercase tracking-wide text-card-foreground">
                            {owner.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-card-foreground tabular-nums">
                            {owner.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                            <span className="text-[10px] text-muted-foreground font-normal">SAR</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                            {owner.salesSharePercent.toFixed(1)}% of sales
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dual progress bar */}
                  {totalSales > 0 && ownerData.length === 2 && (
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-border/60 overflow-hidden flex shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                          style={{ width: `${ownerData[0].salesSharePercent}%` }}
                          title={`${ownerData[0].name}: ${ownerData[0].salesSharePercent.toFixed(1)}%`}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-500"
                          style={{ width: `${ownerData[1].salesSharePercent}%` }}
                          title={`${ownerData[1].name}: ${ownerData[1].salesSharePercent.toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground px-0.5">
                        <span>{ownerData[0].name} ({ownerData[0].salesSharePercent.toFixed(1)}%)</span>
                        <span>{ownerData[1].name} ({ownerData[1].salesSharePercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Banner */}
                <div className="flex items-start gap-2.5 rounded-xl p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/20">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    Each owner collects customer payments directly for their own sales, so their <strong>Sell Amount is already in their hands</strong>.
                    After subtracting expenses paid and adding withdrawals, each owner&apos;s <strong>Total In Hand</strong> is compared to the equal {sharePercent}% fair share to calculate the final cash settlement.
                  </p>
                </div>

                {/* Owner Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {ownerData.map((owner, index) => {
                    const isOwing = owner.netSettlement > 0.01;
                    const isReceiving = owner.netSettlement < -0.01;

                    return (
                      <div
                        key={index}
                        className={`relative overflow-hidden rounded-xl border p-4 space-y-3 transition-all duration-300 hover:shadow-lg ${
                          isOwing
                            ? "border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/30 to-card dark:from-amber-950/10"
                            : isReceiving
                              ? "border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/30 to-card dark:from-emerald-950/10"
                              : "border-border/60 bg-card"
                        }`}
                      >
                        {/* Owner Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3e0078] to-[#6d28d9] flex items-center justify-center text-white shadow-md">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-sm uppercase tracking-wide text-card-foreground">
                                {owner.name}
                              </span>
                              <p className="text-[10px] text-muted-foreground font-semibold">
                                Sold {owner.salesSharePercent.toFixed(1)}% of total business sales
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${
                              isOwing
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : isReceiving
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {isOwing
                              ? `Owes ${Math.abs(owner.netSettlement).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR`
                              : isReceiving
                                ? `Receives ${Math.abs(owner.netSettlement).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR`
                                : "Balanced"}
                          </span>
                        </div>

                        {/* Calculation Steps */}
                        <div className="space-y-2">
                          {/* 1. Total Sold (Sell Amount) */}
                          <div className="relative overflow-hidden rounded-lg bg-emerald-50/60 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/30 p-2.5 flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-r-full" />
                            <div className="pl-1">
                              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                                1. Total Sold (Sales Collected)
                              </span>
                              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                                Cash already with {owner.name}
                              </span>
                            </div>
                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                              {owner.sales.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs font-semibold text-emerald-600/70">SAR</span>
                            </span>
                          </div>

                          {/* 2. Expenses Paid */}
                          <div className="relative overflow-hidden rounded-lg bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/40 dark:border-rose-900/20 p-2.5 flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose-500 rounded-r-full" />
                            <div className="pl-1">
                              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">
                                2. Business Expenses Paid
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Deducted from sales cash
                              </span>
                            </div>
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                              −{" "}
                              {owner.expenses.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs text-muted-foreground">SAR</span>
                            </span>
                          </div>

                          {/* 3. Net from Sales */}
                          <div className="relative overflow-hidden rounded-lg bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/40 dark:border-purple-900/20 p-2.5 flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 rounded-r-full" />
                            <div className="pl-1">
                              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 block">
                                3. Net Profit from Sales
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Sold − Expenses
                              </span>
                            </div>
                            <span className="text-sm font-bold text-card-foreground tabular-nums">
                              = {owner.ownProfit.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs text-muted-foreground">SAR</span>
                            </span>
                          </div>

                          {/* 4. Withdrawn */}
                          <div className="relative overflow-hidden rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 p-2.5 flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 rounded-r-full" />
                            <div className="pl-1">
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">
                                4. Cash Withdrawn
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Withdrawn from company
                              </span>
                            </div>
                            <span className="text-sm font-bold text-card-foreground tabular-nums">
                              + {owner.withdrawn.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs text-muted-foreground">SAR</span>
                            </span>
                          </div>

                          {/* 5. Total In Hand */}
                          <div className="relative overflow-hidden rounded-lg bg-sky-50/60 dark:bg-sky-950/15 border border-sky-200/50 dark:border-sky-900/30 p-2.5 flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-500 rounded-r-full" />
                            <div className="pl-1">
                              <span className="text-xs font-black text-sky-800 dark:text-sky-300 block">
                                5. Total Cash In Hand
                              </span>
                              <span className="text-[10px] text-sky-700/80 dark:text-sky-400/80 font-medium">
                                Net Profit + Withdrawn
                              </span>
                            </div>
                            <span className="text-sm font-black text-sky-800 dark:text-sky-300 tabular-nums">
                              = {owner.totalInHand.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs text-muted-foreground">SAR</span>
                            </span>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-dashed border-border/60 my-1" />

                          {/* 6. Fair Share */}
                          <div className="relative overflow-hidden rounded-lg bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200/40 dark:border-indigo-900/20 p-2.5 flex items-center justify-between">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r-full" />
                            <div className="pl-1">
                              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 block">
                                6. Fair Share ({sharePercent}%)
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Equal share of business profit
                              </span>
                            </div>
                            <span className="text-sm font-bold text-card-foreground tabular-nums">
                              {owner.fairShare.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs text-muted-foreground">SAR</span>
                            </span>
                          </div>

                          {/* 7. Settlement Position */}
                          <div
                            className={`relative overflow-hidden rounded-lg p-2.5 flex items-center justify-between border ${
                              isOwing
                                ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-900/40"
                                : isReceiving
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-900/40"
                                  : "bg-gray-50/50 dark:bg-gray-950/10 border-gray-200/40 dark:border-gray-900/20"
                            }`}
                          >
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full ${
                                isOwing
                                  ? "bg-amber-500"
                                  : isReceiving
                                    ? "bg-emerald-500"
                                    : "bg-gray-400"
                              }`}
                            />
                            <div className="pl-1">
                              <span
                                className={`text-xs font-bold block ${
                                  isOwing
                                    ? "text-amber-800 dark:text-amber-300"
                                    : isReceiving
                                      ? "text-emerald-800 dark:text-emerald-300"
                                      : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {isOwing
                                  ? "Excess in Hand (Owes)"
                                  : isReceiving
                                    ? "Shortfall (Receives)"
                                    : "Balanced"}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                Total In Hand − Fair Share
                              </span>
                            </div>
                            <span
                              className={`text-sm font-black tabular-nums ${
                                isOwing
                                  ? "text-amber-700 dark:text-amber-300"
                                  : isReceiving
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {isOwing ? "+" : isReceiving ? "−" : ""}
                              {Math.abs(owner.netSettlement).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}{" "}
                              <span className="text-xs text-muted-foreground">SAR</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Settlement Transfers */}
                {transfers.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Required Transfers
                    </p>
                    {transfers.map((transfer, idx) => (
                      <div
                        key={idx}
                        className="relative overflow-hidden rounded-xl border border-teal-200/60 dark:border-teal-900/30 bg-gradient-to-r from-teal-50/50 via-cyan-50/30 to-teal-50/50 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-teal-950/20 p-4"
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                          {/* Payer */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-sm uppercase text-card-foreground block">
                                {transfer.from}
                              </span>
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                Holds excess cash
                              </span>
                            </div>
                          </div>

                          {/* Arrow with Amount */}
                          <div className="flex items-center gap-2">
                            <div className="h-px w-6 bg-teal-400 dark:bg-teal-600 hidden sm:block" />
                            <div className="flex items-center gap-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-3.5 py-1.5 rounded-full shadow-sm">
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span className="text-sm font-black tabular-nums">
                                {transfer.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                SAR
                              </span>
                            </div>
                            <div className="h-px w-6 bg-teal-400 dark:bg-teal-600 hidden sm:block" />
                            <ArrowRight className="w-4 h-4 text-teal-500 hidden sm:block" />
                          </div>

                          {/* Receiver */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-sm">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-sm uppercase text-card-foreground block">
                                {transfer.to}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Receives to reach 50%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Settled State */}
                {isSettled && (
                  <div className="flex items-center justify-center gap-2.5 rounded-xl p-4 bg-green-50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-900/30">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      All owners have earned their fair share. No settlement needed.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })()}
      </div>

      {/* Lifetime Metrics - Unified Financial Overview */}
      <div className="space-y-3">
        <h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-300 tracking-tight flex items-center gap-2.5 border-b border-border/40 pb-2">
          <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
          5. Company Lifetime Metrics
        </h2>
        <Card className="overflow-hidden bg-gradient-to-br from-card to-card/90 shadow-md border border-border/80 hover:shadow-2xl hover:border-purple-500/30 transition-all duration-300">
          {/* Main layout: responsive grid split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
            {/* Left Hero Area: Available Balance (Active Treasury) */}
            <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-purple-50/20 dark:bg-purple-950/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/30 dark:bg-[#0F0A19]/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-purple-100 dark:bg-[#0F0A19]/40 text-purple-700 dark:text-purple-300 rounded-xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Treasury Balance
                    </span>
                    <h3 className="text-sm font-bold text-purple-950 dark:text-purple-300">
                      Available Balance
                    </h3>
                  </div>
                </div>

                {(() => {
                  const totalBalance = data.summary.ownerBalances.reduce(
                    (sum, o) => sum + o.balance,
                    0,
                  );
                  return (
                    <div className="space-y-2">
                      <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-card-foreground tracking-tight">
                        {totalBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs lg:text-lg text-muted-foreground">
                          SAR
                        </span>
                      </h1>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Side: Lifetime breakdown grid */}
            <div className="lg:col-span-7 p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 items-stretch">
              {/* Stat 1: Total Income */}
              <div className="group relative overflow-hidden rounded-xl border border-green-200/60 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute left-0 top-0 h-full w-1 bg-green-500" />

                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 transition-all duration-300 group-hover:bg-green-500 group-hover:text-white dark:bg-green-900/40">
                    <TrendingUp className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Income
                    </p>

                    <h2 className="mt-0.5 md:text-xl font-black tracking-tight">
                      {data.summary.totalIncome.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-muted-foreground">SAR</span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Stat 2: Total Expenses */}
              <div className="group relative overflow-hidden rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />

                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-all duration-300 group-hover:bg-rose-500 group-hover:text-white dark:bg-rose-900/40">
                    <TrendingDown className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Expenses
                    </p>

                    <h2 className="mt-0.5 md:text-xl font-black tracking-tight">
                      {data.summary.totalExpenses.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-muted-foreground">SAR</span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Stat 3: Net Profit */}
              <div className="group relative overflow-hidden rounded-xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute left-0 top-0 h-full w-1 bg-purple-500" />

                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-all duration-300 group-hover:bg-purple-500 group-hover:text-white dark:bg-[#0F0A19]/40">
                    <DollarSign className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Net Profit
                    </p>

                    <h2
                      className={`mt-0.5 md:text-xl font-black tracking-tight ${
                        data.summary.netProfit >= 0
                          ? "text-card-foreground"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {data.summary.netProfit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-muted-foreground">SAR</span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Expense Category Details */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/40 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-300 tracking-tight flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
            6. Expense Category Details
          </h2>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Month:
            </span>
            <Select
              value={selectedBreakdownMonth}
              onValueChange={setSelectedBreakdownMonth}
            >
              <SelectTrigger className="w-[180px] bg-card border-border text-card-foreground shadow-sm">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {data.monthlyPerformance.map((item) => (
                  <SelectItem key={item.month} value={item.month.toString()}>
                    {item.monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card className="overflow-hidden shadow-md border border-border/80 bg-gradient-to-br from-card to-card/95 hover:shadow-2xl transition-all duration-300">
          {isBreakdownLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground w-full bg-purple-50/10 dark:bg-purple-950/5">
              <Activity className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold tracking-wide">Loading breakdown...</span>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row">
              {/* Donut Chart Area */}
              <div className="lg:w-72 flex-shrink-0 p-4 lg:p-8 flex flex-col items-center justify-center bg-purple-50/20 dark:bg-purple-950/5 border-b lg:border-b-0 lg:border-r border-border/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/30 dark:bg-[#0F0A19]/10 rounded-bl-full -z-10" />
                {(() => {
                  const totalExpense = expenseBreakdown.reduce(
                    (s, e) => s + e.total,
                    0,
                  );
                  return (
                    <div className="relative">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie
                            data={
                              expenseBreakdown.length > 0
                                ? expenseBreakdown
                                : [{ category: { name: "No Data" }, total: 1 }]
                            }
                            dataKey="total"
                            nameKey="category.name"
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={105}
                            paddingAngle={2}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {expenseBreakdown.length > 0 ? (
                              expenseBreakdown.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    COLOR_PALETTE[index % COLOR_PALETTE.length]
                                  }
                                  stroke="none"
                                />
                              ))
                            ) : (
                              <Cell fill="#e2e8f0" stroke="none" />
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`,
                              name,
                            ]}
                            contentStyle={{
                              background: tooltipBg,
                              border: `1px solid ${tooltipBorder}`,
                              borderRadius: "12px",
                              color: isDark ? "#e2e8f0" : "#1e293b",
                              fontSize: "12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                          Total
                        </p>
                        <p className="md:text-xl lg:text-2xl font-black text-card-foreground leading-tight tracking-tight">
                          {totalExpense.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          <span className="text-xs text-muted-foreground">
                            SAR
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          {selectedBreakdownMonth === "all"
                            ? "All Time"
                            : data.monthlyPerformance.find(
                                (m) => m.month.toString() === selectedBreakdownMonth,
                              )?.monthName || "This Month"}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Category Cards List */}
              <div className="flex-1 p-4 lg:p-4">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category Breakdown
                  </span>
                  <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
                    {expenseBreakdown.length} categories
                  </span>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const totalExpense = expenseBreakdown.reduce(
                      (s, e) => s + e.total,
                      0,
                    );
                    return expenseBreakdown
                      .slice()
                      .sort((a, b) => b.total - a.total)
                      .map((entry, index) => {
                        const pct =
                          totalExpense > 0
                            ? (entry.total / totalExpense) * 100
                            : 0;
                        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
                        return (
                          <div
                            key={index}
                            className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/20 dark:bg-muted/5 p-4 hover:bg-muted/40 dark:hover:bg-muted/10 hover:shadow-sm transition-all duration-200 group"
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="inline-block w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-card"
                                  style={{
                                    backgroundColor: color,
                                  }}
                                />
                                <span className="font-semibold text-sm text-card-foreground truncate">
                                  {entry.category.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 flex-shrink-0">
                                <span className="text-base font-bold text-card-foreground tabular-nums">
                                  {entry.total.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  <span className="text-xs text-muted-foreground">
                                    SAR
                                  </span>
                                </span>
                                <span className="text-xs font-bold text-muted-foreground tabular-nums bg-muted/50 px-2 py-0.5 rounded-full min-w-[52px] text-center">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-muted/50 dark:bg-muted/20 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                  })()}
                  {expenseBreakdown.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No expense data available
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-border/40">
                  <a
                    href="/reports"
                    className="inline-flex items-center gap-2.5 text-sm font-semibold text-[#3e0078] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <Activity className="w-4 h-4" />
                    View Detailed Report
                  </a>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GESN.NET. All rights reserved.
      </div>
    </div>
  );
}
