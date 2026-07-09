import { getCategories } from "@/lib/actions/category.actions";
import CategoriesClient from "./components/CategoriesClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/actions/admin.actions";

export default async function CategoriesPage() {
  const hasAccess = await checkPagePermissionServer("categories");
  if (!hasAccess) redirect("/access-denied");

  const admin = await getCurrentAdmin();
  const categories = await getCategories();
  return (
    <CategoriesClient initialCategories={categories} currentAdmin={admin} />
  );
}
