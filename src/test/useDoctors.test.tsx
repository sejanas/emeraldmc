import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
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
  const qc = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDoctors(3), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.[0].name).toBe('Dr. One');
});
