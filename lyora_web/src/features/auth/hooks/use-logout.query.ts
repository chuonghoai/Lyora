import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { authKeys } from './auth.keys';

export type UseLogoutMutationOptions = Omit<
  UseMutationOptions<void, unknown, void>,
  'mutationFn'
>;

export function useLogoutMutation(options?: UseLogoutMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async () => {
      await authService.logout();
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
    onSuccess: (...args) => {
      options?.onSuccess?.(...args);
    },
  });
}
