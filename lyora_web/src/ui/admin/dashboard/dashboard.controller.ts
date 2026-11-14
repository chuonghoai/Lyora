import { useState, useRef } from 'react';
import { useDebounce, useClickOutside, toast } from '@/core';
import { useSystemHealthQuery, type HealthStatus } from '@/features/system';
import {
  useUserStatisticsQuery,
  type UserRoleFilter,
  type UserStatistics,
} from '@/features/user';

export type { UserRoleFilter };

export interface HealthCheckReport {
  ok: boolean;
  durationMs: number;
  checkedAt: string;
  message: string;
}

export function useDashboardController() {
  const [adminActions, setAdminActions] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatsRefreshing, setIsStatsRefreshing] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [lastHealthReport, setLastHealthReport] = useState<HealthCheckReport | null>(null);
  const [activeRoleFilter, setActiveRoleFilter] = useState<UserRoleFilter>('ALL');

  // TanStack Query Hooks from Data Layer
  const healthQuery = useSystemHealthQuery();
  const userStatsQuery = useUserStatisticsQuery(activeRoleFilter);

  const debouncedFilter = useDebounce(filterQuery, 350);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  // --- Handlers: System & Quick Controls ---
  const handleSimulateSync = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setAdminActions((prev) => prev + 1);
      setIsSubmitting(false);
      toast.success('Đồng bộ dữ liệu cộng đồng thành công.');
    }, 500);
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(e.target.value);
  };

  const handleRefreshStats = async () => {
    setIsStatsRefreshing(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        userStatsQuery.refetch(),
        healthQuery.refetch(),
      ]);
      if (statsRes.isError || healthRes.isError) {
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

  const handleSelectRoleFilter = (filter: UserRoleFilter) => {
    setActiveRoleFilter(filter);
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

  const handleViewAllUsers = () => {
    // TODO: Điều hướng sang module nghiệp vụ quản lý toàn bộ người dùng (/admin/users) khi được triển khai
    toast.info('Module quản lý toàn bộ người dùng (/admin/users) đang trong kế hoạch triển khai.');
  };

  // --- Handlers: User & RBAC Operations (TODO) ---
  const handleCreateUser = () => {
    // TODO: Mở modal tạo tài khoản thành viên hoặc quản trị viên mới (POST /users)
    toast.info('Tính năng "Thêm thành viên mới" đang được phát triển (// TODO).');
  };

  const handleExportUsers = () => {
    // TODO: Xuất danh sách thành viên cộng đồng định dạng CSV
    toast.info('Tính năng "Xuất danh sách thành viên CSV" đang được phát triển (// TODO).');
  };

  const handleManageRoles = () => {
    // TODO: Điều hướng sang trang cấu hình ma trận phân quyền vai trò (ADMIN, CLIENT)
    toast.info('Tính năng "Phân quyền vai trò (RBAC)" đang được phát triển (// TODO).');
  };

  const handleBatchLockUsers = () => {
    // TODO: Khóa hoặc tạm ngưng hàng loạt tài khoản vi phạm tiêu chuẩn cộng đồng
    toast.info('Tính năng "Khóa tài khoản vi phạm hàng loạt" đang được phát triển (// TODO).');
  };

  // --- Handlers: Content & Moderation Operations (TODO) ---
  const handleCreateAnnouncement = () => {
    // TODO: Đăng bài viết & phát hành thông báo chính thức từ Ban Quản Trị lên bảng tin
    toast.info('Tính năng "Đăng thông báo chính thức" đang được phát triển (// TODO).');
  };

  const handleModeratePosts = () => {
    // TODO: Mở hàng đợi giám sát và kiểm duyệt luồng bài viết cộng đồng
    toast.info('Tính năng "Kiểm duyệt bài viết cộng đồng" đang được phát triển (// TODO).');
  };

  const handleReviewReports = () => {
    // TODO: Tiếp nhận và xử lý các báo cáo vi phạm bài viết / bình luận từ người dùng
    toast.info('Tính năng "Xử lý báo cáo vi phạm" đang được phát triển (// TODO).');
  };

  const handleHideViolatingContent = () => {
    // TODO: Thực hiện khóa hoặc ẩn bài viết vi phạm tiêu chuẩn cộng đồng
    toast.info('Tính năng "Ẩn / Khóa nội dung vi phạm" đang được phát triển (// TODO).');
  };

  // --- Handlers: Communication & Community Features (TODO) ---
  const handleManageFeatureFlags = () => {
    // TODO: Bật/tắt các tính năng của trang web (Đăng bài, Nhắn tin 1-1/Nhóm, Gọi thoại/Video)
    toast.info('Tính năng "Cấu hình bật/tắt tính năng nền tảng" đang được phát triển (// TODO).');
  };

  const handleMonitorRealtimeSockets = () => {
    // TODO: Giám sát trạng thái kết nối WebSocket, luồng nhắn tin và cuộc gọi thoại/video
    toast.info('Tính năng "Giám sát WebSocket & Nhắn tin Realtime" đang được phát triển (// TODO).');
  };

  const handleManageCommunityGroups = () => {
    // TODO: Quản lý các nhóm cộng đồng, chủ đề chia sẻ và thảo luận nổi bật
    toast.info('Tính năng "Quản lý nhóm cộng đồng" đang được phát triển (// TODO).');
  };

  const handleBroadcastNotification = () => {
    // TODO: Gửi thông báo đẩy (Push Notification) realtime tới toàn bộ người dùng đang online
    toast.info('Tính năng "Phát thông báo đẩy toàn hệ thống" đang được phát triển (// TODO).');
  };

  // --- Handlers: Infrastructure & Security Operations (TODO) ---
  const handlePurgeCache = () => {
    // TODO: Gửi yêu cầu làm mới bộ nhớ cache Redis (POST /system/purge-cache)
    toast.info('Tính năng "Làm mới cache Redis" đang được phát triển (// TODO).');
  };

  const handleBackupDatabase = () => {
    // TODO: Kích hoạt tạo snapshot backup cơ sở dữ liệu PostgreSQL tức thì
    toast.info('Tính năng "Sao lưu cơ sở dữ liệu snapshot" đang được phát triển (// TODO).');
  };

  const handleViewAuditLogs = () => {
    // TODO: Mở màn hình nhật ký truy vết hoạt động quản trị và audit logs hệ thống
    toast.info('Tính năng "Nhật ký truy vết an ninh (Audit Logs)" đang được phát triển (// TODO).');
  };

  const handleConfigureSecurity = () => {
    // TODO: Cấu hình giới hạn brute-force, chính sách mật khẩu và xác thực OTP
    toast.info('Tính năng "Cấu hình chính sách bảo mật hệ thống" đang được phát triển (// TODO).');
  };

  return {
    // States
    adminActions,
    filterQuery,
    debouncedFilter,
    isMenuOpen,
    isSubmitting,
    isStatsRefreshing,
    isCheckingHealth,
    lastHealthReport,
    activeRoleFilter,
    menuRef,
    systemHealth: (healthQuery.data as HealthStatus | undefined) ?? null,
    isHealthLoading: healthQuery.isLoading,
    isHealthError: healthQuery.isError,
    userStats: (userStatsQuery.data as UserStatistics | undefined) ?? null,
    isStatsLoading: userStatsQuery.isLoading,
    isStatsError: userStatsQuery.isError,
    statsError: userStatsQuery.error,
    appTitle,

    // Handlers
    handleSimulateSync,
    handleToggleMenu,
    handleFilterChange,
    handleRefreshStats,
    handleCheckHealth,
    handleViewAllUsers,
    handleSelectRoleFilter,
    setFilterQuery,
    toggleMenu: handleToggleMenu,

    // Action Hub Handlers (TODO)
    handleCreateUser,
    handleExportUsers,
    handleManageRoles,
    handleBatchLockUsers,
    handleCreateAnnouncement,
    handleModeratePosts,
    handleReviewReports,
    handleHideViolatingContent,
    handleManageFeatureFlags,
    handleMonitorRealtimeSockets,
    handleManageCommunityGroups,
    handleBroadcastNotification,
    handlePurgeCache,
    handleBackupDatabase,
    handleViewAuditLogs,
    handleConfigureSecurity,
  };
}

export { useDashboardController as useAdminDashboardController };
export type DashboardController = ReturnType<typeof useDashboardController>;
