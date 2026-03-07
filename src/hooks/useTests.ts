import { supabase } from "@/integrations/supabase/client";
import useSupabaseQuery from "./useSupabaseQuery";

interface TestRow { id: string; name: string; price: number; report_time: string; sample_type: string; category_id: string | null; }

export function useTests(limit?: number) {
  return useSupabaseQuery<TestRow[]>(['tests', limit], async () => {
    let q = supabase.from('tests').select('id, name, price, report_time, sample_type, category_id').eq('is_active', true).order('display_order');
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  });
}

export default useTests;
