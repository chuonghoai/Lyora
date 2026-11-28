import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsService } from '../services/friends.service';
import { friendsKeys } from './friends.keys';

function invalidateFriendData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: friendsKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['users', 'profile-page'] });
  void queryClient.invalidateQueries({
    queryKey: ['users', 'friends-directory'],
  });
}

export function useFriendSearchQuery(query: string) {
  const normalizedQuery = query.trim();
  return useQuery({
    queryKey: friendsKeys.search(normalizedQuery),
    queryFn: () => friendsService.search(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
    staleTime: 30_000,
  });
}

export function useAcceptedFriendsQuery() {
  return useQuery({
    queryKey: friendsKeys.accepted(),
    queryFn: () => friendsService.getAcceptedFriends(),
    staleTime: 30_000,
    refetchInterval: 3_000,
    refetchOnMount: 'always',
  });
}

export function useReceivedFriendRequestsQuery() {
  return useQuery({
    queryKey: friendsKeys.receivedRequests(),
    queryFn: () => friendsService.getReceivedRequests(),
    staleTime: 30_000,
    refetchInterval: 3_000,
  });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsService.sendRequest(userId),
    onSuccess: () => {
      invalidateFriendData(queryClient);
    },
  });
}

export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsService.acceptRequest.bind(friendsService),
    onSuccess: () => invalidateFriendData(queryClient),
  });
}

export function useRemoveFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsService.removeRequest.bind(friendsService),
    onSuccess: () => invalidateFriendData(queryClient),
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsService.unfriend.bind(friendsService),
    onSuccess: () => invalidateFriendData(queryClient),
  });
}
