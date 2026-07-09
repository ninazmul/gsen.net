import { getAdmins } from "@/lib/actions/admin.actions";
import AdminsClient from "./components/AdminsClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";

export default async function AdminsPage() {
  const hasAccess = await checkPagePermissionServer("admins");
  if (!hasAccess) redirect("/access-denied");

  const admins = await getAdmins();
  return <AdminsClient initialAdmins={admins} />;
}
