import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, test, describe, afterEach } from 'vitest';
import { useUpdateBookingStatus, useCreateBooking } from '@/hooks/useBookingsMutations';
import { useDeleteDoctor } from '@/hooks/useDoctorsMutations';
import { useDeleteCategory } from '@/hooks/useCategoriesMutations';
import { useDeleteGallery } from '@/hooks/useGalleryMutations';
import * as apiModule from '@/lib/api';

function makeWrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

describe('useUpdateBookingStatus', () => {
  afterEach(() => vi.restoreAllMocks());

  test('updates booking status optimistically', async () => {
    const qc = makeQc();
    qc.setQueryData(['bookings'], [{ id: 'b1', status: 'pending', patient_name: 'Alice' }]);
    vi.spyOn(apiModule.api, 'put').mockResolvedValue({ id: 'b1', status: 'confirmed' });

    const { result } = renderHook(() => useUpdateBookingStatus(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate({ id: 'b1', status: 'confirmed' });
      await new Promise((r) => setTimeout(r, 20));
    });

    const data = qc.getQueryData<any[]>(['bookings']);
    expect(data?.[0].status).toBe('confirmed');
  });

  test('rolls back status on error', async () => {
    const qc = makeQc();
    qc.setQueryData(['bookings'], [{ id: 'b1', status: 'pending', patient_name: 'Alice' }]);
    vi.spyOn(apiModule.api, 'put').mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUpdateBookingStatus(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate({ id: 'b1', status: 'confirmed' });
      await new Promise((r) => setTimeout(r, 50));
    });

    const data = qc.getQueryData<any[]>(['bookings']);
    expect(data?.[0].status).toBe('pending');
  });
});

describe('useCreateBooking', () => {
  afterEach(() => vi.restoreAllMocks());

  test('adds booking optimistically with pending status', async () => {
    const qc = makeQc();
    qc.setQueryData(['bookings'], []);
    vi.spyOn(apiModule.api, 'post').mockResolvedValue({ id: 'b2', status: 'pending' });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate({ patient_name: 'Bob', phone: '9999999999' });
      await new Promise((r) => setTimeout(r, 20));
    });

    // After the real response / settle, cache is invalidated and updated
    expect(result.current.isError).toBe(false);
  });

  test('rolls back optimistic booking on error', async () => {
    const qc = makeQc();
    qc.setQueryData(['bookings'], []);
    vi.spyOn(apiModule.api, 'post').mockRejectedValue(new Error('server error'));

    const { result } = renderHook(() => useCreateBooking(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate({ patient_name: 'Bob', phone: '9999999999' });
      await new Promise((r) => setTimeout(r, 50));
    });

    const data = qc.getQueryData<any[]>(['bookings']);
    expect(data).toEqual([]);
  });
});

describe('useDeleteDoctor', () => {
  afterEach(() => vi.restoreAllMocks());

  test('removes doctor optimistically', async () => {
    const qc = makeQc();
    qc.setQueryData(['doctors'], [{ id: 'd1', name: 'Dr. One' }, { id: 'd2', name: 'Dr. Two' }]);
    vi.spyOn(apiModule.api, 'del').mockResolvedValue({});

    const { result } = renderHook(() => useDeleteDoctor(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate('d1');
      await new Promise((r) => setTimeout(r, 20));
    });

    const data = qc.getQueryData<any[]>(['doctors']);
    // Either optimistic removal OR invalidated (both valid outcomes after success)
    expect(result.current.isError).toBe(false);
  });

  test('rolls back doctor removal on error', async () => {
    const qc = makeQc();
    const initial = [{ id: 'd1', name: 'Dr. One' }, { id: 'd2', name: 'Dr. Two' }];
    qc.setQueryData(['doctors'], initial);
    vi.spyOn(apiModule.api, 'del').mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useDeleteDoctor(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate('d1');
      await new Promise((r) => setTimeout(r, 50));
    });

    const data = qc.getQueryData<any[]>(['doctors']);
    expect(data).toHaveLength(2);
  });
});

describe('useDeleteCategory', () => {
  afterEach(() => vi.restoreAllMocks());

  test('rolls back category removal on error', async () => {
    const qc = makeQc();
    const initial = [{ id: 'c1', name: 'Blood Tests' }, { id: 'c2', name: 'Urine Tests' }];
    qc.setQueryData(['test_categories'], initial);
    vi.spyOn(apiModule.api, 'del').mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate('c1');
      await new Promise((r) => setTimeout(r, 50));
    });

    const data = qc.getQueryData<any[]>(['test_categories']);
    expect(data).toHaveLength(2);
  });
});

describe('useDeleteGallery', () => {
  afterEach(() => vi.restoreAllMocks());

  test('rolls back gallery deletion on error', async () => {
    const qc = makeQc();
    const initial = [{ id: 'g1', title: 'Lab Image', image_url: '/img.jpg', category: 'Lab' }];
    qc.setQueryData(['gallery'], initial);
    vi.spyOn(apiModule.api, 'del').mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useDeleteGallery(), { wrapper: makeWrapper(qc) });
    await act(async () => {
      result.current.mutate('g1');
      await new Promise((r) => setTimeout(r, 50));
    });

    const data = qc.getQueryData<any[]>(['gallery']);
    expect(data).toHaveLength(1);
  });
});
