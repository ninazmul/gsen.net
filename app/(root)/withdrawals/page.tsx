import { getWithdrawals } from "@/lib/actions/withdrawal.actions";
import WithdrawalsClient from "./components/WithdrawalsClient";

export default async function WithdrawalsPage() {
  const { withdrawals } = await getWithdrawals({ limit: 100 });
  return <WithdrawalsClient initialWithdrawals={withdrawals} />;
}
