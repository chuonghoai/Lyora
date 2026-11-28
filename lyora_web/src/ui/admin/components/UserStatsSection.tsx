import React, { useMemo } from 'react';
import { Button, EmptyState, ErrorState, formatDate, formatDateTime } from '@/core';
import type { HealthStatus } from '@/features/system';
import type { UserStatistics, RecentUserSummary } from '@/features/user';
import type { HealthCheckReport, UserRoleFilter } from '../dashboard/dashboard.controller';
import { CloseIcon, LockIcon, RefreshIcon, SearchIcon } from './AdminIcons';

interface UserStatsSectionProps {
  stats: UserStatistics | null;
  isLoading: boolean;
  isError: boolean;
  systemHealth: HealthStatus | null;
  isHealthLoading: boolean;
  isHealthError: boolean;
  isCheckingHealth: boolean;
  lastHealthReport: HealthCheckReport | null;
  filterQuery: string;
  debouncedFilter: string;
  activeRoleFilter: UserRoleFilter;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFilter: () => void;
  onSelectRoleFilter: (filter: UserRoleFilter) => void;
  onViewAllUsers: () => void;
  onSelectUser: (userId: string) => void;
  onCheckHealth: () => void;
  onRefresh: () => void;
}

const ROLE_FILTER_OPTIONS: { value: UserRoleFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CLIENT', label: 'Thành viên' },
  { value: 'ADMIN', label: 'Quản trị' },
];

const ROLE_LABELS: Record<RecentUserSummary['role'], string> = {
  ADMIN: 'Quản trị',
  CLIENT: 'Thành viên',
};

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
        Hoạt động
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
      <LockIcon className="w-3 h-3" />
      Đã khóa
    </span>
  );
};

const ApiHealthPanel: React.FC<{
  systemHealth: HealthStatus | null;
  isHealthLoading: boolean;
  isHealthError: boolean;
  isCheckingHealth: boolean;
  lastHealthReport: HealthCheckReport | null;
  onCheckHealth: () => void;
}> = ({
  systemHealth,
  isHealthLoading,
  isHealthError,
  isCheckingHealth,
  lastHealthReport,
  onCheckHealth,
}) => {
  return (
    <div className="flex-1 rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              Tình trạng máy chủ API
            </h3>
            {isHealthLoading ? (
              <span className="text-xs text-muted">Đang kiểm tra...</span>
            ) : !isHealthError && systemHealth?.status === 'ok' ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                Trực tuyến
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-error" />
                Gián đoạn
              </span>
            )}
          </div>

          <Button
            variant="outline"
            isLoading={isCheckingHealth}
            onClick={onCheckHealth}
            className="h-8 shrink-0 px-2.5 py-1 text-xs gap-1.5 border-border bg-card text-foreground hover:bg-background"
          >
            {!isCheckingHealth && <RefreshIcon className="w-3.5 h-3.5 text-muted" />}
            <span>Kiểm tra</span>
          </Button>
        </div>

        <dl className="divide-y divide-border text-xs">
          <div className="py-2 flex items-center justify-between gap-2">
            <dt className="text-muted">Endpoint kiểm tra</dt>
            <dd className="font-mono text-foreground">/health</dd>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <dt className="text-muted">Phản hồi gần nhất</dt>
            <dd className="text-foreground tabular-nums">
              {!isHealthError && systemHealth?.timestamp
                ? formatDateTime(systemHealth.timestamp)
                : 'Chưa có phản hồi'}
            </dd>
          </div>
        </dl>
      </div>

      {lastHealthReport ? (
        <div
          className={[
            'rounded-lg border px-3 py-2.5 text-xs space-y-1',
            lastHealthReport.ok
              ? 'border-success/30 bg-success/10 text-foreground'
              : 'border-error/30 bg-error/10 text-error',
          ].join(' ')}
        >
          <p className="font-medium">{lastHealthReport.message}</p>
          <p className="text-xs text-muted tabular-nums">
            Kiểm tra lúc {formatDateTime(lastHealthReport.checkedAt)} · Độ trễ{' '}
            {lastHealthReport.durationMs} ms
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card px-3 py-2.5 text-xs text-muted">
          Nhấn <strong className="font-medium text-foreground">Kiểm tra</strong> để gọi trực tiếp API và đo phản hồi máy chủ.
        </div>
      )}
    </div>
  );
};

