import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localStorageService, useAuthStore } from "@/core";
import { friendsService } from "../services/friends.service";
import { friendsKeys } from "./friends.keys";

const SENT_FRIEND_REQUESTS_STORAGE_PREFIX = "lyora_sent_friend_requests";

interface SentFriendRequestRecord {
  userId: string;
  requestedAt: string;
}

function sentRequestsStorageKey(currentUserId?: string): string {
  return `${SENT_FRIEND_REQUESTS_STORAGE_PREFIX}:${currentUserId ?? "anonymous"}`;
}

export function getSentFriendRequests(
  currentUserId?: string,
): SentFriendRequestRecord[] {
  return (
    localStorageService.getItem<SentFriendRequestRecord[]>(
      sentRequestsStorageKey(currentUserId),
    ) ?? []
  );
}

function rememberSentFriendRequest(targetUserId: string) {
  const currentUserId = useAuthStore.getState().user?.id;
  const existing = getSentFriendRequests(currentUserId);
  const records = [
    { userId: targetUserId, requestedAt: new Date().toISOString() },
    ...existing.filter((record) => record.userId !== targetUserId),
  ].slice(0, 30);
  localStorageService.setItem(sentRequestsStorageKey(currentUserId), records);
}

function invalidateFriendData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: friendsKeys.all });
  void queryClient.invalidateQueries({ queryKey: ["users", "profile-page"] });
  void queryClient.invalidateQueries({
    queryKey: ["users", "friends-directory"],
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
    refetchOnMount: "always",
  });
}

export function useReceivedFriendRequestsQuery() {
  return useQuery({
    queryKey: friendsKeys.receivedRequests(),
    queryFn: () => friendsService.getReceivedRequests(),
    staleTime: 30_000,
  });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsService.sendRequest(userId),
    onSuccess: (_, userId) => {
      rememberSentFriendRequest(userId);
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
