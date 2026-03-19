import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPackages, createPackage, updatePackage, deletePackage } from '@/lib/api';

export interface PkgRow {
  id: string;
  name: string;
  description: string | null;
  original_price: number;
  discounted_price: number | null;
  is_popular: boolean;
}

export function usePackages(includeInactive = false) {
  return useQuery({
    queryKey: ['packages', { includeInactive }],
    queryFn: () => getPackages(includeInactive),
    staleTime: 1000 * 60,
    retry: 2,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => createPackage(body),
    onMutate: async (body: any) => {
      await qc.cancelQueries({ queryKey: ['packages'] });
      const prev = qc.getQueryData(['packages']);
      const optimistic = { id: `optimistic-${Date.now()}`, ...body };
      if (prev) qc.setQueryData(['packages'], (old: any) => [optimistic, ...(old?.packages ?? [])]);
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['packages'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) => updatePackage(id, body),
    onMutate: async ({ id, ...body }: { id: string } & Record<string, any>) => {
      await qc.cancelQueries({ queryKey: ['packages'] });
      const prev = qc.getQueryData(['packages']);
      if (prev) qc.setQueryData(['packages'], (old: any) => ({ ...old, packages: (old.packages ?? []).map((p: any) => (p.id === id ? { ...p, ...body } : p)) }));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['packages'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['packages'] });
      const prev = qc.getQueryData(['packages']);
      if (prev) qc.setQueryData(['packages'], (old: any) => ({ ...old, packages: (old.packages ?? []).filter((p: any) => p.id !== id) }));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['packages'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export default usePackages;
