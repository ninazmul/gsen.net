import * as XLSX from "xlsx";

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = "Sheet1",
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.sheet_to_csv(worksheet);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

export function getDateRange(period: string): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { startDate: today, endDate: today };
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    case "last7days":
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { startDate: last7, endDate: today };
    case "last30days":
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return { startDate: last30, endDate: today };
    case "thisMonth":
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: thisMonthStart, endDate: thisMonthEnd };
    case "lastMonth":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    case "thisYear":
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      const thisYearEnd = new Date(now.getFullYear(), 11, 31);
      return { startDate: thisYearStart, endDate: thisYearEnd };
    default:
      return { startDate: new Date(0), endDate: today };
  }
}
