import { NextResponse } from "next/server";
import { validateApiCredentials } from "@/lib/api-auth";
import {
  getIncomeReport,
  getExpenseReport,
  getProfitReport,
  getCategoryReport,
  getMonthlyPerformanceReport,
} from "@/lib/actions/reports.actions";
import { getDateRange } from "@/lib/export-utils";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-owner, x-api-secret-key, x-api-user, x-api-key",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
};

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * GET /api/reports
 * 
 * Query Parameters:
 *  - period: "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "thisYear" | "all"
 *  - startDate: string (YYYY-MM-DD or ISO string)
 *  - endDate: string (YYYY-MM-DD or ISO string)
 *  - category: string (Category ID)
 *  - year: number (for monthly performance, defaults to current year)
 *  - type: "all" | "summary" | "income" | "expense" | "profit" | "category" | "monthly"
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate request via API Owner & Secret Key
    const auth = await validateApiCredentials(req);
    if (!auth.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthorized",
        },
        {
          status: auth.status || 401,
          headers: corsHeaders,
        }
      );
    }

    // 2. Parse query filters
    const url = new URL(req.url);
    const periodParam = url.searchParams.get("period");
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const categoryParam = url.searchParams.get("category") || undefined;
    const typeParam = (url.searchParams.get("type") || "all").toLowerCase();

    const yearParam = url.searchParams.get("year")
      ? parseInt(url.searchParams.get("year")!, 10)
      : new Date().getFullYear();

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let appliedPeriod = periodParam || "all";

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      appliedPeriod = "custom";
    } else if (periodParam && periodParam !== "all" && periodParam !== "custom") {
      const range = getDateRange(periodParam);
      startDate = range.startDate;
      endDate = new Date(range.endDate);
      endDate.setHours(23, 59, 59, 999);
      appliedPeriod = periodParam;
    }

    const dateFilter = { startDate, endDate };

    // 3. Fetch reports according to type filter
    let reportData: Record<string, unknown> = {};

    if (typeParam === "income") {
      const incomeReport = await getIncomeReport({ ...dateFilter, category: categoryParam });
      reportData = { income: incomeReport };
    } else if (typeParam === "expense") {
      const expenseReport = await getExpenseReport({ ...dateFilter, category: categoryParam });
      reportData = { expense: expenseReport };
    } else if (typeParam === "profit") {
      const profitReport = await getProfitReport(dateFilter);
      reportData = { profit: profitReport };
    } else if (typeParam === "category") {
      const categoryReport = await getCategoryReport(dateFilter);
      reportData = { categories: categoryReport };
    } else if (typeParam === "monthly") {
      const monthlyReport = await getMonthlyPerformanceReport(yearParam);
      reportData = { monthly: monthlyReport };
    } else if (typeParam === "summary") {
      const profitReport = await getProfitReport(dateFilter);
      const profitMargin =
        profitReport.totalIncome > 0
          ? ((profitReport.netProfit / profitReport.totalIncome) * 100).toFixed(2)
          : 0;

      reportData = {
        summary: {
          totalIncome: profitReport.totalIncome,
          totalExpenses: profitReport.totalExpenses,
          netProfit: profitReport.netProfit,
          profitMarginPercent: Number(profitMargin),
          incomeCount: profitReport.incomes?.length || 0,
          expenseCount: profitReport.expenses?.length || 0,
        },
      };
    } else {
      // "all" - Return comprehensive reports bundle in parallel
      const [incomeReport, expenseReport, profitReport, categoryReport, monthlyReport] =
        await Promise.all([
          getIncomeReport({ ...dateFilter, category: categoryParam }),
          getExpenseReport({ ...dateFilter, category: categoryParam }),
          getProfitReport(dateFilter),
          getCategoryReport(dateFilter),
          getMonthlyPerformanceReport(yearParam),
        ]);

      const profitMargin =
        profitReport.totalIncome > 0
          ? ((profitReport.netProfit / profitReport.totalIncome) * 100).toFixed(2)
          : 0;

      reportData = {
        summary: {
          totalIncome: profitReport.totalIncome,
          totalExpenses: profitReport.totalExpenses,
          netProfit: profitReport.netProfit,
          profitMarginPercent: Number(profitMargin),
          incomeCount: incomeReport.incomes.length,
          expenseCount: expenseReport.expenses.length,
        },
        income: {
          total: incomeReport.total,
          count: incomeReport.incomes.length,
          items: incomeReport.incomes,
        },
        expenses: {
          total: expenseReport.total,
          count: expenseReport.expenses.length,
          items: expenseReport.expenses,
        },
        profit: {
          totalIncome: profitReport.totalIncome,
          totalExpenses: profitReport.totalExpenses,
          netProfit: profitReport.netProfit,
        },
        categories: categoryReport,
        monthlyPerformance: {
          year: yearParam,
          ...monthlyReport,
        },
      };
    }

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        owner: auth.owner,
        filters: {
          period: appliedPeriod,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
          category: categoryParam || null,
          type: typeParam,
          year: yearParam,
        },
        data: reportData,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error in /api/reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
