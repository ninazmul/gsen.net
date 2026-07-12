
import { getActivityLogs } from "@/lib/actions/activity-log.actions";
import ActivityLogsClient from "./components/ActivityLogsClient";
import { checkPagePermissionServer } from "@/lib/actions/permission-actions";
import { redirect } from "next/navigation";

export default async function ActivityLogsPage() {
  const hasAccess = await checkPagePermissionServer("activityLogs");
  if (!hasAccess) redirect("/access-denied");

  const { logs, totalPages } = await getActivityLogs({ limit: 10 });
  return (
    <ActivityLogsClient
      initialLogs={logs}
      initialTotalPages={totalPages}
    />
  );
}
