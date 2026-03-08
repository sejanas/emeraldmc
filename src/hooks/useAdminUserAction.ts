import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function useAdminUserAction(endpoint: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (user_id: string) => api.post(`/admin/${endpoint}`, { user_id }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
