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
  Info,
  Coins,
  Send,
  Banknote,
  Landmark,
  Handshake,
  ChevronRight,
  PieChart as LucidePieChart,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  createSettlementPayment,
  deleteSettlementPayment,
} from "@/lib/actions/settlement.actions";
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
    settlements?: Array<{
      _id: string;
      fromOwner: string;
      toOwner: string;
      amount: number;
      paymentMethod: "Cash" | "Bank Transfer";
      date: Date | string;
      month?: number;
      year?: number;
      notes?: string;
      createdAdminEmail?: string;
      createdAt?: Date | string;
    }>;
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
  const [settlementMethod, setSettlementMethod] = useState<"Cash" | "Bank Transfer">("Cash");
  const [customSettlementAmount, setCustomSettlementAmount] = useState<string>("");
  const [settlementNote, setSettlementNote] = useState<string>("");
  const [isSettlementSubmitting, setIsSettlementSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSettlementHistoryOpen, setIsSettlementHistoryOpen] = useState(false);
  const [settlementHistoryFilter, setSettlementHistoryFilter] = useState<"selected" | "all">("selected");
  const [isDeletingSettlementId, setIsDeletingSettlementId] = useState<string | null>(null);

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

      {/* 3A. Cash Settlement Section */}
      {(() => {
        const numOwners = data.summary.ownerBalances.length || 1;
        const isAllTime = selectedSettlementMonth === "all";
        const selectedMonthNum = isAllTime ? 0 : parseInt(selectedSettlementMonth);

        // Calculate total profit based on selected filter
        let totalNetProfit: number;
        if (isAllTime) {
          totalNetProfit = data.summary.netProfit;
        } else {
          const totalSales = data.summary.ownerBalances.reduce((sum, owner) => {
            const monthly = owner.monthlyBalances?.find((m) => m.month === selectedMonthNum);
            return sum + (monthly?.income || 0);
          }, 0);
          const totalExpenses = data.summary.ownerBalances.reduce((sum, owner) => {
            const monthly = owner.monthlyBalances?.find((m) => m.month === selectedMonthNum);
            return sum + (monthly?.expenses || 0);
          }, 0);
          totalNetProfit = totalSales - totalExpenses;
        }
        const fairShare = totalNetProfit / numOwners;

        // Relevant settlements for this period
        const relevantSettlements = (data.settlements || []).filter((s) => {
          if (isAllTime) return true;
          const sDate = new Date(s.date);
          const sMonth = s.month || sDate.getMonth() + 1;
          return sMonth === selectedMonthNum;
        });

        // Each owner's current cash held (based on net profit only — no withdrawals)
        const ownerData = data.summary.ownerBalances.map((owner) => {
          let sales: number;
          let expenses: number;
          if (isAllTime) {
            sales = owner.totalIncome;
            expenses = owner.totalExpenses;
          } else {
            const monthly = owner.monthlyBalances?.find((m) => m.month === selectedMonthNum);
            sales = monthly?.income || 0;
            expenses = monthly?.expenses || 0;
          }
          const netProfit = sales - expenses;

          // Settlements paid by this owner reduce their cash held
          const paid = relevantSettlements
            .filter((s) => s.fromOwner === owner.name)
            .reduce((sum, s) => sum + s.amount, 0);

          // Settlements received by this owner increase their cash held
          const received = relevantSettlements
            .filter((s) => s.toOwner === owner.name)
            .reduce((sum, s) => sum + s.amount, 0);

          // Current Cash Held = Net Profit - paid + received
          const currentCashHeld = netProfit - paid + received;
          const netSettlement = currentCashHeld - fairShare;

          return {
            name: owner.name,
            sales,
            expenses,
            netProfit,
            paid,
            received,
            currentCashHeld,
            fairShare,
            netSettlement,
          };
        });

        // Determine settlement transfers
        const payers = ownerData.filter((o) => o.netSettlement > 0.01);
        const receivers = ownerData.filter((o) => o.netSettlement < -0.01);

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

        const transferFrom = transfers.length > 0 ? transfers[0].from : "";
        const transferTo = transfers.length > 0 ? transfers[0].to : "";
        const calculatedAmount = transfers.length > 0 ? Math.round(transfers[0].amount) : 0;
        const displayAmount =
          customSettlementAmount !== ""
            ? customSettlementAmount
            : calculatedAmount > 0
              ? calculatedAmount.toString()
              : "";

        const handleMakePayment = async () => {
          if (transfers.length === 0) {
            toast.error("No settlement needed at this time.");
            return;
          }
          const amount = parseFloat(displayAmount);
          if (!amount || amount <= 0) {
            toast.error("Please enter a valid transfer amount.");
            return;
          }
          setIsSettlementSubmitting(true);
          try {
            await createSettlementPayment({
              fromOwner: transferFrom,
              toOwner: transferTo,
              amount,
              paymentMethod: settlementMethod,
              month: isAllTime ? undefined : selectedMonthNum,
              year: new Date().getFullYear(),
              notes: settlementNote.trim() || undefined,
            });
            toast.success(`Payment of ${amount.toLocaleString()} SAR from ${transferFrom} to ${transferTo} recorded!`);
            setCustomSettlementAmount("");
            setSettlementNote("");
            setIsPaymentModalOpen(false);
            router.refresh();
          } catch (error: unknown) {
            const err = error as Error;
            toast.error(err?.message || "Failed to process settlement payment.");
          } finally {
            setIsSettlementSubmitting(false);
          }
        };

        const partnerColorSchemes = [
          {
            card: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-100/90 dark:border-blue-900/30",
            avatarBg: "bg-blue-200/80 dark:bg-blue-900/70 text-blue-700 dark:text-blue-200",
            netText: "text-blue-600 dark:text-blue-400",
          },
          {
            card: "bg-purple-50/70 dark:bg-purple-950/20 border-purple-100/90 dark:border-purple-900/30",
            avatarBg: "bg-purple-200/80 dark:bg-purple-900/70 text-purple-700 dark:text-purple-200",
            netText: "text-purple-600 dark:text-purple-400",
          },
          {
            card: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100/90 dark:border-emerald-900/30",
            avatarBg: "bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-200",
            netText: "text-emerald-600 dark:text-emerald-400",
          },
          {
            card: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-100/90 dark:border-amber-900/30",
            avatarBg: "bg-amber-200/80 dark:bg-amber-900/70 text-amber-700 dark:text-amber-200",
            netText: "text-amber-600 dark:text-amber-400",
          },
        ];

        return (
          <div className="relative overflow-hidden rounded-xl border border-emerald-200/90 dark:border-emerald-800/40 bg-gradient-to-br from-[#ebfaf1] via-[#f3fcf8] to-[#e7f7f0] dark:from-emerald-950/25 dark:via-zinc-900/70 dark:to-emerald-950/30 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
            {/* Top decorative ambient glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-300/30 dark:bg-emerald-700/10 blur-3xl" />

            {/* Header: Title & Month Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Vertical emerald accent bar */}
                <div className="w-1.5 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-full flex-shrink-0" />
                {/* Coins icon in rounded container */}
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0 shadow-2xs">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    3A. Cash Settlement
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Partner cash position and monthly settlement
                  </p>
                </div>
              </div>

              {/* Month selector & History Button */}
              <div className="flex items-center gap-2 self-start sm:self-auto pl-4 sm:pl-0 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  MONTH:
                </span>
                <Select
                  value={selectedSettlementMonth}
                  onValueChange={setSelectedSettlementMonth}
                >
                  <SelectTrigger className="w-[130px] sm:w-[155px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 font-bold text-xs rounded-lg shadow-2xs h-8.5 sm:h-9">
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

                {/* History button beside date filter */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettlementHistoryOpen(true)}
                  className="bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-lg h-8.5 sm:h-9 px-3 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>History</span>
                  {(data.settlements || []).length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                      {(data.settlements || []).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Content Cards Grid: Single column on mobile (matching screenshot), 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5">
              {/* Left Column on Desktop (Card 1 + Card 2) */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-3.5">
                {/* Card 1: Settlement Summary */}
                <div className="bg-white dark:bg-zinc-900/90 rounded-xl p-3 sm:p-3.5 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    {/* Blue vertical pill indicator */}
                    <div className="w-1 h-8 bg-blue-500 rounded-full flex-shrink-0" />
                    {/* Blue pie icon */}
                    <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                      <LucidePieChart className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                        Settlement Summary
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate">
                        Partner profit share (50%) for this month
                      </p>
                    </div>
                  </div>

                  {/* Profit Share Amount on Right with border divider */}
                  <div className="border-l border-slate-200 dark:border-zinc-700/80 pl-3 sm:pl-4 text-right flex-shrink-0">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      Partner Profit Share (50%)
                    </p>
                    <p className="text-base sm:text-lg md:text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums whitespace-nowrap leading-tight mt-0.5">
                      {fairShare.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      <span className="text-xs font-bold text-blue-500">SAR</span>
                    </p>
                  </div>
                </div>

                {/* Card 2: Current Cash Held */}
                <div className="bg-white dark:bg-zinc-900/90 rounded-xl p-3 sm:p-3.5 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs space-y-2.5 sm:space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                      <Wallet className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                        Current Cash Held
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                        Sales minus expenses = Net cash
                      </p>
                    </div>
                  </div>

                  {/* Partner Rows */}
                  <div className="space-y-2">
                    {ownerData.map((owner, idx) => {
                      const style = partnerColorSchemes[idx % partnerColorSchemes.length];
                      const initial = owner.name ? owner.name.charAt(0).toUpperCase() : "P";
                      return (
                        <div
                          key={idx}
                          className={`rounded-lg p-2.5 sm:p-3 border flex items-center gap-2.5 sm:gap-3 ${style.card} transition-all`}
                        >
                          {/* Avatar Circle */}
                          <div
                            className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 shadow-2xs ${style.avatarBg}`}
                          >
                            {initial}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            {/* Top row: Name & Cash Held */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                {owner.name}
                              </span>
                              <span className="font-black text-xs sm:text-sm md:text-base text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                                {owner.currentCashHeld.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}{" "}
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                                  SAR
                                </span>
                              </span>
                            </div>

                            {/* Bottom row: Sales - Exp = Net */}
                            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                              <span>
                                Sales:{" "}
                                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                  {owner.sales.toLocaleString()} SAR
                                </span>
                              </span>
                              <span>−</span>
                              <span>
                                Exp:{" "}
                                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                  {owner.expenses.toLocaleString()} SAR
                                </span>
                              </span>
                              <span>=</span>
                              <span>
                                Net:{" "}
                                <span className={`font-black tabular-nums ${style.netText}`}>
                                  {owner.netProfit.toLocaleString()} SAR
                                </span>
                              </span>
                              {(owner.paid > 0 || owner.received > 0) && (
                                <span className="text-[9.5px] ml-1">
                                  {owner.paid > 0 && (
                                    <span className="text-rose-600 dark:text-rose-400">
                                      (−{owner.paid.toLocaleString()} paid)
                                    </span>
                                  )}
                                  {owner.paid > 0 && owner.received > 0 && " "}
                                  {owner.received > 0 && (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      (+{owner.received.toLocaleString()} recv)
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column on Desktop / Bottom on Mobile (Card 3: Settlement Needed) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="bg-white/90 dark:bg-zinc-900/90 rounded-xl p-3.5 sm:p-4 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs flex-1 flex flex-col justify-between space-y-3">
                  {transfers.length > 0 ? (
                    <>
                      {/* Header with green handshake icon */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                          <Handshake className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                            Settlement Needed
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Balance needs to be settled between partners
                          </p>
                        </div>
                      </div>

                      {/* Highlight Box with Big Number */}
                      <div className="bg-emerald-100/70 dark:bg-emerald-950/50 rounded-lg py-3.5 px-4 text-center border border-emerald-200/70 dark:border-emerald-800/40 my-auto">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wide uppercase">
                          <span className="font-black text-slate-900 dark:text-white">{transfers[0].from}</span>
                          {" will pay "}
                          <span className="font-black text-slate-900 dark:text-white">{transfers[0].to}</span>
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight mt-1 tabular-nums">
                          {transfers[0].amount.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          <span className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-400">
                            SAR
                          </span>
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-between w-full text-xs sm:text-sm transition-all active:scale-[0.99] group cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2 flex-1 pl-4">
                          <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
                          <span>Make Settlement Payment</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Settled state */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                            Accounts Settled
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            All partners hold equal cash
                          </p>
                        </div>
                      </div>

                      <div className="bg-emerald-100/60 dark:bg-emerald-950/40 rounded-lg py-3 px-4 text-center border border-emerald-200/60 dark:border-emerald-800/40 my-auto">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                          All Accounts Settled
                        </p>
                        <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 tracking-tight mt-1 tabular-nums">
                          0 SAR
                        </p>
                      </div>

                      <div className="py-2.5 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs text-center border border-emerald-200/60 dark:border-emerald-800/40">
                        ✓ No settlement needed for this period
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Settlement Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
              <DialogContent className="max-w-md p-0 bg-card border-border/80 shadow-2xl rounded-xl overflow-hidden">
                <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2.5 sm:pb-3 space-y-1 bg-gradient-to-r from-emerald-50 to-teal-100/50 dark:from-emerald-950/20 dark:to-teal-900/10 border-b border-emerald-200/60 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-teal-700 to-emerald-700 flex items-center justify-center text-white shadow-md">
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-12 translate-x-0.5" />
                    </div>
                    <DialogTitle className="font-bold text-base sm:text-lg text-card-foreground">
                      Make Settlement Payment
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground pl-10 sm:pl-[46px]">
                    Record cash or bank settlement transfer to balance partner profit share.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-3.5 px-4 sm:px-5 pt-3 pb-4 sm:pb-5">
                  {/* Transfer From */}
                  <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[95px] sm:min-w-[110px]">
                      Transfer From
                    </span>
                    <div className="w-full bg-muted/50 dark:bg-zinc-900/60 border border-border/60 rounded-lg px-3 sm:px-3.5 py-1.5 sm:py-2 font-bold text-xs sm:text-sm text-card-foreground">
                      {transferFrom || "None"}
                    </div>
                  </div>

                  {/* Transfer To */}
                  <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[95px] sm:min-w-[110px]">
                      Transfer To
                    </span>
                    <div className="w-full bg-muted/50 dark:bg-zinc-900/60 border border-border/60 rounded-lg px-3 sm:px-3.5 py-1.5 sm:py-2 font-bold text-xs sm:text-sm text-card-foreground">
                      {transferTo || "None"}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[95px] sm:min-w-[110px]">
                      Amount
                    </span>
                    <div className="relative w-full">
                      <Input
                        type="number"
                        value={displayAmount}
                        onChange={(e) => setCustomSettlementAmount(e.target.value)}
                        placeholder="Amount"
                        disabled={transfers.length === 0}
                        className="bg-muted/50 dark:bg-zinc-900/60 border-border/60 font-bold text-xs sm:text-sm pr-14 rounded-lg text-card-foreground h-9 sm:h-10"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-muted-foreground">
                        SAR
                      </span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground block">
                      Payment Method
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSettlementMethod("Cash")}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                          settlementMethod === "Cash"
                            ? "bg-teal-700 text-white shadow-sm"
                            : "bg-muted/50 dark:bg-zinc-900/60 hover:bg-muted text-card-foreground border border-border/60"
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementMethod("Bank Transfer")}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                          settlementMethod === "Bank Transfer"
                            ? "bg-teal-700 text-white shadow-sm"
                            : "bg-muted/50 dark:bg-zinc-900/60 hover:bg-muted text-card-foreground border border-border/60"
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                    {/* Note Field */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground block">
                        Note
                      </span>
                      <Input
                        type="text"
                        value={settlementNote}
                        onChange={(e) => setSettlementNote(e.target.value)}
                        placeholder="Add a note or reference (optional)..."
                        className="bg-muted/50 dark:bg-zinc-900/60 border-border/60 font-medium text-xs sm:text-sm rounded-lg text-card-foreground h-9 sm:h-10"
                      />
                    </div>

                  {/* Submit & Note */}
                  <div className="space-y-2 pt-1.5 sm:pt-2">
                    <Button
                      type="button"
                      onClick={handleMakePayment}
                      disabled={isSettlementSubmitting || transfers.length === 0}
                      className="w-full bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all text-xs sm:text-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-12 translate-x-0.5" />
                      {isSettlementSubmitting
                        ? "Processing Payment..."
                        : transfers.length === 0
                          ? "Accounts Settled"
                          : "Make Payment"}
                    </Button>

                    <div className="flex items-start gap-1.5 sm:gap-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/20 p-2.5 sm:p-3 text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300">
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="leading-relaxed">
                        After payment, the settlement record will update automatically.
                      </span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Settlement History Modal */}
            <Dialog open={isSettlementHistoryOpen} onOpenChange={setIsSettlementHistoryOpen}>
              <DialogContent className="max-w-2xl p-0 bg-card border-border/80 shadow-2xl rounded-xl overflow-hidden max-h-[88vh] flex flex-col">
                <DialogHeader className="px-5 pt-5 pb-3.5 space-y-2 bg-gradient-to-r from-emerald-50 to-teal-100/50 dark:from-emerald-950/30 dark:to-teal-900/10 border-b border-emerald-200/60 dark:border-emerald-900/30 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-emerald-700 flex items-center justify-center text-white shadow-md flex-shrink-0">
                      <History className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <DialogTitle className="font-bold text-base sm:text-lg text-card-foreground">
                        Settlement Payment History
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        All recorded settlement transfers and balancing notes between partners
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Filter tabs: Selected Month vs All Settlements */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSettlementHistoryFilter("selected")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        settlementHistoryFilter === "selected"
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-white/80 dark:bg-zinc-800 text-muted-foreground hover:text-card-foreground border border-border/60"
                      }`}
                    >
                      {isAllTime
                        ? "All Time View"
                        : `${data.monthlyPerformance.find((m) => m.month === selectedMonthNum)?.monthName || "Selected Month"}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettlementHistoryFilter("all")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        settlementHistoryFilter === "all"
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-white/80 dark:bg-zinc-800 text-muted-foreground hover:text-card-foreground border border-border/60"
                      }`}
                    >
                      All Records ({(data.settlements || []).length})
                    </button>
                  </div>
                </DialogHeader>

                {/* Content body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                  {(() => {
                    const allSettlements = data.settlements || [];
                    const filteredSettlements =
                      settlementHistoryFilter === "selected"
                        ? relevantSettlements
                        : allSettlements;

                    if (filteredSettlements.length === 0) {
                      return (
                        <div className="py-12 text-center space-y-2.5">
                          <div className="w-12 h-12 rounded-full bg-muted/60 dark:bg-zinc-800 flex items-center justify-center mx-auto text-muted-foreground">
                            <Handshake className="w-6 h-6 opacity-60" />
                          </div>
                          <p className="font-bold text-sm text-card-foreground">
                            No Settlement Records Found
                          </p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {settlementHistoryFilter === "selected" && !isAllTime
                              ? "No settlement transfers were recorded for this selected month."
                              : "No partner settlements have been recorded yet."}
                          </p>
                        </div>
                      );
                    }

                    const totalAmount = filteredSettlements.reduce((sum, s) => sum + s.amount, 0);

                    return (
                      <div className="space-y-3">
                        {/* Summary metric bar */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-900/30 text-xs">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                            Total Settled ({filteredSettlements.length}{" "}
                            {filteredSettlements.length === 1 ? "record" : "records"}):
                          </span>
                          <span className="font-black text-sm text-emerald-900 dark:text-emerald-200 tabular-nums">
                            {totalAmount.toLocaleString()} SAR
                          </span>
                        </div>

                        {/* List */}
                        <div className="space-y-2.5">
                          {filteredSettlements.map((s) => {
                            const dateObj = new Date(s.date);
                            const formattedDate = !isNaN(dateObj.getTime())
                              ? dateObj.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A";

                            return (
                              <div
                                key={s._id}
                                className="rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 space-y-2 hover:border-emerald-500/40 transition-all shadow-xs"
                              >
                                {/* Top row: Transfer parties & amount */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm">
                                    <span className="font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-900/40">
                                      {s.fromOwner}
                                    </span>
                                    <span className="text-muted-foreground font-bold">→</span>
                                    <span className="font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                                      {s.toOwner}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 ml-1">
                                      {s.paymentMethod === "Cash" ? (
                                        <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <Landmark className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                      )}
                                      {s.paymentMethod}
                                    </span>
                                  </div>
                                  <span className="font-black text-sm sm:text-base text-emerald-800 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                                    {s.amount.toLocaleString()} SAR
                                  </span>
                                </div>

                                {/* Note if present */}
                                {s.notes && (
                                  <div className="text-xs bg-muted/40 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-border/60 text-card-foreground flex items-start gap-2">
                                    <ReceiptText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                                        Note / Reference
                                      </span>
                                      <p className="whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">
                                        {s.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Bottom meta info: date, recorded by, delete button */}
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                                  <span>{formattedDate}</span>
                                  <div className="flex items-center gap-3">
                                    {s.createdAdminEmail && (
                                      <span className="hidden sm:inline">
                                        By: {s.createdAdminEmail}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isDeletingSettlementId === s._id}
                                      onClick={async () => {
                                        if (confirm("Are you sure you want to delete this settlement record?")) {
                                          setIsDeletingSettlementId(s._id);
                                          try {
                                            await deleteSettlementPayment(s._id);
                                            toast.success("Settlement record deleted");
                                            router.refresh();
                                          } catch (err: unknown) {
                                            toast.error((err as Error)?.message || "Failed to delete settlement");
                                          } finally {
                                            setIsDeletingSettlementId(null);
                                          }
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                                      title="Delete settlement record"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span className="text-[10px]">Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      })()}

      {/* Lifetime Metrics - Unified Financial Overview */}
      <div className="space-y-3">
        <h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-300 tracking-tight flex items-center gap-2.5 border-b border-border/40 pb-2">
          <span className="w-1.5 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
          4. Company Lifetime Metrics
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
            5. Expense Category Details
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
