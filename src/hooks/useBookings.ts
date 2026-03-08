import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export default function useBookings() {
  return useSupabaseQuery(["bookings"], () => api.get("/bookings"));
}
