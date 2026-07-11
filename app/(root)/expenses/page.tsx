import { getExpenses } from "@/lib/actions/expense.actions";
import ExpensesClient from "./components/ExpensesClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/actions/admin.actions";

export default async function ExpensesPage() {
  const hasAccess = await checkPagePermissionServer("expenses");
  if (!hasAccess) redirect("/access-denied");

  const admin = await getCurrentAdmin();
  const { expenses, totalPages } = await getExpenses({ limit: 10 });
  return (
    <ExpensesClient
      initialExpenses={expenses}
      initialTotalPages={totalPages}
      currentAdmin={admin}
    />
  );
}
