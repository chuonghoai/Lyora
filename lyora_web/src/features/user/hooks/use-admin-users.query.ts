import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type { AdminUsersQueryParams, LockUserPayload } from '../types/user.types';
import { userKeys } from './user.keys';

export function useAdminUsersQuery(params: AdminUsersQueryParams) {
  const normalized: AdminUsersQueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    search: params.search?.trim() || undefined,
    role: params.role ?? 'ALL',
    status: params.status ?? 'ALL',
    online: params.online ?? 'ALL',
    sortBy: params.sortBy ?? 'createdAt',
    sortOrder: params.sortOrder ?? 'DESC',
  };

  return useQuery({
    queryKey: userKeys.adminList(normalized),
    queryFn: () => userService.getAdminUsers(normalized),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useAdminUsersOnlineStatusQuery(
  userIds: string[],
  options?: { enabled?: boolean; refetchIntervalMs?: number },
) {
  const normalizedIds = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const idsKey = normalizedIds.join(',');

  return useQuery({
    queryKey: userKeys.onlineStatuses(idsKey),
    queryFn: () => userService.getUsersOnlineStatus(normalizedIds),
    enabled: (options?.enabled ?? true) && normalizedIds.length > 0,
    staleTime: 0,
    refetchInterval: options?.refetchIntervalMs ?? 15_000,
    refetchIntervalInBackground: false,
    refetchOnMount: 'always',
  });
}

export function useAdminUserDetailQuery(userId?: string) {
  const normalizedId = userId?.trim() ?? '';

  return useQuery({
    queryKey: userKeys.adminDetail(normalizedId),
    queryFn: () => userService.getAdminUserDetail(normalizedId),
    enabled: Boolean(normalizedId),
    staleTime: 30 * 1000,
  });
}

export function useLockUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: LockUserPayload }) =>
      userService.lockUser(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUnlockUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.unlockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
