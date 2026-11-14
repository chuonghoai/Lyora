import { keepPreviousData, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type { UserRoleFilter, UserStatistics } from '../types/user.types';
import { userKeys } from './user.keys';

export type UseUserStatisticsOptions = Omit<
  UseQueryOptions<
    UserStatistics,
    unknown,
    UserStatistics,
    ReturnType<typeof userKeys.statistics>
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Data Layer TanStack Query Hook for fetching User Statistics (Admin only).
 */
export function useUserStatisticsQuery(
  roleFilter: UserRoleFilter = 'ALL',
  options?: UseUserStatisticsOptions,
) {
  const apiRole = roleFilter === 'ALL' ? undefined : roleFilter;

  return useQuery({
    queryKey: userKeys.statistics(roleFilter),
    queryFn: () => userService.getStatistics(apiRole),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

