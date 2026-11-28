import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
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
  getSentFriendRequests,
  useReceivedFriendRequestsQuery,
  updateFriendSearchStatus,
} from "@/features/friends";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications";
import { friendsKeys } from "@/features/friends/hooks/friends.keys";
import { notificationsKeys } from "@/features/notifications/hooks/notifications.keys";
import type { PostsFeedFilter } from "@/features/posts";
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
  targetTab?: PostsFeedFilter;
  targetRoute?: "profile" | "friends";
  actorName?: string;
  actorAvatarUrl?: string | null;
  friendRequestUserId?: string;
}

const ACCESSIBILITY_STORAGE_KEY = "lyora_ui_preferences";
const SEARCH_HISTORY_STORAGE_KEY = "lyora_search_history";
const FALLBACK_READ_REQUEST_IDS_STORAGE_KEY =
  "lyora_read_friend_request_notification_ids";
const FALLBACK_READ_ACCEPTANCE_IDS_STORAGE_KEY =
  "lyora_read_friend_request_acceptance_notification_ids";

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
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1_000),
  );
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [readFallbackRequestIds, setReadFallbackRequestIds] = useState<
    string[]
  >(
    () =>
      localStorageService.getItem<string[]>(
        FALLBACK_READ_REQUEST_IDS_STORAGE_KEY,
      ) ?? [],
  );
  const [readFallbackAcceptanceIds, setReadFallbackAcceptanceIds] = useState<
    string[]
  >(
    () =>
      localStorageService.getItem<string[]>(
        FALLBACK_READ_ACCEPTANCE_IDS_STORAGE_KEY,
      ) ?? [],
  );

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

  const activeTabParam = searchParams.get("tab");
  const activeTab: PostsFeedFilter =
    activeTabParam === "saved" ? "saved" : "all";

  // Áp dụng tùy chọn Màn hình & Trợ năng lên root document
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.fontSize =
      fontScale === "large" ? "17.5px" : "";
    document.documentElement.classList.toggle("motion-reduce", reduceMotion);
    localStorageService.setItem(ACCESSIBILITY_STORAGE_KEY, {
      fontScale,
      reduceMotion,
    });
  }, [fontScale, reduceMotion]);

  // Cơ chế duy trì phiên dài hạn kiểu Facebook: tự động xin cặp token mới mỗi lần vào trang chủ
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
      () => {
        void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        refreshFriendLists();
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
          }
        }
        refreshFriendLists();
      },
    );
    return () => {
      unsubscribeNotification();
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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "all") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true },
    );
    if (location.pathname !== ROUTES.CLIENT.ROOT) {
      navigate(ROUTES.CLIENT.ROOT);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenComposer = () => {
    if (activeTab !== "all") {
      handleSelectTab("all");
    } else if (location.pathname !== ROUTES.CLIENT.ROOT) {
      navigate(ROUTES.CLIENT.ROOT);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    const composerTrigger =
      document.getElementById("lyora-post-composer-input") ??
      document.getElementById("lyora-post-composer-btn");
    composerTrigger?.focus();
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

  const handleSendFeedback = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel("main");
    toast.success(
      "Cảm ơn bạn! Góp ý trải nghiệm Lyora của bạn đã được ghi nhận.",
    );
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
  const persistedNotifications: ClientNotificationItem[] = (
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
      targetRoute:
        notification.targetPath === ROUTES.CLIENT.FRIENDS
          ? "friends"
          : undefined,
      actorName: requester?.fullName,
      actorAvatarUrl: requester?.avatarUrl,
      friendRequestUserId: isFriendRequest ? requester?.id : undefined,
    };
  });
  const notifiedRequesterIds = new Set(
    (notificationsQuery.data ?? [])
      .filter((notification) => notification.type === "FRIEND_REQUEST")
      .map((notification) => notification.actorId),
  );
  const notifiedAcceptanceActorIds = new Set(
    (notificationsQuery.data ?? [])
      .filter((notification) => notification.type === "FRIEND_REQUEST_ACCEPTED")
      .map((notification) => notification.actorId),
  );
  const fallbackRequestNotifications: ClientNotificationItem[] = (
    receivedRequestsQuery.data ?? []
  )
    .filter((request) => !notifiedRequesterIds.has(request.id))
    .map((request) => {
      const id = `friend-request-${request.id}`;
      return {
        id,
        title: `${request.fullName} đã gửi cho bạn lời mời kết bạn`,
        description: "Mở mục Bạn bè để chấp nhận hoặc từ chối lời mời.",
        timeLabel: "Lời mời mới",
        isRead: readFallbackRequestIds.includes(id),
        targetRoute: "friends",
        actorName: request.fullName,
        actorAvatarUrl: request.avatarUrl,
        friendRequestUserId: request.id,
      };
    });
  const sentFriendRequestIds = new Set(
    getSentFriendRequests(user?.id).map((request) => request.userId),
  );
  const fallbackAcceptanceNotifications: ClientNotificationItem[] = (
    acceptedFriendsQuery.data ?? []
  )
    .filter(
      (friend) =>
        sentFriendRequestIds.has(friend.id) &&
        !notifiedAcceptanceActorIds.has(friend.id),
    )
    .map((friend) => {
      const id = `friend-request-accepted-${friend.id}`;
      return {
        id,
        title: `${friend.fullName} đã chấp nhận lời mời kết bạn`,
        description: "Hai bạn hiện đã là bạn bè trên Lyora.",
        timeLabel: "Vừa xong",
        isRead: readFallbackAcceptanceIds.includes(id),
        targetRoute: "friends",
      };
    });
  const notifications = [
    ...persistedNotifications,
    ...fallbackRequestNotifications,
    ...fallbackAcceptanceNotifications,
  ];

  const persistReadFallbackRequestIds = (ids: string[]) => {
    setReadFallbackRequestIds(ids);
    localStorageService.setItem(FALLBACK_READ_REQUEST_IDS_STORAGE_KEY, ids);
  };

  const persistReadFallbackAcceptanceIds = (ids: string[]) => {
    setReadFallbackAcceptanceIds(ids);
    localStorageService.setItem(FALLBACK_READ_ACCEPTANCE_IDS_STORAGE_KEY, ids);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    const notification = notifications.find(
      (item) => item.id === notificationId,
    );
    if (!notification || notification.isRead) return;
    if (notificationId.startsWith("friend-request-accepted-")) {
      persistReadFallbackAcceptanceIds([
        ...new Set([...readFallbackAcceptanceIds, notificationId]),
      ]);
      return;
    }
    if (notificationId.startsWith("friend-request-")) {
      persistReadFallbackRequestIds([
        ...new Set([...readFallbackRequestIds, notificationId]),
      ]);
      return;
    }
    markNotificationReadMutation.mutate(notificationId);
  };

  const handleMarkAllNotificationsRead = () => {
    if (!notifications.some((item) => !item.isRead)) return;
    const unreadFallbackIds = fallbackRequestNotifications
      .filter((item) => !item.isRead)
      .map((item) => item.id);
    if (unreadFallbackIds.length > 0) {
      persistReadFallbackRequestIds([
        ...new Set([...readFallbackRequestIds, ...unreadFallbackIds]),
      ]);
    }
    const unreadFallbackAcceptanceIds = fallbackAcceptanceNotifications
      .filter((item) => !item.isRead)
      .map((item) => item.id);
    if (unreadFallbackAcceptanceIds.length > 0) {
      persistReadFallbackAcceptanceIds([
        ...new Set([
          ...readFallbackAcceptanceIds,
          ...unreadFallbackAcceptanceIds,
        ]),
      ]);
    }
    if (persistedNotifications.some((item) => !item.isRead)) {
      markAllNotificationsReadMutation.mutate();
    }
    toast.info("Đã đánh dấu tất cả thông báo là đã đọc.");
  };

  const handleAcceptFriendRequestFromNotification = async (
    requesterId: string,
    notificationId: string,
    requesterName: string,
  ) => {
    try {
      await acceptFriendRequestMutation.mutateAsync(requesterId);
      handleMarkNotificationRead(notificationId);
      toast.success(`Bạn và ${requesterName} hiện là bạn bè.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể chấp nhận lời mời kết bạn.",
      );
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
    handleSendFeedback,
    handleToggleNotifications,
    handleCloseNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleAcceptFriendRequestFromNotification,
  };
}

export type ClientLayoutController = ReturnType<
  typeof useClientLayoutController
>;
