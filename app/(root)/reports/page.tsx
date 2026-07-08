import { getMonthlyPerformanceReport } from "@/lib/actions/reports.actions";
import ReportsClient from "./components/ReportsClient";

export default async function ReportsPage() {
  const monthlyReport = await getMonthlyPerformanceReport();
  return <ReportsClient initialMonthlyReport={monthlyReport} />;
}
