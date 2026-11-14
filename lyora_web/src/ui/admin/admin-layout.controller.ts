import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useClickOutside, toast } from '@/core';
import { useLogoutMutation } from '@/features/auth';
import { filterAdminNavItems, type AdminNavItem } from './adminNav';

export function useAdminLayoutController() {
  const location = useLocation();
  const navigate = useNavigate();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();

  // Header local feature finder & notifications
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sidebar collapse, mobile drawer & bottom account menu
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchContainerRef, () => setIsSearchOpen(false));
  useClickOutside(notificationRef, () => setIsNotificationOpen(false));
  useClickOutside(accountMenuRef, () => setIsAccountMenuOpen(false));

  const searchResults = useMemo(
    () => filterAdminNavItems(headerSearchQuery),
    [headerSearchQuery],
  );

  // Đóng các menu/drawer khi chuyển route
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsSearchOpen(false);
    setIsNotificationOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  // Đóng nhanh các overlay bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationOpen(false);
        setIsAccountMenuOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    setIsAccountMenuOpen(false);
    await logoutMutation.mutateAsync();
    toast.info('Bạn đã đăng xuất khỏi trung tâm quản trị.');
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleHeaderSearchChange = (value: string) => {
    setHeaderSearchQuery(value);
    setIsSearchOpen(true);
  };

  const handleSelectSearchItem = (item: AdminNavItem) => {
    setIsSearchOpen(false);
    setHeaderSearchQuery('');
    if (item.implemented) {
      navigate(item.path);
      return;
    }
    // TODO: Điều hướng tới route thực tế khi chức năng quản trị tương ứng được triển khai
    toast.info(`Phân hệ "${item.label}" đang trong kế hoạch triển khai.`);
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectSearchItem(searchResults[0]);
      return;
    }
    toast.info('Không tìm thấy chức năng quản trị phù hợp.');
  };

  const handleClearHeaderSearch = () => {
    setHeaderSearchQuery('');
    setIsSearchOpen(true);
  };

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setIsNotificationOpen(false);
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

  const handleToggleAccountMenu = () => {
    setIsAccountMenuOpen((prev) => !prev);
  };

  const handleCloseAccountMenu = () => {
    setIsAccountMenuOpen(false);
  };

  const handlePlaceholderNavClick = (item: AdminNavItem) => {
    // TODO: Điều hướng tới route thực tế khi module quản trị tương ứng được triển khai
    toast.info(`Phân hệ "${item.label}" đang trong kế hoạch triển khai.`);
    setIsMobileSidebarOpen(false);
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
    isNotificationOpen,
    notificationRef,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isAccountMenuOpen,
    accountMenuRef,
    handleLogout,
    handleOpenSearch,
    handleHeaderSearchChange,
    handleHeaderSearchSubmit,
    handleSelectSearchItem,
    handleClearHeaderSearch,
    handleToggleNotifications,
    handleCloseNotifications,
    handleToggleSidebarCollapse,
    handleOpenMobileSidebar,
    handleCloseMobileSidebar,
    handleToggleAccountMenu,
    handleCloseAccountMenu,
    handlePlaceholderNavClick,
  };
}

export type AdminLayoutController = ReturnType<typeof useAdminLayoutController>;
