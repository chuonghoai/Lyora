import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { AuthSession } from '../types/auth.types';

export type UseRefreshSessionMutationOptions = Omit<
  UseMutationOptions<AuthSession | null, unknown, boolean | void>,
  'mutationFn'
>;

export function useRefreshSessionMutation(options?: UseRefreshSessionMutationOptions) {
  return useMutation({
    ...options,
    mutationFn: async (force?: boolean | void) => {
      return authService.refreshSession(Boolean(force));
    },
  });
}
