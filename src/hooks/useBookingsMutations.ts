import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post('/bookings', body),
    onMutate: async (body: any) => {
      await qc.cancelQueries({ queryKey: ['bookings'] });
      const prev = qc.getQueryData(['bookings']);
      const optimistic = { id: `optimistic-${Date.now()}`, status: 'pending', ...body };
      qc.setQueryData(['bookings'], (old: any) => [optimistic, ...(old ?? [])]);
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['bookings'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/bookings/${id}/status`, { status }),
    onMutate: async ({ id, status }: { id: string; status: string }) => {
      await qc.cancelQueries({ queryKey: ['bookings'] });
      const prev = qc.getQueryData(['bookings']);
      qc.setQueryData(['bookings'], (old: any) => (old ?? []).map((b: any) => (b.id === id ? { ...b, status } : b)));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['bookings'], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export default useCreateBooking;
