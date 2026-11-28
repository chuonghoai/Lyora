import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  isApiError,
  localStorageService,
  toast,
  useAuthStore,
  useClickOutside,
  webSocketService,
} from "@/core";
import { useLogoutMutation, useRefreshSessionMutation } from "@/features/auth";
import {
  useAcceptedFriendsQuery,
  useAcceptFriendRequestMutation,
  useFriendSearchQuery,
  useReceivedFriendRequestsQuery,
  updateFriendSearchStatus,
  updateFriendSuggestionStatus,
} from "@/features/friends";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications";
import { friendsKeys } from "@/features/friends/hooks/friends.keys";
import { notificationsKeys } from "@/features/notifications/hooks/notifications.keys";
import { postKeys, type PostsFeedFilter } from "@/features/posts";
import {
  getClientProfilePath,
  isClientProfilePathname,
  ROUTES,
} from "@/routes/paths";

export type AccountMenuPanel = "main" | "accessibility" | "settings" | "help";
export type FontScalePreference = "normal" | "large";

export interface ClientNotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  isRead: boolean;
  targetPath?: string | null;
  targetTab?: PostsFeedFilter;
  targetRoute?: "profile" | "friends";
  actorName?: string;
  actorAvatarUrl?: string | null;
  friendRequestUserId?: string;
}

const ACCESSIBILITY_STORAGE_KEY = "lyora_ui_preferences";
const SEARCH_HISTORY_STORAGE_KEY = "lyora_search_history";

interface UiAccessibilityPrefs {
  fontScale: FontScalePreference;
  reduceMotion: boolean;
}

function loadAccessibilityPrefs(): UiAccessibilityPrefs {
  const saved = localStorageService.getItem<UiAccessibilityPrefs>(
    ACCESSIBILITY_STORAGE_KEY,
  );
  return {
    fontScale: saved?.fontScale === "large" ? "large" : "normal",
    reduceMotion: Boolean(saved?.reduceMotion),
  };
}

