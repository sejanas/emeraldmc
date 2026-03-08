import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTests, createTest, updateTest, deleteTest } from '@/lib/api';

export interface TestRow {
  id: string;
  name: string;
  price: number;
  report_time: string;
  sample_type: string;
  category_id: string | null;
}

export function useTests(opts?: { active?: boolean; limit?: number }) {
  const active = opts?.active ?? true;
  const limit = opts?.limit;
  const params: Record<string, string | number | boolean> = { active };
  if (limit) params.limit = limit;
  return useQuery({
    queryKey: ['tests', active ? 'active' : 'all', limit ?? 'all'],
    queryFn: () => getTests(params),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    placeholderData: (prev: any) => prev,
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => createTest(body),
    onMutate: async (body: any) => {
      await qc.cancelQueries({ queryKey: ['tests'] });
      const prevActive = qc.getQueryData(['tests', 'active', 'all']);
      const prevAll = qc.getQueryData(['tests', 'all', 'all']);
      // optimistic id placeholder
      const optimistic = { id: `optimistic-${Date.now()}`, ...body };
      if (prevActive) {
        qc.setQueryData(['tests', 'active', 'all'], (old: any) => [optimistic, ...(old ?? [])]);
      }
      if (prevAll) {
        qc.setQueryData(['tests', 'all', 'all'], (old: any) => [optimistic, ...(old ?? [])]);
      }
      return { prevActive, prevAll };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prevActive) qc.setQueryData(['tests', 'active', 'all'], context.prevActive);
      if (context?.prevAll) qc.setQueryData(['tests', 'all', 'all'], context.prevAll);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) => updateTest(id, body),
    onMutate: async ({ id, ...body }: { id: string } & Record<string, any>) => {
      await qc.cancelQueries({ queryKey: ['tests'] });
      const prevActive = qc.getQueryData(['tests', 'active', 'all']);
      const prevAll = qc.getQueryData(['tests', 'all', 'all']);
      if (prevActive) {
        qc.setQueryData(['tests', 'active', 'all'], (old: any) => (old ?? []).map((t: any) => (t.id === id ? { ...t, ...body } : t)));
      }
      if (prevAll) {
        qc.setQueryData(['tests', 'all', 'all'], (old: any) => (old ?? []).map((t: any) => (t.id === id ? { ...t, ...body } : t)));
      }
      return { prevActive, prevAll };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prevActive) qc.setQueryData(['tests', 'active', 'all'], context.prevActive);
      if (context?.prevAll) qc.setQueryData(['tests', 'all', 'all'], context.prevAll);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['tests'] });
      const prevActive = qc.getQueryData(['tests', 'active', 'all']);
      const prevAll = qc.getQueryData(['tests', 'all', 'all']);
      if (prevActive) qc.setQueryData(['tests', 'active', 'all'], (old: any) => (old ?? []).filter((t: any) => t.id !== id));
      if (prevAll) qc.setQueryData(['tests', 'all', 'all'], (old: any) => (old ?? []).filter((t: any) => t.id !== id));
      return { prevActive, prevAll };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prevActive) qc.setQueryData(['tests', 'active', 'all'], context.prevActive);
      if (context?.prevAll) qc.setQueryData(['tests', 'all', 'all'], context.prevAll);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export default useTests;
