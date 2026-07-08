import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./components/AdminSidebar";
import { cookies } from "next/headers";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { seedDefaultCategories } from "@/lib/actions/category.actions";
import {
  checkIsAdmin,
  getOrCreateCurrentAdmin,
} from "@/lib/actions/admin.actions";

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

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <Toaster />
      <main className="flex-1 h-screen mx-auto overflow-y-auto">
        <div className="flex justify-between items-center p-4 w-full border-b text-white bg-[#3e0078]">
          <SidebarTrigger />
          <SignedIn>
            <UserButton afterSwitchSessionUrl="/" />
          </SignedIn>
        </div>
        <div className="p-2">{children}</div>
      </main>
    </SidebarProvider>
  );
}
