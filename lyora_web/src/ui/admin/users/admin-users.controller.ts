import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, useDebounce } from '@/core';
import {
  useAdminUsersOnlineStatusQuery,
  useAdminUsersQuery,
  type AdminUserOnlineFilter,
  type AdminUserRoleTab,
  type AdminUserSortBy,
  type AdminUserSortOrder,
  type AdminUserStatusFilter,
} from '@/features/user';
import { getAdminUserDetailPath } from '@/routes/paths';

export type AdminUserSortOption =
  | 'createdAt:DESC'
  | 'createdAt:ASC'
  | 'fullName:ASC'
  | 'isOnline:DESC';

const DEFAULT_PAGE_LIMIT = 10;

function parseSortOption(option: AdminUserSortOption): {
  sortBy: AdminUserSortBy;
  sortOrder: AdminUserSortOrder;
} {
  const [sortBy, sortOrder] = option.split(':') as [AdminUserSortBy, AdminUserSortOrder];
  return { sortBy, sortOrder };
}

export function useAdminUsersController() {
  const navigate = useNavigate();

  const [activeRoleTab, setActiveRoleTab] = useState<AdminUserRoleTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<AdminUserStatusFilter>('ALL');
  const [onlineFilter, setOnlineFilter] = useState<AdminUserOnlineFilter>('ALL');
  const [sortOption, setSortOption] = useState<AdminUserSortOption>('createdAt:DESC');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery.trim(), 350);
  const { sortBy, sortOrder } = parseSortOption(sortOption);

  const usersQuery = useAdminUsersQuery({
    page,
    limit: DEFAULT_PAGE_LIMIT,
    search: debouncedSearch || undefined,
    role: activeRoleTab,
    status: statusFilter,
    online: onlineFilter,
    sortBy,
    sortOrder,
  });

  const visibleUserIds = useMemo(
    () => (usersQuery.data?.items ?? []).map((item) => item.id),
    [usersQuery.data?.items],
  );
  const visibleIdsKey = visibleUserIds.join(',');

  const onlineStatusQuery = useAdminUsersOnlineStatusQuery(visibleUserIds, {
    enabled: !usersQuery.isPlaceholderData,
  });

  const lastRefreshedPageRef = useRef<number>(page);
  const refetchOnlineStatus = onlineStatusQuery.refetch;
  const isOnlineStatusFetching = onlineStatusQuery.isFetching;

  useEffect(() => {
    if (usersQuery.isPlaceholderData || !visibleIdsKey) return;
    if (lastRefreshedPageRef.current !== page) {
      lastRefreshedPageRef.current = page;
      if (!isOnlineStatusFetching) {
        void refetchOnlineStatus();
      }
    }
  }, [page, visibleIdsKey, usersQuery.isPlaceholderData, isOnlineStatusFetching, refetchOnlineStatus]);

  const handleSelectRoleTab = (role: AdminUserRoleTab) => {
    setActiveRoleTab(role);
    setPage(1);
  };

  const handleStatusFilterChange = (status: AdminUserStatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleOnlineFilterChange = (online: AdminUserOnlineFilter) => {
    setOnlineFilter(online);
    setPage(1);
  };

  const handleSortOptionChange = (option: AdminUserSortOption) => {
    setSortOption(option);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveRoleTab('ALL');
    setStatusFilter('ALL');
    setOnlineFilter('ALL');
    setSortOption('createdAt:DESC');
    setSearchQuery('');
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    try {
      const result = await usersQuery.refetch();
      if (result.isError) {
        toast.error('Không thể làm mới danh sách người dùng.');
        return;
      }
      if (visibleUserIds.length > 0) {
        void onlineStatusQuery.refetch();
      }
      toast.success('Đã cập nhật danh sách người dùng mới nhất.');
    } catch {
      toast.error('Không thể làm mới danh sách người dùng.');
    }
  };

  const handleOpenUserDetail = (userId: string) => {
    navigate(getAdminUserDetailPath(userId));
  };

  const data = usersQuery.data;
  const onlineStatusesMap = onlineStatusQuery.data?.statuses;

  const mergedItems = useMemo(() => {
    const baseItems = data?.items ?? [];
    if (!onlineStatusesMap) return baseItems;
    return baseItems.map((item) => {
      const polled = onlineStatusesMap[item.id];
      if (typeof polled !== 'boolean' || polled === item.isOnline) {
        return item;
      }
      return { ...item, isOnline: polled };
    });
  }, [data?.items, onlineStatusesMap]);

  const baseSummary = data?.summary ?? {
    all: 0,
    client: 0,
    admin: 0,
    active: 0,
    locked: 0,
    online: 0,
  };

  const mergedSummary =
    typeof onlineStatusQuery.data?.onlineCount === 'number'
      ? { ...baseSummary, online: onlineStatusQuery.data.onlineCount }
      : baseSummary;

  const hasActiveFilter =
    activeRoleTab !== 'ALL' ||
    statusFilter !== 'ALL' ||
    onlineFilter !== 'ALL' ||
    Boolean(debouncedSearch);

  return {
    activeRoleTab,
    statusFilter,
    onlineFilter,
    sortOption,
    searchQuery,
    debouncedSearch,
    page,
    hasActiveFilter,
    items: mergedItems,
    meta: data?.meta ?? {
      page,
      limit: DEFAULT_PAGE_LIMIT,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    summary: mergedSummary,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    isTransitioningData: usersQuery.isFetching && !usersQuery.isLoading,
    isRefreshingOnlineStatus: onlineStatusQuery.isFetching,
    lastOnlineCheckedAt: onlineStatusQuery.data?.checkedAt ?? null,
    isError: usersQuery.isError,
    handleSelectRoleTab,
    handleStatusFilterChange,
    handleOnlineFilterChange,
    handleSortOptionChange,
    handleSearchChange,
    handleClearSearch,
    handleResetFilters,
    handlePageChange,
    handleRefresh,
    handleOpenUserDetail,
  };
}

export type AdminUsersController = ReturnType<typeof useAdminUsersController>;
