import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDoctors from '@/hooks/useDoctors';

vi.mock('@/lib/api', () => ({
  api: {
    get: (_path: string) =>
      Promise.resolve([
        { id: 'd1', name: 'Dr. One', specialization: 'Pathology', profile_image: null },
      ]),
  },
}));

test('useDoctors loads and shows data', async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDoctors(3), { wrapper });
  await vi.waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  expect(result.current.data?.[0].name).toBe('Dr. One');
});
