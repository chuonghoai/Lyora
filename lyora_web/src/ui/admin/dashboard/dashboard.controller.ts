import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce, toast } from '@/core';
import {
  useAdminPostStatisticsQuery,
  type AdminPostStatistics,
} from '@/features/posts';
import { useSystemHealthQuery, type HealthStatus } from '@/features/system';
import {
  useUserStatisticsQuery,
  type UserRoleFilter,
  type UserStatistics,
} from '@/features/user';
import { getAdminUserDetailPath, ROUTES } from '@/routes/paths';

export type { UserRoleFilter };

export interface HealthCheckReport {
  ok: boolean;
  durationMs: number;
  checkedAt: string;
  message: string;
}

export function useDashboardController() {
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState('');
  const [isStatsRefreshing, setIsStatsRefreshing] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [lastHealthReport, setLastHealthReport] = useState<HealthCheckReport | null>(null);
  const [activeRoleFilter, setActiveRoleFilter] = useState<UserRoleFilter>('ALL');

  const healthQuery = useSystemHealthQuery();
  const userStatsQuery = useUserStatisticsQuery(activeRoleFilter);
  const postStatsQuery = useAdminPostStatisticsQuery();

  const debouncedFilter = useDebounce(filterQuery, 350);
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora';

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(e.target.value);
  };

  const handleRefreshStats = async () => {
    setIsStatsRefreshing(true);
    try {
      const [statsRes, postStatsRes, healthRes] = await Promise.all([
        userStatsQuery.refetch(),
        postStatsQuery.refetch(),
        healthQuery.refetch(),
      ]);
      if (
        statsRes.isError ||
        postStatsRes.isError ||
        healthRes.isError ||
        healthRes.data?.status !== 'ok'
      ) {
        toast.error('Không thể làm mới đầy đủ số liệu. Vui lòng thử lại.');
        return;
      }
      toast.success('Đã cập nhật số liệu thống kê mới nhất.');
    } catch {
      toast.error('Không thể làm mới số liệu. Vui lòng thử lại!');
    } finally {
      setIsStatsRefreshing(false);
    }
  };

  const handleRetryStats = async () => {
    try {
      const result = await userStatsQuery.refetch();
      if (result.isError) {
        toast.error('Không thể tải lại thống kê người dùng.');
      }
    } catch {
      toast.error('Không thể tải lại thống kê người dùng.');
    }
  };

  const handleRetryPostStats = async () => {
    try {
      const result = await postStatsQuery.refetch();
      if (result.isError) {
        toast.error('Không thể tải lại thống kê bài viết.');
      }
    } catch {
      toast.error('Không thể tải lại thống kê bài viết.');
    }
  };

  const handleNavigateAdminPosts = () => {
    navigate(ROUTES.ADMIN.POSTS);
  };

  const handleSelectRoleFilter = (filter: UserRoleFilter) => {
    setActiveRoleFilter(filter);
  };

  const handleViewAllUsers = () => {
    navigate(ROUTES.ADMIN.USERS);
  };

  const handleOpenAdminUserDetail = (userId: string) => {
    navigate(getAdminUserDetailPath(userId));
  };

  const handleCheckHealth = async () => {
    if (isCheckingHealth) return;
    setIsCheckingHealth(true);
    const startedAt = performance.now();

    try {
      const result = await healthQuery.refetch();
      const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
      const checkedAt = new Date().toISOString();

      if (result.isError || result.data?.status !== 'ok') {
        const errorMessage = 'Máy chủ API phản hồi lỗi hoặc không khả dụng.';
        setLastHealthReport({
          ok: false,
          durationMs,
          checkedAt,
          message: errorMessage,
        });
        toast.error(errorMessage);
        return;
      }

      const okMessage = `Máy chủ hoạt động ổn định · Phản hồi trong ${durationMs} ms.`;
      setLastHealthReport({
        ok: true,
        durationMs,
        checkedAt,
        message: okMessage,
      });
      toast.success(okMessage);
    } catch {
      const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
      const errorMessage = 'Không thể kết nối tới endpoint /health.';
      setLastHealthReport({
        ok: false,
        durationMs,
        checkedAt: new Date().toISOString(),
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return {
    filterQuery,
    debouncedFilter,
    isStatsRefreshing,
    isCheckingHealth,
    lastHealthReport,
    activeRoleFilter,
    systemHealth: (healthQuery.data as HealthStatus | undefined) ?? null,
    isHealthLoading: healthQuery.isLoading,
    isHealthError: healthQuery.isError,
    userStats: (userStatsQuery.data as UserStatistics | undefined) ?? null,
    isStatsLoading: userStatsQuery.isLoading,
    isStatsError: userStatsQuery.isError,
    statsError: userStatsQuery.error,
    postStats: (postStatsQuery.data as AdminPostStatistics | undefined) ?? null,
    isPostStatsLoading: postStatsQuery.isLoading,
    isPostStatsError: postStatsQuery.isError,
    appTitle,
    handleFilterChange,
    handleRefreshStats,
    handleRetryStats,
    handleRetryPostStats,
    handleNavigateAdminPosts,
    handleCheckHealth,
    handleSelectRoleFilter,
    handleViewAllUsers,
    handleOpenAdminUserDetail,
    setFilterQuery,
  };
}

export { useDashboardController as useAdminDashboardController };
export type DashboardController = ReturnType<typeof useDashboardController>;
