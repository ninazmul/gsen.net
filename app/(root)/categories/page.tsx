import { getCategories } from "@/lib/actions/category.actions";
import CategoriesClient from "./components/CategoriesClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
  const hasAccess = await checkPagePermissionServer("categories");
  if (!hasAccess) redirect("/access-denied");

  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories} />;
}
