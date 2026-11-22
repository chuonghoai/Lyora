import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { localStorageService, toast, useAuthStore, useClickOutside } from '@/core';
import { useLogoutMutation, useRefreshSessionMutation } from '@/features/auth';
import type { PostsFeedFilter } from '@/features/posts';
import { ROUTES } from '@/routes/paths';

export type AccountMenuPanel = 'main' | 'accessibility' | 'settings' | 'help';
export type FontScalePreference = 'normal' | 'large';

export interface ClientNotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  isRead: boolean;
  targetTab?: PostsFeedFilter;
}

const INITIAL_NOTIFICATIONS: ClientNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Chào mừng bạn đến với bảng tin Lyora',
    description:
      'Đăng bài viết, bày tỏ cảm xúc, bình luận và lưu lại những khoảnh khắc đáng nhớ cùng bạn bè.',
    timeLabel: 'Vừa xong',
    isRead: false,
    targetTab: 'all',
  },
  {
    id: 'notif-2',
    title: 'Nguyễn Minh Anh đã bày tỏ cảm xúc về bài viết gần đây',
    description: '“Buổi sáng cuối tuần ở Đà Lạt sương còn giăng nhẹ trên đồi thông...”',
    timeLabel: '12 phút trước',
    isRead: false,
    targetTab: 'all',
  },
  {
    id: 'notif-3',
    title: 'Trần Hoàng Nam đã bình luận trong cộng đồng',
    description: '“Hẹn mọi người ở buổi meetup tháng sau nha!”',
    timeLabel: '45 phút trước',
    isRead: false,
    targetTab: 'all',
  },
  {
    id: 'notif-4',
    title: 'Mẹo bảo vệ tài khoản Lyora của bạn',
    description:
      'Kiểm tra và cập nhật số điện thoại cá nhân trong hồ sơ để đồng bộ thông tin liên hệ nhanh chóng.',
    timeLabel: '2 giờ trước',
    isRead: true,
    targetTab: 'mine',
  },
  {
    id: 'notif-5',
    title: 'Kho bài viết đã lưu của bạn đã sẵn sàng',
    description: 'Bạn có thể truy cập nhanh các bài viết yêu thích từ thanh điều hướng ở chính giữa.',
    timeLabel: 'Hôm nay',
    isRead: true,
    targetTab: 'saved',
  },
];

const ACCESSIBILITY_STORAGE_KEY = 'lyora_ui_preferences';

interface UiAccessibilityPrefs {
  fontScale: FontScalePreference;
  reduceMotion: boolean;
}

function loadAccessibilityPrefs(): UiAccessibilityPrefs {
  const saved = localStorageService.getItem<UiAccessibilityPrefs>(ACCESSIBILITY_STORAGE_KEY);
  return {
    fontScale: saved?.fontScale === 'large' ? 'large' : 'normal',
    reduceMotion: Boolean(saved?.reduceMotion),
  };
}

