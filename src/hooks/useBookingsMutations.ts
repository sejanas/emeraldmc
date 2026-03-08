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
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.put(`/bookings/${id}/status`, { status, reason }),
    onMutate: async ({ id, status }: { id: string; status: string }) => {
      await qc.cancelQueries({ queryKey: ['bookings'] });
      const prev = qc.getQueryData(['bookings']);
      qc.setQueryData(['bookings'], (old: any) => (old ?? []).map((b: any) => (b.id === id ? { ...b, status } : b)));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) qc.setQueryData(['bookings'], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking-updates'] });
    },
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      api.put('/bookings/bulk-status', { ids, status }),
    onMutate: async ({ ids, status }: { ids: string[]; status: string }) => {
      await qc.cancelQueries({ queryKey: ['bookings'] });
      const prev = qc.getQueryData(['bookings']);
      qc.setQueryData(['bookings'], (old: any) =>
        (old ?? []).map((b: any) => ids.includes(b.id) ? { ...b, status } : b)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(['bookings'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking-updates'] });
    },
  });
}

export function useAddBookingUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: any }) =>
      api.post(`/bookings/${id}/updates`, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking-updates'] });
    },
  });
}

export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; preferred_date?: string; preferred_time?: string; reason?: string }) =>
      api.put(`/bookings/${id}/reschedule`, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking-updates'] });
    },
  });
}

export function useUpdateBookingInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; patient_id?: string; extra_phones?: string[]; notes?: string }) =>
      api.put(`/bookings/${id}/info`, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking-updates'] });
    },
  });
}

export default useCreateBooking;
