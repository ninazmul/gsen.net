import { getMonthlyPerformanceReport } from "@/lib/actions/reports.actions";
import ReportsClient from "./components/ReportsClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const hasAccess = await checkPagePermissionServer("reports");
  if (!hasAccess) redirect("/access-denied");

  const monthlyReport = await getMonthlyPerformanceReport();
  return <ReportsClient initialMonthlyReport={monthlyReport} />;
}
