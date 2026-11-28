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
  const [unfriendTarget, setUnfriendTarget] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

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

  const handleRequestUnfriend = (userId: string, fullName: string) => {
    setUnfriendTarget({ id: userId, fullName });
  };

  const handleCancelUnfriend = () => {
    if (unfriendMutation.isPending) return;
    setUnfriendTarget(null);
  };

  const handleConfirmUnfriend = async () => {
    if (!unfriendTarget) return;
    const { id, fullName } = unfriendTarget;
    try {
      await unfriendMutation.mutateAsync(id);
      setUnfriendTarget(null);
      toast.info(`Đã hủy kết bạn với ${fullName}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRetryFriends = () => {
    void acceptedFriendsQuery.refetch();
  };

  const handleRetryRequests = () => {
    void receivedRequestsQuery.refetch();
  };

  const handleRetrySearch = () => {
    void searchQuery.refetch();
  };

  return {
    searchText,
    results: searchQuery.data?.items ?? [],
    totalResults: searchQuery.data?.totalItems ?? 0,
    acceptedFriends: acceptedFriendsQuery.data ?? [],
    suggestions: suggestionsQuery.data ?? [],
    receivedRequests: receivedRequestsQuery.data ?? [],
    isLoadingFriends: acceptedFriendsQuery.isLoading,
    friendsError: acceptedFriendsQuery.error,
    isLoadingRequests: receivedRequestsQuery.isLoading,
    requestsError: receivedRequestsQuery.error,
    isSearching: searchQuery.isFetching,
    searchError: searchQuery.error,
    suggestionsError: suggestionsQuery.error,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    isMutating,
    isUnfriending: unfriendMutation.isPending,
    unfriendTarget,
    handleSearchChange,
    handleClearSearch,
    handleOpenProfile,
    handleSendRequest,
    handleAcceptRequest,
    handleRemoveRequest,
    handleRequestUnfriend,
    handleCancelUnfriend,
    handleConfirmUnfriend,
    handleRetryFriends,
    handleRetryRequests,
    handleRetrySearch,
  };
}

export type FriendsController = ReturnType<typeof useFriendsController>;
