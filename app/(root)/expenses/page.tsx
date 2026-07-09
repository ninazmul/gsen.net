import { getExpenses } from "@/lib/actions/expense.actions";
import ExpensesClient from "./components/ExpensesClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const hasAccess = await checkPagePermissionServer("expenses");
  if (!hasAccess) redirect("/access-denied");

  const { expenses } = await getExpenses();
  return <ExpensesClient initialExpenses={expenses} />;
}
