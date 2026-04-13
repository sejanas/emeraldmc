import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export function useHeroSlides(activeOnly = false) {
  return useSupabaseQuery(["hero_slides", { activeOnly }], async () => {
    const data = await api.get("/hero-slides" + (activeOnly ? "?active=true&order=display_order" : ""));
    return activeOnly ? data.filter((s: any) => s.is_active && !s.deleted_at) : data;
  });
}

export default useHeroSlides;
