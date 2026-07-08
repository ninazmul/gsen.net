import { getIncomes } from "@/lib/actions/income.actions";
import IncomeClient from "./components/IncomeClient";

export default async function IncomePage() {
  const { incomes } = await getIncomes({ limit: 100 });
  return <IncomeClient initialIncomes={incomes} />;
}
