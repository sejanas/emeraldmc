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

export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages(),
    staleTime: 1000 * 60,
    retry: 2,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => createPackage(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) => updatePackage(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
}

export default usePackages;
