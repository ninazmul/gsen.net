import { getWithdrawals } from "@/lib/actions/withdrawal.actions";
import WithdrawalsClient from "./components/WithdrawalsClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/actions/admin.actions";

export default async function WithdrawalsPage() {
  const hasAccess = await checkPagePermissionServer("withdrawals");
  if (!hasAccess) redirect("/access-denied");

  const admin = await getCurrentAdmin();
  const { withdrawals } = await getWithdrawals({ limit: 100 });
  return (
    <WithdrawalsClient initialWithdrawals={withdrawals} currentAdmin={admin} />
  );
}
