import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export default function useGallery() {
  return useSupabaseQuery(["gallery"], () => api.get("/gallery"));
}
