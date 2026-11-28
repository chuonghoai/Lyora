import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useClickOutside, toast } from '@/core';
import { useLogoutMutation } from '@/features/auth';
import { filterAdminNavItems, type AdminNavItem } from './adminNav';

export function useAdminLayoutController() {
  const location = useLocation();
  const navigate = useNavigate();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();

  // Header local feature finder
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sidebar collapse & mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchContainerRef, () => setIsSearchOpen(false));

  const searchResults = useMemo(
    () => filterAdminNavItems(headerSearchQuery),
    [headerSearchQuery],
  );

  // Đóng các menu/drawer khi chuyển route
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Đóng nhanh các overlay bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
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

  return {
    location,
    appTitle,
    user,
    isLoggingOut: logoutMutation.isPending,
    headerSearchQuery,
    isSearchOpen,
    searchResults,
    searchContainerRef,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    handleLogout,
    handleOpenSearch,
    handleHeaderSearchChange,
    handleHeaderSearchSubmit,
    handleSelectSearchItem,
    handleClearHeaderSearch,
    handleToggleSidebarCollapse,
    handleOpenMobileSidebar,
    handleCloseMobileSidebar,
  };
}

export type AdminLayoutController = ReturnType<typeof useAdminLayoutController>;
