import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useBlogs(opts?: { all?: boolean; limit?: number }) {
  const params = new URLSearchParams();
  if (opts?.all) params.set("all", "true");
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({
    queryKey: ["blogs", opts?.all ? "all" : "published", opts?.limit ?? "all"],
    queryFn: () => api.get(`/blogs${qs}`),
    staleTime: 1000 * 60,
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post("/blogs", body),
    onSettled: () => qc.invalidateQueries({ queryKey: ["blogs"] }),
  });
}

export function useUpdateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      api.put(`/blogs/${id}`, body),
    onSettled: () => qc.invalidateQueries({ queryKey: ["blogs"] }),
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/blogs/${id}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ["blogs"] }),
  });
}

export default useBlogs;
