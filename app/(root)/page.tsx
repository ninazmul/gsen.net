import { currentUser } from "@clerk/nextjs/server";
import { getDashboardData } from "@/lib/actions/dashboard.actions";
import DashboardClient from "./components/DashboardClient";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  try {
    const dashboardData = await getDashboardData();
    return <DashboardClient data={dashboardData} />;
  } catch (error) {
    console.error("Dashboard error:", error);
    throw error;
  }
};

export default DashboardPage;
