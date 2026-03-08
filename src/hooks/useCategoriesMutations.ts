import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/categories', body),
    onMutate: async (body: any) => {
      await qc.cancelQueries({ queryKey: ['test_categories'] });
      const prev = qc.getQueryData(['test_categories']);
      const optimistic = { id: `optimistic-${Date.now()}`, ...body };
      qc.setQueryData(['test_categories'], (old: any) => [optimistic, ...(old ?? [])]);
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['test_categories'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['test_categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/categories/${id}`, body),
    onMutate: async ({ id, body }: { id: string; body: any }) => {
      await qc.cancelQueries({ queryKey: ['test_categories'] });
      const prev = qc.getQueryData(['test_categories']);
      qc.setQueryData(['test_categories'], (old: any) => (old ?? []).map((c: any) => (c.id === id ? { ...c, ...body } : c)));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['test_categories'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['test_categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/categories/${id}`),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['test_categories'] });
      const prev = qc.getQueryData(['test_categories']);
      qc.setQueryData(['test_categories'], (old: any) => (old ?? []).filter((c: any) => c.id !== id));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['test_categories'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['test_categories'] }),
  });
}

export default useCreateCategory;
