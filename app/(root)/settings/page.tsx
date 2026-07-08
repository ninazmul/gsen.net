import { getSettings } from "@/lib/actions/settings.actions";
import SettingsClient from "./components/SettingsClient";
import { getOrCreateCurrentAdmin } from "@/lib/actions/admin.actions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const admin = await getOrCreateCurrentAdmin();
  if (!admin) {
    redirect("/access-denied");
  }

  const settings = await getSettings();
  return <SettingsClient initialSettings={settings} />;
}
