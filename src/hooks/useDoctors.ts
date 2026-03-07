import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export function useDoctors(limit?: number) {
  return useSupabaseQuery(["doctors", limit], () =>
    api.get(`/doctors${limit ? `?limit=${limit}` : ""}`)
  );
}

export default useDoctors;
