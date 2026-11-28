import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isApiError, toast } from "@/core";
import {
  useAcceptFriendRequestMutation,
  useAcceptedFriendsQuery,
  useFriendSearchQuery,
  useFriendSuggestionsQuery,
  useReceivedFriendRequestsQuery,
  useRemoveFriendRequestMutation,
  useSendFriendRequestMutation,
  useUnfriendMutation,
} from "@/features/friends";
import { getClientProfilePath } from "@/routes/paths";

function getErrorMessage(error: unknown): string {
  return isApiError(error)
    ? error.message
    : "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export function useFriendsController() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const searchQuery = useFriendSearchQuery(deferredSearchText);
  const acceptedFriendsQuery = useAcceptedFriendsQuery();
  const suggestionsQuery = useFriendSuggestionsQuery();
  const receivedRequestsQuery = useReceivedFriendRequestsQuery();
  const sendRequestMutation = useSendFriendRequestMutation();
  const acceptRequestMutation = useAcceptFriendRequestMutation();
  const removeRequestMutation = useRemoveFriendRequestMutation();
  const unfriendMutation = useUnfriendMutation();

  const isMutating =
    sendRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    removeRequestMutation.isPending ||
    unfriendMutation.isPending;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleClearSearch = () => setSearchText("");

  const handleOpenProfile = (userId: string) => {
    navigate(getClientProfilePath(userId));
  };

  const handleSendRequest = async (userId: string, fullName: string) => {
    try {
      await sendRequestMutation.mutateAsync(userId);
      toast.success(`Đã gửi lời mời kết bạn đến ${fullName}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAcceptRequest = async (userId: string, fullName: string) => {
    try {
      await acceptRequestMutation.mutateAsync(userId);
      toast.success(`Bạn và ${fullName} hiện là bạn bè.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemoveRequest = async (
    userId: string,
    fullName: string,
    isIncoming: boolean,
  ) => {
    try {
      await removeRequestMutation.mutateAsync(userId);
      toast.info(
        isIncoming
          ? `Đã từ chối lời mời của ${fullName}.`
          : `Đã hủy lời mời đến ${fullName}.`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUnfriend = async (userId: string, fullName: string) => {
    try {
      await unfriendMutation.mutateAsync(userId);
      toast.info(`Đã hủy kết bạn với ${fullName}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return {
    searchText,
    results: searchQuery.data?.items ?? [],
    totalResults: searchQuery.data?.totalItems ?? 0,
    acceptedFriends: acceptedFriendsQuery.data ?? [],
    suggestions: suggestionsQuery.data ?? [],
    receivedRequests: receivedRequestsQuery.data ?? [],
    isSearching: searchQuery.isFetching,
    searchError: searchQuery.error,
    requestsError: receivedRequestsQuery.error,
    suggestionsError: suggestionsQuery.error,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    isMutating,
    handleSearchChange,
    handleClearSearch,
    handleOpenProfile,
    handleSendRequest,
    handleAcceptRequest,
    handleRemoveRequest,
    handleUnfriend,
  };
}

export type FriendsController = ReturnType<typeof useFriendsController>;
