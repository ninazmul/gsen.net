import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./components/AdminSidebar";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { seedDefaultCategories } from "@/lib/actions/category.actions";
import {
  checkIsAdmin,
  getOrCreateCurrentAdmin,
  type Admin,
} from "@/lib/actions/admin.actions";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  // Create admin if first user
  const admin = await getOrCreateCurrentAdmin();
  if (!admin) redirect("/access-denied");

  const isAdmin = await checkIsAdmin();
  if (!isAdmin) redirect("/access-denied");

  // Seed default categories
  await seedDefaultCategories();

  return (
    <SidebarProvider>
      <AdminSidebar currentAdmin={admin as Admin} />
      <Toaster />
      <main className="flex-1 h-screen mx-auto overflow-y-auto bg-background">
        <div className="flex justify-between items-center p-4 w-full border-b border-border text-purple-900 bg-white dark:text-purple-100 dark:bg-[#1a0040] dark:border-purple-900/40">
          <SidebarTrigger />
          <div className="flex justify-between w-full px-2">
            <div>
              <h1 className="text-xl font-bold">GSEN.NET</h1>
              <p className="text-xs">Business Account Management System</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs md:text-sm font-medium">
                <CalendarDays className="w-4 h-4 text-black dark:text-white animate-pulse" />
                <span>{formatDate(new Date())}</span>
              </div>
              <ThemeToggle />
              <SignedIn>
                <UserButton afterSwitchSessionUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
        <div className="p-2">{children}</div>
      </main>
    </SidebarProvider>
  );
}

