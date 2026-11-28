import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { isApiError, toast } from "@/core";
import {
  useAcceptFriendRequestMutation,
  useFriendSearchQuery,
  useRemoveFriendRequestMutation,
  useSendFriendRequestMutation,
} from "@/features/friends";
import { useInfinitePostsQuery } from "@/features/posts";

export type SearchResultTab = "all" | "people" | "posts" | "pages";

function getErrorMessage(error: unknown): string {
  return isApiError(error)
    ? error.message
    : "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export function useSearchController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const tabParam = searchParams.get("tab");
  const activeTab: SearchResultTab =
    tabParam === "people" || tabParam === "posts" || tabParam === "pages"
      ? tabParam
      : "all";
  const peopleQuery = useFriendSearchQuery(query);
  const sendRequestMutation = useSendFriendRequestMutation();
  const acceptRequestMutation = useAcceptFriendRequestMutation();
  const removeRequestMutation = useRemoveFriendRequestMutation();
  const postsQuery = useInfinitePostsQuery(
    { search: query, limit: 10, filter: "all" },
    { enabled: query.length >= 2 },
  );
  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );

  const handleSelectTab = (tab: SearchResultTab) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (tab === "all") next.delete("tab");
      else next.set("tab", tab);
      return next;
    });
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

  return {
    query,
    activeTab,
    people: peopleQuery.data?.items ?? [],
    posts,
    isLoadingPeople: peopleQuery.isLoading,
    isLoadingPosts: postsQuery.isFetching,
    isActionPending: (userId: string) =>
      (sendRequestMutation.isPending &&
        sendRequestMutation.variables === userId) ||
      (acceptRequestMutation.isPending &&
        acceptRequestMutation.variables === userId) ||
      (removeRequestMutation.isPending &&
        removeRequestMutation.variables === userId),
    handleSelectTab,
    handleSendRequest,
    handleAcceptRequest,
    handleRemoveRequest,
  };
}

export type SearchController = ReturnType<typeof useSearchController>;
