import { useState, useRef } from 'react';
import { useDebounce, useClickOutside } from '@/core';
import { useSystemHealthQuery, type HealthStatus } from '@/features/system';

export function useHomeController() {
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // TanStack Query hook from Data Layer (features/system)
  const healthQuery = useSystemHealthQuery();

  const debouncedSearch = useDebounce(searchTerm, 400);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  const handleIncrement = () => {
    setIsLoading(true);
    setTimeout(() => {
      setCount((c) => c + 1);
      setIsLoading(false);
    }, 400);
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return {
    // States
    count,
    searchTerm,
    debouncedSearch,
    isDropdownOpen,
    isLoading,
    dropdownRef,
    systemHealth: (healthQuery.data as HealthStatus | undefined) ?? null,
    isHealthLoading: healthQuery.isLoading,
    appTitle,

    // Handlers
    handleIncrement,
    handleToggleDropdown,
    handleSearchChange,
    setSearchTerm,
    toggleDropdown: handleToggleDropdown,
  };
}

export { useHomeController as useClientHomeController };
export type HomeController = ReturnType<typeof useHomeController>;
