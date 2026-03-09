import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCertifications() {
  return useQuery({
    queryKey: ["certifications"],
    queryFn: () => api.get("/certifications"),
    staleTime: 1000 * 60,
  });
}

export function useCreateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/certifications", body),
    onSettled: () => qc.invalidateQueries({ queryKey: ["certifications"] }),
  });
}

export function useUpdateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      api.put(`/certifications/${id}`, body),
    onSettled: () => qc.invalidateQueries({ queryKey: ["certifications"] }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/certifications/${id}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ["certifications"] }),
  });
}

export default useCertifications;
