import { useMutation } from '@tanstack/react-query';

export function useSupabaseMutation<TData = unknown, TError = Error, TVariables = void>(
  mutator: (vars: TVariables) => Promise<TData>,
  options?: Record<string, any>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: mutator,
    ...options,
  });
}

export default useSupabaseMutation;
