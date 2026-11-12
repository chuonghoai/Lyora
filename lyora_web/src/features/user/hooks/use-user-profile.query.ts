import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type { UserProfile } from '../types/user.types';
import { userKeys } from './user.keys';

export type UseUserProfileOptions = Omit<
  UseQueryOptions<UserProfile, unknown, UserProfile, readonly ['users', 'profile']>,
  'queryKey' | 'queryFn'
>;

/**
 * Data Layer TanStack Query Hook for fetching authenticated User Profile.
 */
export function useUserProfileQuery(options?: UseUserProfileOptions) {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userService.getProfile(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

