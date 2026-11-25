import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, type UserProfile } from '@/core';
import { profileService } from '../services/profile.service';
import type { PublicUserProfile, UpdateExtendedProfilePayload } from '../types/user.types';
import { userKeys } from './user.keys';

export function useProfilePageQuery(userId?: string) {
  const normalizedId = userId?.trim() || 'me';
  return useQuery({
    queryKey: userKeys.profilePage(normalizedId),
    queryFn: () => profileService.getProfileById(normalizedId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useProfileFriendsDirectoryQuery() {
  return useQuery({
    queryKey: userKeys.friendsDirectory(),
    queryFn: () => profileService.getFriendsDirectory(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useProfileActivityQuery(userId?: string) {
  const normalizedId = userId?.trim() || 'me';
  return useQuery({
    queryKey: userKeys.profileActivity(normalizedId),
    queryFn: () => profileService.getProfileActivity(normalizedId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdateExtendedProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateExtendedProfilePayload) => profileService.updateMyProfile(payload),
    onSuccess: (updatedProfile: PublicUserProfile) => {
      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser) {
        const syncedAuthUser: UserProfile = {
          ...currentAuthUser,
          fullName: updatedProfile.fullName,
          phoneNumber: updatedProfile.phoneNumber ?? null,
          bio: updatedProfile.bio ?? null,
          location: updatedProfile.location ?? null,
          avatarUrl: updatedProfile.avatarUrl ?? null,
        };
        useAuthStore.getState().updateUser(syncedAuthUser);
        queryClient.setQueryData(userKeys.profile(), syncedAuthUser);
      }

      queryClient.setQueryData(userKeys.profilePage('me'), updatedProfile);
      queryClient.setQueryData(userKeys.profilePage(updatedProfile.id), updatedProfile);
      void queryClient.invalidateQueries({ queryKey: userKeys.friendsDirectory() });
    },
  });
}

function invalidateFriendshipRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedProfile: PublicUserProfile,
) {
  queryClient.setQueryData(userKeys.profilePage(updatedProfile.id), updatedProfile);
  void queryClient.invalidateQueries({ queryKey: userKeys.profilePage('me') });
  void queryClient.invalidateQueries({ queryKey: userKeys.friendsDirectory() });
  void queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'profile-page'] });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => profileService.sendFriendRequest(userId),
    onSuccess: (updated) => invalidateFriendshipRelatedQueries(queryClient, updated),
  });
}

export function useCancelFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => profileService.cancelFriendRequest(userId),
    onSuccess: (updated) => invalidateFriendshipRelatedQueries(queryClient, updated),
  });
}

export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => profileService.acceptFriendRequest(userId),
    onSuccess: (updated) => invalidateFriendshipRelatedQueries(queryClient, updated),
  });
}

export function useRejectFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => profileService.rejectFriendRequest(userId),
    onSuccess: (updated) => invalidateFriendshipRelatedQueries(queryClient, updated),
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => profileService.unfriend(userId),
    onSuccess: (updated) => invalidateFriendshipRelatedQueries(queryClient, updated),
  });
}
