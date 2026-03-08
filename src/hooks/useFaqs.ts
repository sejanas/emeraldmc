import useSupabaseQuery from "./useSupabaseQuery";
import useSupabaseMutation from "./useSupabaseMutation";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useFaqs(activeOnly = false) {
  return useSupabaseQuery(["faqs", { activeOnly }], async () => {
    const data = await api.get("/faqs" + (activeOnly ? "?active=true" : ""));
    return activeOnly ? data.filter((f: any) => f.is_active && !f.deleted_at) : data;
  });
}

export function useFaqsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["faqs"] });

  const create = useSupabaseMutation(
    (body: any) => api.post("/faqs", body),
    { onSuccess: () => { invalidate(); toast({ title: "FAQ created" }); } }
  );

  const update = useSupabaseMutation(
    ({ id, ...body }: any) => api.put(`/faqs/${id}`, body),
    { onSuccess: () => { invalidate(); toast({ title: "FAQ updated" }); } }
  );

  const remove = useSupabaseMutation(
    (id: string) => api.del(`/faqs/${id}`),
    { onSuccess: () => { invalidate(); toast({ title: "FAQ deleted" }); } }
  );

  return { create, update, remove };
}

export default useFaqs;
