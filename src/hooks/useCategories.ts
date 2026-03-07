import { supabase } from "@/integrations/supabase/client";
import useSupabaseQuery from "./useSupabaseQuery";

type Category = any;

export function useCategories() {
  return useSupabaseQuery<Category[]>(['test_categories'], async () => {
    const { data, error } = await supabase.from('test_categories').select('*').order('display_order');
    if (error) throw error;
    return data ?? [];
  });
}

export default useCategories;
