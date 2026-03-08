import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useTests from '@/hooks/useTests';

vi.mock('@/lib/api', () => ({
  api: {
    get: (_path: string) =>
      Promise.resolve([
        { id: 't1', name: 'Test 1', price: 100, report_time: 'Same Day', sample_type: 'Blood', category_id: null },
      ]),
  },
}));

function TestComp() {
  const q = useTests(6);
  if (q.isLoading) return <div>loading</div>;
  if (q.isError) return <div>error</div>;
  return <div>loaded:{q.data?.[0].name}</div>;
}

test('useTests loads and shows data', async () => {
  const qc = new QueryClient();
  render(<QueryClientProvider client={qc}><TestComp /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByText(/loaded:Test 1/)).toBeInTheDocument());
});
