import { QueryKey, useQuery } from '@tanstack/react-query';

export function useSupabaseQuery<TData = unknown, TError = Error>(
  key: QueryKey,
  fetcher: () => Promise<TData>,
  options?: Record<string, any>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: fetcher,
    retry: 2,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export default useSupabaseQuery;
