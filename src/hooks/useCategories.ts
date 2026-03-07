import useSupabaseQuery from "./useSupabaseQuery";
import { api } from "@/lib/api";

export function useCategories() {
  return useSupabaseQuery(["test_categories"], () =>
    api.get("/categories")
  );
}

export default useCategories;
