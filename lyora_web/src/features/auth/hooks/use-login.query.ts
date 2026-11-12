import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { LoginCredentials, AuthSession } from '../types/auth.types';
import { authKeys } from './auth.keys';

export type UseLoginMutationOptions = Omit<
  UseMutationOptions<AuthSession, unknown, LoginCredentials>,
  'mutationFn'
>;

/**
 * Data Layer TanStack Query Mutation Hook for User Login.
 * Interacts with AuthService and invalidates relevant queries on success.
 */
export function useLoginMutation(options?: UseLoginMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (credentials: LoginCredentials) => {
      return authService.login(credentials);
    },
    onSuccess: (...args) => {
      // Invalidate active session queries
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
      options?.onSuccess?.(...args);
    },
  });
}
