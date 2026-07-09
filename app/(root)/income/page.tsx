import { getIncomes } from "@/lib/actions/income.actions";
import IncomeClient from "./components/IncomeClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/actions/admin.actions";

export default async function IncomePage() {
  const hasAccess = await checkPagePermissionServer("income");
  if (!hasAccess) redirect("/access-denied");

  const admin = await getCurrentAdmin();
  const { incomes } = await getIncomes({ limit: 100 });
  return <IncomeClient initialIncomes={incomes} currentAdmin={admin} />;
}
