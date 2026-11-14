import React, { useMemo } from 'react';
import { Button, formatDate } from '@/core';
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
        const emailMatch = item.email.toLowerCase().includes(normalizedQuery);
        return nameMatch || emailMatch;
      })
      .slice(0, 4);
  }, [stats?.recentUsers, debouncedFilter, activeRoleFilter]);

  if (isLoading) {
    return (
      <section aria-label="Đang tải thống kê người dùng" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[0, 1, 2, 3].map((slot) => (
            <div key={slot} className="p-5 space-y-2.5">
              <div className="h-3.5 w-28 rounded bg-background" />
              <div className="h-8 w-20 rounded bg-background" />
              <div className="h-3 w-36 rounded bg-background" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          <div className="xl:col-span-8 rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-5 w-48 rounded bg-background" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 w-full rounded bg-background" />
            ))}
          </div>
          <div className="xl:col-span-4 rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-5 w-36 rounded bg-background" />
            <div className="h-24 w-full rounded bg-background" />
            <div className="h-28 w-full rounded bg-background" />
          </div>
        </div>
      </section>
    );
  }

  if (isError && !stats) {
    return (
      <section
        aria-label="Lỗi tải thống kê người dùng"
        className="rounded-xl border border-error/30 bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            Không thể tải dữ liệu thống kê người dùng
          </h2>
          <p className="text-sm text-muted">
            Kết nối tới máy chủ gặp gián đoạn hoặc phiên làm việc chưa hợp lệ. Vui lòng thử tải lại.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="shrink-0 px-3 py-1.5 text-xs">
          Thử lại
        </Button>
      </section>
    );
  }

  if (!stats || stats.totalUsers === 0) {
    return (
      <section
        aria-label="Chưa có dữ liệu người dùng"
        className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Chưa có tài khoản nào</h2>
          <p className="text-sm text-muted">
            Hệ thống chưa ghi nhận tài khoản người dùng nào trong cơ sở dữ liệu.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} className="shrink-0 px-3 py-1.5 text-xs">
          Kiểm tra lại
        </Button>
      </section>
    );
  }

  const activePct = toPercent(stats.activeCount, stats.totalUsers);
  const clientPct = toPercent(stats.clientCount, stats.totalUsers);
  const adminPct = toPercent(stats.adminCount, stats.totalUsers);
  const hasFilterActive = activeRoleFilter !== 'ALL' || filterQuery.trim().length > 0;

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

      {/* Main Analytics Split (cân bằng chiều cao 2 cột trên desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Recent Users Directory (limit = 4) */}
        <div className="xl:col-span-8 rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full">
          <div className="p-4 sm:p-5 border-b border-border space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tài khoản đăng ký gần đây</h3>
                <p className="text-xs text-muted mt-0.5 tabular-nums">
                  Hiển thị {filteredRecentUsers.length} tài khoản mới nhất (giới hạn tối đa 4 theo bộ lọc)
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
                          'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'bg-card text-primary border border-border'
                            : 'text-muted hover:text-foreground',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {/* // TODO: Điều hướng sang module quản lý toàn bộ tài khoản (/admin/users) */}
                <Button
                  variant="outline"
                  onClick={onViewAllUsers}
                  className="h-8 px-2.5 py-1 text-xs font-medium border-border bg-card text-primary hover:bg-secondary/50"
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
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={onClearFilter}
                  aria-label="Xóa bộ lọc"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {filteredRecentUsers.length === 0 ? (
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Không có tài khoản nào khớp điều kiện lọc
                </p>
                <p className="text-xs text-muted">
                  Thử đổi nhóm vai trò hoặc xóa từ khóa tìm kiếm để xem danh sách gần đây.
                </p>
                {hasFilterActive && (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => {
                        onSelectRoleFilter('ALL');
                        onClearFilter();
                      }}
                    >
                      Đặt lại bộ lọc
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
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
                        <tr key={account.id} className="hover:bg-background/70 transition-colors">
                          <td className="py-3.5 px-5">
                            <p className="text-sm font-medium text-foreground truncate max-w-[260px]">
                              {account.fullName || 'Chưa cập nhật tên'}
                            </p>
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
                              {ROLE_LABELS[account.role]}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge isActive={account.isActive} />
                          </td>
                          <td className="py-3.5 px-5 text-right text-xs text-muted tabular-nums whitespace-nowrap">
                            {formatDate(account.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Compact List */}
                <ul className="md:hidden divide-y divide-border">
                  {filteredRecentUsers.map((account) => (
                    <li key={account.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {account.fullName || 'Chưa cập nhật tên'}
                          </p>
                          <p className="text-xs text-muted truncate">{account.email}</p>
                        </div>
                        <StatusBadge isActive={account.isActive} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted pt-0.5">
                        <span>{ROLE_LABELS[account.role]}</span>
                        <span className="tabular-nums">{formatDate(account.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Account Structure & Active Health Probe */}
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
                  <span className="text-muted">Thành viên (Client)</span>
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
                  <span className="text-muted">Quản trị viên (Admin)</span>
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
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                      Trực tuyến
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error">
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
                    {systemHealth?.timestamp ? formatDate(systemHealth.timestamp) : 'Chưa có dữ liệu'}
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
                <p className="text-[11px] text-muted tabular-nums">
                  Kiểm tra lúc {formatDate(lastHealthReport.checkedAt)} · Độ trễ {lastHealthReport.durationMs} ms
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background/60 px-3 py-2.5 text-xs text-muted">
                Nhấn <strong className="font-medium text-foreground">Kiểm tra</strong> để gọi trực tiếp API và đo phản hồi máy chủ.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
