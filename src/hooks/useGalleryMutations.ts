import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/gallery', body),
    onMutate: async (body: any) => {
      await qc.cancelQueries({ queryKey: ['gallery'] });
      const prev = qc.getQueryData(['gallery']);
      const optimistic = { id: `optimistic-${Date.now()}`, ...body };
      qc.setQueryData(['gallery'], (old: any) => [optimistic, ...(old ?? [])]);
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['gallery'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useUpdateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/gallery/${id}`, body),
    onMutate: async ({ id, body }: { id: string; body: any }) => {
      await qc.cancelQueries({ queryKey: ['gallery'] });
      const prev = qc.getQueryData(['gallery']);
      qc.setQueryData(['gallery'], (old: any) => (old ?? []).map((g: any) => (g.id === id ? { ...g, ...body } : g)));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['gallery'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useDeleteGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/gallery/${id}`),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['gallery'] });
      const prev = qc.getQueryData(['gallery']);
      qc.setQueryData(['gallery'], (old: any) => (old ?? []).filter((g: any) => g.id !== id));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['gallery'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export default useCreateGallery;
