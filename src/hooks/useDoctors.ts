import { supabase } from "@/integrations/supabase/client";
import useSupabaseQuery from "./useSupabaseQuery";

interface Doctor { id: string; name: string; specialization: string; qualification?: string | null; bio?: string | null; profile_image?: string | null; experience_years?: number | null }

export function useDoctors(limit?: number) {
  return useSupabaseQuery<Doctor[]>(['doctors', limit], async () => {
    let q = supabase.from('doctors').select('*').order('display_order');
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  });
}

export default useDoctors;
