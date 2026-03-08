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

export function useTests(limit?: number) {
  const params: Record<string, string | number | boolean> = { active: true };
  if (limit) params.limit = limit;
  return useQuery({
    queryKey: ['tests', limit ?? 'all'],
    queryFn: () => getTests(params),
    staleTime: 1000 * 60,
    retry: 2,
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => createTest(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) => updateTest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export default useTests;
