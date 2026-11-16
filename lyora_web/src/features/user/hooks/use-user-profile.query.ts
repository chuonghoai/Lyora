import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '@/core';
import { userService } from '../services/user.service';
import type { UpdateUserProfilePayload, UserProfile } from '../types/user.types';
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

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) => userService.updateProfile(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
      useAuthStore.getState().updateUser(updatedProfile);
    },
  });
}

