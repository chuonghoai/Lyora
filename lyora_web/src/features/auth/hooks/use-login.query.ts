import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { LoginCredentials, AuthSession } from '../types/auth.types';
import { authKeys } from './auth.keys';

export type UseLoginMutationOptions = Omit<
  UseMutationOptions<AuthSession, unknown, LoginCredentials>,
  'mutationFn'
>;

export function useLoginMutation(options?: UseLoginMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (credentials: LoginCredentials) => {
      return authService.login(credentials);
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
      options?.onSuccess?.(...args);
    },
  });
}
