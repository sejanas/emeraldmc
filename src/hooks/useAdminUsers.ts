import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export default function useAdminUsers() {
  return useSupabaseQuery(["admin", "users"], () => api.get("/admin/users"));
}
