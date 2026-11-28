import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';

export type UseLogoutMutationOptions = Omit<
  UseMutationOptions<void, unknown, void>,
  'mutationFn'
>;

export function useLogoutMutation(options?: UseLogoutMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async () => {
      try {
        await authService.logout();
      } finally {
        await queryClient.cancelQueries();
        queryClient.clear();
      }
    },
    onSettled: (...args) => {
      queryClient.clear();
      options?.onSettled?.(...args);
    },
    onSuccess: (...args) => {
      options?.onSuccess?.(...args);
    },
  });
}
