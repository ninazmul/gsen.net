import { getExpenses } from "@/lib/actions/expense.actions";
import ExpensesClient from "./components/ExpensesClient";

export default async function ExpensesPage() {
  const { expenses } = await getExpenses();
  return <ExpensesClient initialExpenses={expenses} />;
}
