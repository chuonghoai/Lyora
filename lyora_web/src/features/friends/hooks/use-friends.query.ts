import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { localStorageService, useAuthStore } from "@/core";
import { friendsService } from "../services/friends.service";
import { friendsKeys } from "./friends.keys";
import type {
  FriendDiscoveryItem,
  FriendSearchResult,
} from "../types/friend.types";

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

function invalidateFriendData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: friendsKeys.accepted() });
  void queryClient.invalidateQueries({
    queryKey: friendsKeys.receivedRequests(),
  });
  void queryClient.invalidateQueries({ queryKey: friendsKeys.suggestions() });
  void queryClient.invalidateQueries({ queryKey: ["users", "profile-page"] });
  void queryClient.invalidateQueries({
    queryKey: ["users", "friends-directory"],
  });
}

export function updateFriendSearchStatus(
  queryClient: QueryClient,
  userId: string,
  friendshipStatus: FriendDiscoveryItem["friendshipStatus"],
): void {
  queryClient.setQueriesData<FriendSearchResult>(
    { queryKey: friendsKeys.searches() },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === userId ? { ...item, friendshipStatus } : item,
            ),
          }
        : current,
  );
}

export function updateFriendSuggestionStatus(
  queryClient: QueryClient,
  userId: string,
  friendshipStatus: FriendDiscoveryItem["friendshipStatus"],
): void {
  queryClient.setQueryData<FriendDiscoveryItem[]>(
    friendsKeys.suggestions(),
    (current) =>
      current?.map((item) =>
        item.id === userId ? { ...item, friendshipStatus } : item,
      ),
  );
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

export function useFriendSuggestionsQuery() {
  return useQuery({
    queryKey: friendsKeys.suggestions(),
    queryFn: () => friendsService.getSuggestions(),
    staleTime: 30_000,
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
    onMutate: (userId) => {
      updateFriendSuggestionStatus(queryClient, userId, "REQUEST_SENT");
      updateFriendSearchStatus(queryClient, userId, "REQUEST_SENT");
    },
    onSuccess: (_, userId) => {
      rememberSentFriendRequest(userId);
      invalidateFriendData(queryClient);
    },
    onError: () =>
      void queryClient.invalidateQueries({ queryKey: friendsKeys.searches() }),
  });
}

export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsService.acceptRequest(userId),
    onMutate: (userId) => {
      updateFriendSuggestionStatus(queryClient, userId, "FRIEND");
      updateFriendSearchStatus(queryClient, userId, "FRIEND");
    },
    onSuccess: () => invalidateFriendData(queryClient),
    onError: () =>
      void queryClient.invalidateQueries({ queryKey: friendsKeys.searches() }),
  });
}

export function useRemoveFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsService.removeRequest(userId),
    onMutate: (userId) => {
      updateFriendSuggestionStatus(queryClient, userId, "NONE");
      updateFriendSearchStatus(queryClient, userId, "NONE");
    },
    onSuccess: () => invalidateFriendData(queryClient),
    onError: () =>
      void queryClient.invalidateQueries({ queryKey: friendsKeys.searches() }),
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsService.unfriend(userId),
    onMutate: (userId) => {
      updateFriendSuggestionStatus(queryClient, userId, "NONE");
      updateFriendSearchStatus(queryClient, userId, "NONE");
    },
    onSuccess: () => invalidateFriendData(queryClient),
    onError: () =>
      void queryClient.invalidateQueries({ queryKey: friendsKeys.searches() }),
  });
}
