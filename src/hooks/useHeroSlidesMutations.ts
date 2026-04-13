import useSupabaseMutation from "./useSupabaseMutation";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useHeroSlidesMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["hero_slides"] });

  const create = useSupabaseMutation(
    (body: any) => api.post("/hero-slides", body),
    { onSuccess: () => { invalidate(); toast({ title: "Hero slide created" }); } }
  );

  const update = useSupabaseMutation(
    ({ id, ...body }: any) => api.put(`/hero-slides/${id}`, body),
    { onSuccess: () => { invalidate(); toast({ title: "Hero slide updated" }); } }
  );

  const remove = useSupabaseMutation(
    (id: string) => api.del(`/hero-slides/${id}`),
    { onSuccess: () => { invalidate(); toast({ title: "Hero slide deleted" }); } }
  );

  return { create, update, remove };
}

export default useHeroSlidesMutations;
