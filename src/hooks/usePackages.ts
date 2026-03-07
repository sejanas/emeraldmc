import { supabase } from "@/integrations/supabase/client";
import useSupabaseQuery from "./useSupabaseQuery";

interface PkgRow { id: string; name: string; description: string | null; original_price: number; discounted_price: number | null; is_popular: boolean; }
interface CatRow { id: string; name: string; }

export function usePackages() {
  return useSupabaseQuery<{ packages: PkgRow[]; categories: CatRow[]; testNames: Record<string, string[]> }>(['packages'], async () => {
    const [{ data: p, error: ep }, { data: c, error: ec }, { data: pt, error: ept }] = await Promise.all([
      supabase.from('packages').select('*').order('display_order'),
      supabase.from('test_categories').select('id, name'),
      supabase.from('package_tests').select('package_id, test_id, tests(name)'),
    ]);
    if (ep) throw ep;
    if (ec) throw ec;
    if (ept) throw ept;
    const map: Record<string, string[]> = {};
    (pt as any[] ?? []).forEach((r) => { (map[r.package_id] ??= []).push(r.tests?.name ?? ''); });
    return { packages: p ?? [], categories: c ?? [], testNames: map };
  });
}

export default usePackages;
