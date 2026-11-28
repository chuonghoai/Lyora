import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useClickOutside, toast, webSocketService } from '@/core';
import { useLogoutMutation } from '@/features/auth';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  type AppNotification,
} from '@/features/notifications';
import { notificationsKeys } from '@/features/notifications/hooks/notifications.keys';
import { postKeys } from '@/features/posts';
import { ROUTES } from '@/routes/paths';
import { filterAdminNavItems, type AdminNavItem } from './adminNav';

export function useAdminLayoutController() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logoutMutation = useLogoutMutation();
  const notificationsQuery = useNotificationsQuery();
  const markNotificationReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  // Header local feature finder
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Header Notifications popover
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sidebar collapse & mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchContainerRef, () => setIsSearchOpen(false));
  useClickOutside(notificationsRef, () => setIsNotificationsOpen(false));

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const searchResults = useMemo(
    () => filterAdminNavItems(headerSearchQuery),
    [headerSearchQuery],
  );

  // Đóng các menu/drawer khi chuyển route
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname, location.search]);

  // Đóng nhanh các overlay bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Đồng bộ thông báo realtime qua Socket.IO cho Quản trị viên
  useEffect(() => {
    if (!isAuthenticated) {
      webSocketService.disconnect();
      return;
    }

    webSocketService.connect();
    const unsubscribeCreated = webSocketService.subscribe('notification.created', () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
    });
    const unsubscribeUpdated = webSocketService.subscribe('notification.updated', () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      webSocketService.disconnect();
    };
  }, [isAuthenticated, queryClient]);

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    await logoutMutation.mutateAsync();
    toast.info('Bạn đã đăng xuất khỏi trung tâm quản trị.');
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleHeaderSearchChange = (value: string) => {
    setHeaderSearchQuery(value);
    setIsSearchOpen(true);
  };

  const handleSelectSearchItem = (item: AdminNavItem) => {
    if (!item.implemented) {
      return;
    }
    setIsSearchOpen(false);
    setHeaderSearchQuery('');
    navigate(item.path);
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const firstImplemented = searchResults.find((item) => item.implemented);
    if (firstImplemented) {
      handleSelectSearchItem(firstImplemented);
      return;
    }
    if (searchResults.length === 0) {
      toast.info('Không tìm thấy chức năng quản trị phù hợp.');
    }
  };

  const handleClearHeaderSearch = () => {
    setHeaderSearchQuery('');
    setIsSearchOpen(true);
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleOpenMobileSidebar = () => {
    setIsMobileSidebarOpen(true);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleToggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsSearchOpen(false);
  };

  const handleSelectNotification = async (notification: AppNotification) => {
    setIsNotificationsOpen(false);
    if (!notification.isRead) {
      try {
        await markNotificationReadMutation.mutateAsync(notification.id);
      } catch {
        // Không chặn điều hướng nếu đánh dấu đọc thất bại tạm thời
      }
    }
    const targetPath = notification.targetPath || `${ROUTES.ADMIN.POSTS}?tab=appeals`;
    navigate(targetPath);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (unreadNotificationsCount === 0 || markAllReadMutation.isPending) return;
    await markAllReadMutation.mutateAsync();
  };

  return {
    location,
    appTitle,
    user,
    isLoggingOut: logoutMutation.isPending,
    headerSearchQuery,
    isSearchOpen,
    searchResults,
    searchContainerRef,
    notifications,
    unreadNotificationsCount,
    isNotificationsOpen,
    isLoadingNotifications: notificationsQuery.isLoading,
    isMarkingAllNotificationsRead: markAllReadMutation.isPending,
    notificationsRef,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    handleLogout,
    handleOpenSearch,
    handleHeaderSearchChange,
    handleHeaderSearchSubmit,
    handleSelectSearchItem,
    handleClearHeaderSearch,
    handleToggleNotifications,
    handleSelectNotification,
    handleMarkAllNotificationsRead,
    handleToggleSidebarCollapse,
    handleOpenMobileSidebar,
    handleCloseMobileSidebar,
  };
}

export type AdminLayoutController = ReturnType<typeof useAdminLayoutController>;
