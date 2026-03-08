import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function useAdminUserAction(endpoint: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => {
      const body = typeof payload === 'string' ? { user_id: payload } : payload;
      return api.post(`/admin/${endpoint}`, body);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
