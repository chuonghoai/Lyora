import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { authKeys } from './auth.keys';

export type UseLogoutMutationOptions = Omit<
  UseMutationOptions<void, unknown, void>,
  'mutationFn'
>;

/**
 * Data Layer TanStack Query Mutation Hook for User Logout.
 * Clears query cache and cleans up session tokens.
 */
export function useLogoutMutation(options?: UseLogoutMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: (...args) => {
      // Invalidate or clear auth cache
      queryClient.removeQueries({ queryKey: authKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
