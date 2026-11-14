import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type { UserStatistics } from '../types/user.types';
import { userKeys } from './user.keys';

export type UseUserStatisticsOptions = Omit<
  UseQueryOptions<UserStatistics, unknown, UserStatistics, readonly ['users', 'statistics']>,
  'queryKey' | 'queryFn'
>;

/**
 * Data Layer TanStack Query Hook for fetching User Statistics (Admin only).
 */
export function useUserStatisticsQuery(options?: UseUserStatisticsOptions) {
  return useQuery({
    queryKey: userKeys.statistics(),
    queryFn: () => userService.getStatistics(),
    staleTime: 60 * 1000,
    ...options,
  });
}

