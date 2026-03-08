import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export default function useActivityLogs() {
  return useSupabaseQuery(["activity-logs"], () => api.get("/activity-logs"));
}
