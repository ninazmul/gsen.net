import { getAdmins } from "@/lib/actions/admin.actions";
import AdminsClient from "./components/AdminsClient";

export default async function AdminsPage() {
  const admins = await getAdmins();
  return <AdminsClient initialAdmins={admins} />;
}
