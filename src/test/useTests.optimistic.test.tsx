import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, expect, test } from 'vitest';
import useTests, { useDeleteTest } from '@/hooks/useTests';
import * as api from '@/lib/api';

test('useDeleteTest rolls back on error (optimistic)', async () => {
  const qc = new QueryClient();
  const initial = [{ id: 't1', name: 'Test 1' }];
  qc.setQueryData(['tests', 'active', 'all'], initial);

  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

  // mock deleteTest to reject
  const deleteSpy = vi.spyOn(api, 'deleteTest').mockRejectedValue(new Error('boom'));

  const { result } = renderHook(() => useDeleteTest(), { wrapper });

  await act(async () => {
    result.current.mutate('t1');
    // Wait for mutation to settle
    await new Promise((r) => setTimeout(r, 50));
  });

  // After failed mutation, cache should have been rolled back to initial
  const after = qc.getQueryData(['tests', 'active', 'all']);
  expect(after).toEqual(initial);

  deleteSpy.mockRestore();
});