export const UserStatsSection: React.FC<UserStatsSectionProps> = ({
  stats,
  isLoading,
  isError,
  systemHealth,
  isHealthLoading,
  isHealthError,
  isCheckingHealth,
  lastHealthReport,
  filterQuery,
  debouncedFilter,
  activeRoleFilter,
  onFilterChange,
  onClearFilter,
  onSelectRoleFilter,
  onViewAllUsers,
  onSelectUser,
  onCheckHealth,
  onRefresh,
}) => {
  const filteredRecentUsers = useMemo(() => {
    const list = stats?.recentUsers ?? [];
    const normalizedQuery = debouncedFilter.trim().toLowerCase();

    return list
      .filter((item) => {
        const matchesRole = activeRoleFilter === 'ALL' || item.role === activeRoleFilter;
        if (!matchesRole) return false;

        if (!normalizedQuery) return true;
        const nameMatch = (item.fullName ?? '').toLowerCase().includes(normalizedQuery);
        const emailMatch = (item.email ?? '').toLowerCase().includes(normalizedQuery);
        return nameMatch || emailMatch;
      })
      .slice(0, 4);
  }, [stats?.recentUsers, debouncedFilter, activeRoleFilter]);

  if (isLoading) {
    return (
      <section aria-label="Đang tải thống kê người dùng" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[0, 1, 2, 3].map((slot) => (
            <div key={slot} className="p-5 space-y-2.5 animate-pulse">
              <div className="h-3.5 w-28 rounded-lg bg-secondary/50" />
              <div className="h-8 w-20 rounded-lg bg-secondary/50" />
              <div className="h-3 w-36 rounded-lg bg-border/70" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          <div className="xl:col-span-8 rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
            <div className="h-5 w-48 rounded-lg bg-secondary/50" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 w-full rounded-lg bg-border/70" />
            ))}
          </div>
          <div className="xl:col-span-4 flex flex-col gap-5">
            <ApiHealthPanel
              systemHealth={systemHealth}
              isHealthLoading={isHealthLoading}
              isHealthError={isHealthError}
              isCheckingHealth={isCheckingHealth}
              lastHealthReport={lastHealthReport}
              onCheckHealth={onCheckHealth}
            />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section aria-label="Lỗi tải thống kê người dùng" className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8">
          <ErrorState
            title="Không thể tải dữ liệu thống kê người dùng"
            description="Kết nối tới máy chủ gặp gián đoạn hoặc phiên làm việc chưa hợp lệ. Vui lòng thử tải lại."
            onRetry={onRefresh}
            className="h-full"
          />
        </div>
        <div className="xl:col-span-4 flex flex-col">
          <ApiHealthPanel
            systemHealth={systemHealth}
            isHealthLoading={isHealthLoading}
            isHealthError={isHealthError}
            isCheckingHealth={isCheckingHealth}
            lastHealthReport={lastHealthReport}
            onCheckHealth={onCheckHealth}
          />
        </div>
      </section>
    );
  }

  if (!stats || stats.totalUsers === 0) {
    const isFilteredByRole = activeRoleFilter !== 'ALL';
    return (
      <section aria-label="Chưa có dữ liệu người dùng" className="space-y-4">
        {isFilteredByRole && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-xs font-medium text-muted">Đang lọc theo vai trò:</span>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
              {ROLE_FILTER_OPTIONS.map((option) => {
                const active = activeRoleFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelectRoleFilter(option.value)}
                    className={[
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                      active
                        ? 'bg-card text-primary border border-border'
                        : 'text-foreground/75 hover:text-foreground',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          <div className="xl:col-span-8">
            <EmptyState
              title={
                isFilteredByRole
                  ? 'Chưa có tài khoản thuộc vai trò này'
                  : 'Chưa có tài khoản nào'
              }
              description={
                isFilteredByRole
                  ? 'Không có tài khoản nào phù hợp với vai trò đang chọn.'
                  : 'Hệ thống chưa ghi nhận tài khoản người dùng nào trong cơ sở dữ liệu.'
              }
              action={
                isFilteredByRole
                  ? {
                      label: 'Xem tất cả vai trò',
                      onClick: () => onSelectRoleFilter('ALL'),
                      variant: 'primary',
                    }
                  : {
                      label: 'Kiểm tra lại',
                      onClick: onRefresh,
                      variant: 'outline',
                    }
              }
              className="h-full"
            />
          </div>
          <div className="xl:col-span-4 flex flex-col">
            <ApiHealthPanel
              systemHealth={systemHealth}
              isHealthLoading={isHealthLoading}
              isHealthError={isHealthError}
              isCheckingHealth={isCheckingHealth}
              lastHealthReport={lastHealthReport}
              onCheckHealth={onCheckHealth}
            />
          </div>
        </div>
      </section>
    );
  }

  const activePct = toPercent(stats.activeCount, stats.totalUsers);
  const clientPct = toPercent(stats.clientCount, stats.totalUsers);
  const adminPct = toPercent(stats.adminCount, stats.totalUsers);
  const hasFilterActive = activeRoleFilter !== 'ALL' || filterQuery.trim().length > 0;
  const hasAnyRecentUsers = (stats.recentUsers?.length ?? 0) > 0;

  return (
    <section aria-labelledby="user-stats-heading" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="user-stats-heading" className="text-base font-semibold text-foreground">
          Thống kê người dùng
        </h2>
        <span className="text-xs text-muted">Nguồn: API tài khoản hệ thống</span>
      </div>

      {/* 4-cell KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted">Tổng người dùng</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.totalUsers.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-muted">Tất cả tài khoản đã đăng ký</p>
        </div>

        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted">Đang hoạt động</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.activeCount.toLocaleString('vi-VN')}
            </p>
            <span className="text-xs font-semibold text-success tabular-nums">{activePct}%</span>
          </div>
          <p className="text-xs text-muted tabular-nums">
            Đã khóa: {stats.inactiveCount.toLocaleString('vi-VN')} tài khoản
          </p>
        </div>

        <div className="p-5 space-y-1.5 sm:border-t xl:border-t-0 border-border">
          <p className="text-xs font-medium text-muted">Đăng ký mới trong tháng</p>
          <p className="text-2xl font-bold tracking-tight text-primary tabular-nums">
            {stats.newUsersThisMonth.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-muted tabular-nums">
            Hôm nay: {stats.newUsersToday.toLocaleString('vi-VN')} tài khoản
          </p>
        </div>

        <div className="p-5 space-y-1.5 sm:border-t xl:border-t-0 border-border">
          <p className="text-xs font-medium text-muted">Phân nhóm vai trò</p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.clientCount.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-muted tabular-nums">
            Thành viên · {stats.adminCount.toLocaleString('vi-VN')} Quản trị viên
          </p>
        </div>
      </div>

      {/* Main Analytics Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8 rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full">
          <div className="p-4 sm:p-5 border-b border-border space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tài khoản đăng ký gần đây</h3>
                <p className="text-xs text-muted mt-0.5 tabular-nums">
                  Hiển thị {filteredRecentUsers.length} tài khoản mới nhất (tối đa 4 tài khoản)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
                  {ROLE_FILTER_OPTIONS.map((option) => {
                    const active = activeRoleFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelectRoleFilter(option.value)}
                        className={[
                          'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          active
                            ? 'bg-card text-primary border border-border'
                            : 'text-foreground/75 hover:text-foreground',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onViewAllUsers}
                  className="h-8 px-3 py-1 text-xs border-border bg-card text-primary hover:bg-secondary/60"
                >
                  Tất cả
                </Button>
              </div>
            </div>

            <div className="relative">
              <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={filterQuery}
                onChange={onFilterChange}
                placeholder="Lọc nhanh theo tên hoặc email..."
                aria-label="Lọc danh sách tài khoản gần đây"
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={onClearFilter}
                  aria-label="Xóa bộ lọc"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {filteredRecentUsers.length === 0 ? (
              <div className="flex-1 p-6 flex items-center justify-center">
                <EmptyState
                  compact
                  title={
                    hasAnyRecentUsers
                      ? 'Không có tài khoản nào khớp điều kiện lọc'
                      : 'Chưa có tài khoản đăng ký gần đây'
                  }
                  description={
                    hasAnyRecentUsers
                      ? 'Thử đổi nhóm vai trò hoặc xóa từ khóa tìm kiếm để xem danh sách gần đây.'
                      : 'Danh sách tài khoản mới sẽ tự động hiển thị khi có người dùng đăng ký.'
                  }
                  action={
                    hasFilterActive
                      ? {
                          label: 'Đặt lại bộ lọc',
                          onClick: () => {
                            onSelectRoleFilter('ALL');
                            onClearFilter();
                          },
                          variant: 'outline',
                        }
                      : undefined
                  }
                  className="w-full border-none"
                />
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto flex-1">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-background/60">
                        <th className="py-2.5 px-5 text-xs font-medium text-muted">Tài khoản</th>
                        <th className="py-2.5 px-4 text-xs font-medium text-muted">Vai trò</th>
                        <th className="py-2.5 px-4 text-xs font-medium text-muted">Trạng thái</th>
                        <th className="py-2.5 px-5 text-xs font-medium text-muted text-right">
                          Ngày tạo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRecentUsers.map((account) => (
                        <tr
                          key={account.id}
                          onClick={() => onSelectUser(account.id)}
                          className="hover:bg-background/70 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate max-w-[240px]">
                                {account.fullName || 'Chưa cập nhật tên'}
                              </p>
                              {account.isOnline && (
                                <span
                                  title="Đang trực tuyến"
                                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-success"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted truncate max-w-[260px]">{account.email}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={[
                                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
                                account.role === 'ADMIN'
                                  ? 'border-secondary-strong bg-secondary text-primary'
                                  : 'border-border bg-background text-foreground',
                              ].join(' ')}
                            >
                              {ROLE_LABELS[account.role] ?? account.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge isActive={account.isActive} />
                          </td>
                          <td className="py-3.5 px-5 text-right text-xs text-muted tabular-nums whitespace-nowrap">
                            {account.createdAt ? formatDate(account.createdAt) : 'Chưa rõ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="md:hidden divide-y divide-border">
                  {filteredRecentUsers.map((account) => (
                    <li key={account.id} className="p-4">
                      <button
                        type="button"
                        onClick={() => onSelectUser(account.id)}
                        className="w-full text-left space-y-2 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">
                                {account.fullName || 'Chưa cập nhật tên'}
                              </p>
                              {account.isOnline && (
                                <span
                                  title="Đang trực tuyến"
                                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-success"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted truncate">{account.email}</p>
                          </div>
                          <StatusBadge isActive={account.isActive} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted pt-0.5">
                          <span>{ROLE_LABELS[account.role] ?? account.role}</span>
                          <span className="tabular-nums">
                            {account.createdAt ? formatDate(account.createdAt) : 'Chưa rõ'}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-5 h-full">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shrink-0">
            <h3 className="text-sm font-semibold text-foreground">Cơ cấu tài khoản thực tế</h3>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Tỷ lệ đang hoạt động</span>
                <span className="text-muted tabular-nums">
                  {stats.activeCount}/{stats.totalUsers} ({activePct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-background overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-300"
                  style={{ width: `${activePct}%` }}
                />
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Tài khoản thành viên</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {stats.clientCount} ({clientPct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${clientPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Tài khoản quản trị</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {stats.adminCount} ({adminPct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary-strong transition-[width] duration-300"
                    style={{ width: `${adminPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <ApiHealthPanel
            systemHealth={systemHealth}
            isHealthLoading={isHealthLoading}
            isHealthError={isHealthError}
            isCheckingHealth={isCheckingHealth}
            lastHealthReport={lastHealthReport}
            onCheckHealth={onCheckHealth}
          />
        </div>
      </div>
    </section>
  );
};