export function useClientLayoutController() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logoutMutation = useLogoutMutation();
  const refreshSessionMutation = useRefreshSessionMutation({
    onSuccess: (session) => {
      if (session) {
        setAuth(
          { accessToken: session.accessToken, refreshToken: session.refreshToken },
          session.user,
        );
      }
    },
  });

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountMenuPanel, setAccountMenuPanel] = useState<AccountMenuPanel>('main');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [fontScale, setFontScale] = useState<FontScalePreference>(
    () => loadAccessibilityPrefs().fontScale,
  );
  const [reduceMotion, setReduceMotion] = useState<boolean>(
    () => loadAccessibilityPrefs().reduceMotion,
  );

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const hasAttemptedMountRefreshRef = useRef(false);

  useClickOutside(accountMenuRef, () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel('main');
  });
  useClickOutside(notificationRef, () => setIsNotificationOpen(false));

  const activeTabParam = searchParams.get('tab');
  const activeTab: PostsFeedFilter =
    activeTabParam === 'mine' || activeTabParam === 'saved' ? activeTabParam : 'all';

  // Áp dụng tùy chọn Màn hình & Trợ năng lên root document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.fontSize = fontScale === 'large' ? '17.5px' : '';
    document.documentElement.classList.toggle('motion-reduce', reduceMotion);
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

  // Đồng bộ searchQuery khi URL thay đổi từ nơi khác
  useEffect(() => {
    const urlSearch = searchParams.get('q') ?? '';
    setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
  }, [searchParams]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setAccountMenuPanel('main');
        setIsNotificationOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    setIsAccountMenuOpen(false);
    setAccountMenuPanel('main');
    await logoutMutation.mutateAsync();
    toast.info('Bạn đã đăng xuất khỏi hệ thống.');
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setSearchQuery(nextValue);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextValue.trim()) {
          next.set('q', nextValue);
        } else {
          next.delete('q');
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        return next;
      },
      { replace: true },
    );
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (location.pathname !== ROUTES.CLIENT.ROOT) {
      navigate(ROUTES.CLIENT.ROOT);
    }
  };

  const handleSelectTab = (tab: PostsFeedFilter) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'all') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true },
    );
    if (location.pathname !== ROUTES.CLIENT.ROOT) {
      navigate(ROUTES.CLIENT.ROOT);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenComposer = () => {
    if (activeTab !== 'all') {
      handleSelectTab('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const composerTrigger = document.getElementById('lyora-post-composer-trigger');
    composerTrigger?.focus();
  };

  const handleToggleAccountMenu = () => {
    setIsNotificationOpen(false);
    setIsAccountMenuOpen((prev) => {
      if (prev) {
        setAccountMenuPanel('main');
      }
      return !prev;
    });
  };

  const handleNavigateAccountPanel = (panel: AccountMenuPanel) => {
    setAccountMenuPanel(panel);
  };

  const handleOpenProfile = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel('main');
    handleSelectTab('mine');
  };

  const isMessagesRoute = location.pathname === ROUTES.CLIENT.MESSAGES;
  const isHomeRoute = location.pathname === ROUTES.CLIENT.ROOT;

  const handleNavigateMessages = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel('main');
    setIsNotificationOpen(false);
    if (location.pathname !== ROUTES.CLIENT.MESSAGES) {
      navigate(ROUTES.CLIENT.MESSAGES);
    }
  };

  const handleSelectFontScale = (scale: FontScalePreference) => {
    setFontScale(scale);
    toast.info(
      scale === 'large'
        ? 'Đã bật cỡ chữ lớn dễ đọc.'
        : 'Đã khôi phục cỡ chữ mặc định.',
    );
  };

  const handleToggleReduceMotion = () => {
    setReduceMotion((prev) => {
      const next = !prev;
      toast.info(
        next ? 'Đã bật chế độ giảm hiệu ứng chuyển động.' : 'Đã bật lại chuyển động tiêu chuẩn.',
      );
      return next;
    });
  };

  const handleManualRefreshSession = () => {
    refreshSessionMutation.mutate(true, {
      onSuccess: (session) => {
        if (session) {
          toast.success('Đã làm mới phiên đăng nhập an toàn.');
        }
      },
    });
  };

  const handleSendFeedback = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel('main');
    toast.success('Cảm ơn bạn! Góp ý trải nghiệm Lyora của bạn đã được ghi nhận.');
  };

  const handleToggleNotifications = () => {
    setIsAccountMenuOpen(false);
    setAccountMenuPanel('main');
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    toast.info('Đã đánh dấu tất cả thông báo là đã đọc.');
  };

  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

  return {
    location,
    appTitle,
    user,
    isAuthenticated,
    isLoggingOut: logoutMutation.isPending,
    isRefreshingSession: refreshSessionMutation.isPending,
    searchQuery,
    activeTab,
    isMessagesRoute,
    isHomeRoute,
    isAccountMenuOpen,
    accountMenuPanel,
    fontScale,
    reduceMotion,
    isNotificationOpen,
    notifications,
    unreadNotificationsCount,
    accountMenuRef,
    notificationRef,
    handleLogout,
    handleSearchChange,
    handleClearSearch,
    handleSearchSubmit,
    handleSelectTab,
    handleOpenComposer,
    handleToggleAccountMenu,
    handleNavigateAccountPanel,
    handleNavigateMessages,
    handleOpenProfile,
    handleSelectFontScale,
    handleToggleReduceMotion,
    handleManualRefreshSession,
    handleSendFeedback,
    handleToggleNotifications,
    handleCloseNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
  };
}

export type ClientLayoutController = ReturnType<typeof useClientLayoutController>;
