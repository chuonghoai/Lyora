import { useState, useRef } from 'react';
import { useDebounce, useClickOutside } from '@/core';
import { useSystemHealthQuery, type HealthStatus } from '@/features/system';

export function useDashboardController() {
  const [adminActions, setAdminActions] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TanStack Query hook from Data Layer (features/system)
  const healthQuery = useSystemHealthQuery();

  const debouncedFilter = useDebounce(filterQuery, 350);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  const handleSimulateSync = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setAdminActions((prev) => prev + 1);
      setIsSubmitting(false);
    }, 500);
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(e.target.value);
  };

  return {
    // States
    adminActions,
    filterQuery,
    debouncedFilter,
    isMenuOpen,
    isSubmitting,
    menuRef,
    systemHealth: (healthQuery.data as HealthStatus | undefined) ?? null,
    isHealthLoading: healthQuery.isLoading,
    appTitle,

    // Handlers
    handleSimulateSync,
    handleToggleMenu,
    handleFilterChange,
    setFilterQuery,
    toggleMenu: handleToggleMenu,
  };
}

export { useDashboardController as useAdminDashboardController };
export type DashboardController = ReturnType<typeof useDashboardController>;
