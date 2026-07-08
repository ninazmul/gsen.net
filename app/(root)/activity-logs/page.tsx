import { getActivityLogs } from "@/lib/actions/activity-log.actions";
import ActivityLogsClient from "./components/ActivityLogsClient";

export default async function ActivityLogsPage() {
  const { logs } = await getActivityLogs({ limit: 100 });
  return <ActivityLogsClient initialLogs={logs} />;
}