function formatNotificationTime(createdAt: string): string {
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return "";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1_000));
  if (elapsedSeconds < 60) return "Vừa xong";
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function useClientLayoutController() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appTitle = import.meta.env.VITE_APP_TITLE || "Lyora";

  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logoutMutation = useLogoutMutation();
  const refreshSessionMutation = useRefreshSessionMutation({
    onSuccess: (session) => {
      if (session) {
        setAuth(
          {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
          },
          session.user,
        );
      }
    },
  });

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(
    () =>
      localStorageService.getItem<string[]>(SEARCH_HISTORY_STORAGE_KEY) ?? [],
  );
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountMenuPanel, setAccountMenuPanel] =
    useState<AccountMenuPanel>("main");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [acceptingRequesterId, setAcceptingRequesterId] = useState<
    string | null
  >(null);

  const [fontScale, setFontScale] = useState<FontScalePreference>(
    () => loadAccessibilityPrefs().fontScale,
  );
  const [reduceMotion, setReduceMotion] = useState<boolean>(
    () => loadAccessibilityPrefs().reduceMotion,
  );

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const hasAttemptedMountRefreshRef = useRef(false);

  useClickOutside(accountMenuRef, () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
  });
  useClickOutside(notificationRef, () => setIsNotificationOpen(false));
  useClickOutside(searchRef, () => setIsSearchOpen(false));

  const acceptedFriendsQuery = useAcceptedFriendsQuery();
  const discoveryQuery = useFriendSearchQuery(searchQuery);
  const receivedRequestsQuery = useReceivedFriendRequestsQuery();
  const acceptFriendRequestMutation = useAcceptFriendRequestMutation();
  const notificationsQuery = useNotificationsQuery();
  const markNotificationReadMutation = useMarkNotificationReadMutation();
  const markAllNotificationsReadMutation =
    useMarkAllNotificationsReadMutation();

  const activeTab: PostsFeedFilter = "all";

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isAuthenticated) {
      document.documentElement.style.fontSize = "";
      document.documentElement.classList.remove("motion-reduce");
      return;
    }
    document.documentElement.style.fontSize =
      fontScale === "large" ? "17.5px" : "";
    document.documentElement.classList.toggle("motion-reduce", reduceMotion);
    localStorageService.setItem(ACCESSIBILITY_STORAGE_KEY, {
      fontScale,
      reduceMotion,
    });
  }, [fontScale, isAuthenticated, reduceMotion]);

  const triggerRefreshSession = refreshSessionMutation.mutate;
  useEffect(() => {
    if (!isAuthenticated) {
      hasAttemptedMountRefreshRef.current = false;
      return;
    }
    if (hasAttemptedMountRefreshRef.current) {
      return;
    }
    hasAttemptedMountRefreshRef.current = true;
    triggerRefreshSession();
  }, [isAuthenticated, triggerRefreshSession]);

  // Socket only invalidates cache; REST remains the persistent source on initial load/reconnect.
  useEffect(() => {
    if (!isAuthenticated) {
      webSocketService.disconnect();
      return;
    }
    webSocketService.connect();
    const refreshFriendLists = () => {
      void queryClient.invalidateQueries({ queryKey: friendsKeys.accepted() });
      void queryClient.invalidateQueries({ queryKey: friendsKeys.suggestions() });
      void queryClient.invalidateQueries({
        queryKey: friendsKeys.receivedRequests(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["users", "profile-page"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["users", "friends-directory"],
      });
    };
    const unsubscribeNotification = webSocketService.subscribe(
      "notification.created",
      (event) => {
        void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        const notificationType =
          event &&
          typeof event === "object" &&
          "payload" in event &&
          event.payload &&
          typeof event.payload === "object" &&
          "type" in event.payload &&
          typeof event.payload.type === "string"
            ? event.payload.type
            : null;
        const notificationTitle =
          event &&
          typeof event === "object" &&
          "payload" in event &&
          event.payload &&
          typeof event.payload === "object" &&
          "title" in event.payload &&
          typeof event.payload.title === "string"
            ? event.payload.title
            : null;

        if (
          !notificationType ||
          notificationType === "FRIEND_REQUEST" ||
          notificationType === "FRIEND_REQUEST_ACCEPTED"
        ) {
          refreshFriendLists();
        }
        if (
          notificationType === "POST_HIDDEN" ||
          notificationType === "POST_RESTORED" ||
          notificationType === "POST_REMOVED" ||
          notificationType === "COMMENT_REMOVED" ||
          notificationType === "POST_APPEAL_REJECTED" ||
          notificationType === "POST_VIOLATION_FLAGGED"
        ) {
          void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
          void queryClient.invalidateQueries({ queryKey: postKeys.details() });
        }
        if (notificationType === "POST_VIOLATION_FLAGGED") {
          toast.error(
            notificationTitle ?? "Một bài viết của bạn vừa bị đánh dấu vi phạm.",
          );
        }
        if (
          notificationType === "AVATAR_VIOLATION_FLAGGED" ||
          notificationType === "COVER_VIOLATION_FLAGGED"
        ) {
          void queryClient.invalidateQueries({
            queryKey: ["users", "profile-page"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["users", "profile"],
          });
          void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
          void queryClient.invalidateQueries({ queryKey: postKeys.details() });
          triggerRefreshSession();
          toast.error(
            notificationTitle ?? "Hồ sơ của bạn vừa nhận được cảnh báo vi phạm mới.",
          );
        }
      },
    );
    const unsubscribeNotificationUpdated = webSocketService.subscribe(
      "notification.updated",
      () => {
        void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      },
    );
    const unsubscribeFriendship = webSocketService.subscribe(
      "friendship.updated",
      (event) => {
        if (
          event &&
          typeof event === "object" &&
          "payload" in event &&
          event.payload &&
          typeof event.payload === "object" &&
          "userId" in event.payload &&
          "friendshipStatus" in event.payload &&
          typeof event.payload.userId === "string" &&
          typeof event.payload.friendshipStatus === "string"
        ) {
          const friendshipStatus = event.payload.friendshipStatus;
          if (
            friendshipStatus === "NONE" ||
            friendshipStatus === "FRIEND" ||
            friendshipStatus === "REQUEST_SENT" ||
            friendshipStatus === "REQUEST_RECEIVED"
          ) {
            updateFriendSearchStatus(
              queryClient,
              event.payload.userId,
              friendshipStatus,
            );
            updateFriendSuggestionStatus(
              queryClient,
              event.payload.userId,
              friendshipStatus,
            );
          }
        }
        refreshFriendLists();
      },
    );
    return () => {
      unsubscribeNotification();
      unsubscribeNotificationUpdated();
      unsubscribeFriendship();
      webSocketService.disconnect();
    };
  }, [isAuthenticated, queryClient]);

  // Chỉ đồng bộ ô tìm kiếm với URL khi đang xem trang kết quả tìm kiếm.
  useEffect(() => {
    const urlSearch =
      location.pathname === ROUTES.CLIENT.SEARCH
        ? (searchParams.get("q") ?? "")
        : "";
    setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
  }, [location.pathname, searchParams]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setAccountMenuPanel("main");
        setIsNotificationOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
    await logoutMutation.mutateAsync();
    toast.info("Bạn đã đăng xuất khỏi hệ thống.");
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const saveRecentSearch = (query: string) => {
    const normalized = query.trim();
    if (normalized.length < 2) return;
    setRecentSearches((previous) => {
      const next = [
        normalized,
        ...previous.filter(
          (item) => item.toLowerCase() !== normalized.toLowerCase(),
        ),
      ].slice(0, 6);
      localStorageService.setItem(SEARCH_HISTORY_STORAGE_KEY, next);
      return next;
    });
  };

  const handleRunSearch = () => {
    const normalized = searchQuery.trim();
    if (normalized.length < 2) return;
    saveRecentSearch(normalized);
    setIsSearchOpen(false);
    navigate(`${ROUTES.CLIENT.SEARCH}?q=${encodeURIComponent(normalized)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleRunSearch();
  };

  const handleOpenSearch = () => setIsSearchOpen(true);
  const handleSelectRecentSearch = (query: string) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    setIsSearchOpen(false);
    navigate(`${ROUTES.CLIENT.SEARCH}?q=${encodeURIComponent(query)}`);
  };
  const handleRemoveRecentSearch = (query: string) => {
    setRecentSearches((previous) => {
      const next = previous.filter((item) => item !== query);
      localStorageService.setItem(SEARCH_HISTORY_STORAGE_KEY, next);
      return next;
    });
  };
  const handleSelectSearchUser = (userId: string) => {
    saveRecentSearch(searchQuery);
    setIsSearchOpen(false);
    navigate(getClientProfilePath(userId, user?.id));
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const friendSuggestions = (acceptedFriendsQuery.data ?? [])
    .filter((friend) =>
      normalizedSearch
        ? friend.fullName.toLowerCase().includes(normalizedSearch)
        : true,
    )
    .slice(0, 4);
  const friendIds = new Set(friendSuggestions.map((friend) => friend.id));
  const otherSuggestions = (discoveryQuery.data?.items ?? [])
    .filter((person) => !friendIds.has(person.id))
    .slice(0, 4);

  const handleSelectTab = (tab: PostsFeedFilter) => {
    if (tab === "all") {
      navigate(ROUTES.CLIENT.ROOT);
    } else {
      navigate(`${ROUTES.CLIENT.ROOT}?tab=${encodeURIComponent(tab)}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenComposer = () => {
    navigate(`${ROUTES.CLIENT.ROOT}?compose=1`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAccountMenu = () => {
    setIsNotificationOpen(false);
    setIsAccountMenuOpen((prev) => {
      if (prev) {
        setAccountMenuPanel("main");
      }
      return !prev;
    });
  };

  const handleNavigateAccountPanel = (panel: AccountMenuPanel) => {
    setAccountMenuPanel(panel);
  };

  const isMessagesRoute = location.pathname === ROUTES.CLIENT.MESSAGES;
  const isFriendsRoute = location.pathname === ROUTES.CLIENT.FRIENDS;
  const isHomeRoute = location.pathname === ROUTES.CLIENT.ROOT;
  const isProfileRoute = isClientProfilePathname(location.pathname);

  const handleOpenProfile = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
    setIsNotificationOpen(false);
    const targetPath = getClientProfilePath(user?.id);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateMessages = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
    setIsNotificationOpen(false);
    if (location.pathname !== ROUTES.CLIENT.MESSAGES) {
      navigate(ROUTES.CLIENT.MESSAGES);
    }
  };

  const handleNavigateFriends = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
    setIsNotificationOpen(false);
    if (location.pathname !== ROUTES.CLIENT.FRIENDS) {
      navigate(ROUTES.CLIENT.FRIENDS);
    }
  };

  const handleSelectFontScale = (scale: FontScalePreference) => {
    setFontScale(scale);
    toast.info(
      scale === "large"
        ? "Đã bật cỡ chữ lớn dễ đọc."
        : "Đã khôi phục cỡ chữ mặc định.",
    );
  };

  const handleToggleReduceMotion = () => {
    setReduceMotion((prev) => {
      const next = !prev;
      toast.info(
        next
          ? "Đã bật chế độ giảm hiệu ứng chuyển động."
          : "Đã bật lại chuyển động tiêu chuẩn.",
      );
      return next;
    });
  };

  const handleManualRefreshSession = () => {
    refreshSessionMutation.mutate(true, {
      onSuccess: (session) => {
        if (session) {
          toast.success("Đã làm mới phiên đăng nhập an toàn.");
        }
      },
    });
  };

  const handleToggleNotifications = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const receivedRequestById = new Map(
    (receivedRequestsQuery.data ?? []).map((request) => [request.id, request]),
  );
  const notifications: ClientNotificationItem[] = (
    notificationsQuery.data ?? []
  ).map((notification) => {
    const requester = receivedRequestById.get(notification.actorId);
    const isFriendRequest =
      notification.type === "FRIEND_REQUEST" && Boolean(requester);
    return {
      id: notification.id,
      title: notification.title,
      description: notification.description,
      timeLabel: formatNotificationTime(notification.createdAt),
      isRead: notification.isRead,
      targetPath: notification.targetPath,
      targetRoute:
        notification.targetPath === ROUTES.CLIENT.FRIENDS
          ? "friends"
          : notification.targetPath === ROUTES.CLIENT.PROFILE
            ? "profile"
            : undefined,
      actorName: requester?.fullName,
      actorAvatarUrl: requester?.avatarUrl,
      friendRequestUserId: isFriendRequest ? requester?.id : undefined,
    };
  });

  const handleMarkNotificationRead = (notificationId: string) => {
    const notification = notifications.find(
      (item) => item.id === notificationId,
    );
    if (!notification || notification.isRead) return;
    markNotificationReadMutation.mutate(notificationId);
  };

  const handleSelectNotification = (item: ClientNotificationItem) => {
    handleMarkNotificationRead(item.id);
    handleCloseNotifications();

    const rawPath = item.targetPath?.trim();
    if (rawPath?.startsWith("/post/")) {
      navigate(rawPath);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (rawPath?.startsWith("/posts/")) {
      const normalized = rawPath.replace(/^\/posts\//, "/post/").split("?")[0];
      navigate(normalized);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (rawPath === ROUTES.CLIENT.FRIENDS || item.targetRoute === "friends") {
      handleNavigateFriends();
      return;
    }
    if (rawPath === ROUTES.CLIENT.PROFILE || item.targetRoute === "profile") {
      handleOpenProfile();
      return;
    }
    if (item.targetTab) {
      handleSelectTab(item.targetTab);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!notifications.some((item) => !item.isRead)) return;
    try {
      await markAllNotificationsReadMutation.mutateAsync();
      toast.info("Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch (error) {
      toast.error(
        isApiError(error)
          ? error.message
          : "Không thể cập nhật trạng thái thông báo.",
      );
    }
  };

  const handleRetryNotifications = () => {
    void notificationsQuery.refetch();
  };

  const handleRetrySearchSuggestions = () => {
    void discoveryQuery.refetch();
  };

  const handleAcceptFriendRequestFromNotification = async (
    requesterId: string,
    notificationId: string,
    requesterName: string,
  ) => {
    setAcceptingRequesterId(requesterId);
    try {
      await acceptFriendRequestMutation.mutateAsync(requesterId);
      handleMarkNotificationRead(notificationId);
      toast.success(`Bạn và ${requesterName} hiện là bạn bè.`);
    } catch (error) {
      toast.error(
        isApiError(error)
          ? error.message
          : "Không thể chấp nhận lời mời kết bạn.",
      );
    } finally {
      setAcceptingRequesterId(null);
    }
  };

  const unreadNotificationsCount = notifications.filter(
    (item) => !item.isRead,
  ).length;

  return {
    location,
    appTitle,
    user,
    isAuthenticated,
    isLoggingOut: logoutMutation.isPending,
    isRefreshingSession: refreshSessionMutation.isPending,
    searchQuery,
    isSearchOpen,
    recentSearches,
    friendSuggestions,
    otherSuggestions,
    isSearchingSuggestions: discoveryQuery.isFetching,
    isSearchSuggestionsError: discoveryQuery.isError,
    activeTab,
    isMessagesRoute,
    isFriendsRoute,
    isHomeRoute,
    isProfileRoute,
    isAccountMenuOpen,
    accountMenuPanel,
    fontScale,
    reduceMotion,
    isNotificationOpen,
    notifications,
    isLoadingNotifications: notificationsQuery.isLoading,
    isNotificationsError: notificationsQuery.isError,
    isMarkingAllNotificationsRead: markAllNotificationsReadMutation.isPending,
    acceptingRequesterId,
    isAcceptingFriendRequest: acceptFriendRequestMutation.isPending,
    unreadNotificationsCount,
    accountMenuRef,
    notificationRef,
    searchRef,
    handleLogout,
    handleSearchChange,
    handleClearSearch,
    handleSearchSubmit,
    handleRunSearch,
    handleOpenSearch,
    handleSelectRecentSearch,
    handleRemoveRecentSearch,
    handleSelectSearchUser,
    handleRetrySearchSuggestions,
    handleSelectTab,
    handleOpenComposer,
    handleToggleAccountMenu,
    handleNavigateAccountPanel,
    handleNavigateMessages,
    handleNavigateFriends,
    handleOpenProfile,
    handleSelectFontScale,
    handleToggleReduceMotion,
    handleManualRefreshSession,
    handleToggleNotifications,
    handleCloseNotifications,
    handleRetryNotifications,
    handleSelectNotification,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleAcceptFriendRequestFromNotification,
  };
}

export type ClientLayoutController = ReturnType<
  typeof useClientLayoutController
>;
