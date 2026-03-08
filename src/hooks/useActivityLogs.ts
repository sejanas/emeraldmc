import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

interface ActivityLogFilters {
  user_id?: string;
  entity_type?: string;
  event_type?: string;
}

export default function useActivityLogs(filters: ActivityLogFilters = {}) {
  const params = new URLSearchParams();
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.entity_type) params.set("entity_type", filters.entity_type);
  if (filters.event_type) params.set("event_type", filters.event_type);
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useSupabaseQuery(
    ["activity-logs", filters],
    () => api.get(`/activity-logs${qs}`)
  );
}
