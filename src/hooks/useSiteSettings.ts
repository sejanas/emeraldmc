import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSiteSettings(key?: string) {
  const qs = key ? `?key=${key}` : "";
  return useQuery({
    queryKey: ["settings", key ?? "all"],
    queryFn: () => api.get(`/settings${qs}`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { key: string; value: any }) =>
      api.put("/settings", data),
    onSettled: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export default useSiteSettings;
