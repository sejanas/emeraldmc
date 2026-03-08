import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export function useBookingUpdates(bookingId: string | null) {
  return useSupabaseQuery(
    ["booking-updates", bookingId],
    () => api.get(`/bookings/${bookingId}/updates`),
    { enabled: !!bookingId }
  );
}

export function usePatientHistory(phone: string | null, name?: string | null) {
  const params = new URLSearchParams();
  if (phone) params.set("phone", phone);
  if (name) params.set("name", name);
  return useSupabaseQuery(
    ["patient-history", phone, name],
    () => api.get(`/bookings/patient-history?${params.toString()}`),
    { enabled: !!phone }
  );
}
