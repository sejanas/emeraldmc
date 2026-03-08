import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/doctors', body),
    onMutate: async (body: any) => {
      await qc.cancelQueries({ queryKey: ['doctors'] });
      const prev = qc.getQueryData(['doctors']);
      const optimistic = { id: `optimistic-${Date.now()}`, ...body };
      qc.setQueryData(['doctors'], (old: any) => [optimistic, ...(old ?? [])]);
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['doctors'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/doctors/${id}`, body),
    onMutate: async ({ id, body }: { id: string; body: any }) => {
      await qc.cancelQueries({ queryKey: ['doctors'] });
      const prev = qc.getQueryData(['doctors']);
      qc.setQueryData(['doctors'], (old: any) => (old ?? []).map((d: any) => (d.id === id ? { ...d, ...body } : d)));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['doctors'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/doctors/${id}`),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['doctors'] });
      const prev = qc.getQueryData(['doctors']);
      qc.setQueryData(['doctors'], (old: any) => (old ?? []).filter((d: any) => d.id !== id));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['doctors'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export default useCreateDoctor;
