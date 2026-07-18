import { currentUser } from "@clerk/nextjs/server";
import { getDashboardData } from "@/lib/actions/dashboard.actions";
import DashboardClient from "./components/DashboardClient";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/actions/admin.actions";
import { hasPageAccess } from "@/lib/permission-helpers";

const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const admin = await getCurrentAdmin();
  if (!admin || !hasPageAccess(admin, "/")) redirect("/access-denied");

  try {
    const dashboardData = await getDashboardData();
    return <DashboardClient data={dashboardData} currentAdmin={admin} />;
  } catch (error) {
    console.error("Dashboard error:", error);
    throw error;
  }
};

export default DashboardPage;
