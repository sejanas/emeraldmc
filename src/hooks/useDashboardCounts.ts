import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export default function useDashboardCounts() {
  return useSupabaseQuery(["dashboard", "counts"], () => api.get("/dashboard/counts"));
}
