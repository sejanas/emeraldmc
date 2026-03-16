import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useTests from '@/hooks/useTests';

vi.mock('@/lib/api', () => ({
  getTests: (_params: any) =>
    Promise.resolve([
      { id: 't1', name: 'Test 1', price: 100, report_time: 'Same Day', sample_type: 'Blood', category_id: null },
    ]),
}));

test('useTests loads and shows data', async () => {
  const qc = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTests({ limit: 6 }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.[0].name).toBe('Test 1');
});
