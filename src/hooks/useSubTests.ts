import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubTests, createSubTest, updateSubTest, deleteSubTest } from '@/lib/api';

export function useSubTests(testId: string | null) {
  return useQuery({
    queryKey: ['sub-tests', testId],
    queryFn: () => getSubTests(testId!),
    enabled: !!testId,
    staleTime: 1000 * 60,
  });
}

export function useCreateSubTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => createSubTest(body),
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['sub-tests', vars.test_id] });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}

export function useUpdateSubTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) => updateSubTest(id, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['sub-tests'] });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}

export function useDeleteSubTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubTest(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['sub-tests'] });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}
