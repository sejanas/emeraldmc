import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

function TestComp() {
  const q = useDoctors(3);
  if (q.isLoading) return <div>loading</div>;
  if (q.isError) return <div>error</div>;
  return <div>loaded:{q.data?.[0].name}</div>;
}

test('useDoctors loads and shows data', async () => {
  const qc = new QueryClient();
  render(<QueryClientProvider client={qc}><TestComp /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByText(/loaded:Dr. One/)).toBeInTheDocument());
});
