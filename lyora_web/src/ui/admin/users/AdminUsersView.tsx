import React from 'react';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  formatDate,
  LoadingSpinner,
} from '@/core';
import type {
  AdminUserOnlineFilter,
  AdminUserRoleTab,
  AdminUserStatusFilter,
} from '@/features/user';
import {
  CloseIcon,
  LockIcon,
  RefreshIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from '../components/AdminIcons';
import {
  useAdminUsersController,
  type AdminUserSortOption,
} from './admin-users.controller';
import { CreateUserModal } from './CreateUserModal';

const ROLE_TABS: Array<{ id: AdminUserRoleTab; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'CLIENT', label: 'Người dùng' },
  { id: 'ADMIN', label: 'Quản trị' },
];

const ROLE_LABELS: Record<'CLIENT' | 'ADMIN', string> = {
  CLIENT: 'Người dùng',
  ADMIN: 'Quản trị',
};

export const AdminUsersView: React.FC = () => {
  const ctrl = useAdminUsersController();

  const tabCountMap: Record<AdminUserRoleTab, number> = {
    ALL: ctrl.summary.all,
    CLIENT: ctrl.summary.client,
    ADMIN: ctrl.summary.admin,
  };

  const rangeStart =
    ctrl.meta.totalItems === 0 ? 0 : (ctrl.meta.page - 1) * ctrl.meta.limit + 1;
  const rangeEnd = Math.min(
    ctrl.meta.page * ctrl.meta.limit,
    ctrl.meta.totalItems,
  );

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-muted tabular-nums flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Tổng {ctrl.summary.all.toLocaleString('vi-VN')} tài khoản ·{' '}
              {ctrl.summary.online.toLocaleString('vi-VN')} đang trực tuyến ·{' '}
              {ctrl.summary.locked.toLocaleString('vi-VN')} tài khoản bị khóa
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span
                aria-hidden="true"
                className={[
                  'h-1.5 w-1.5 rounded-full',
                  ctrl.isRefreshingOnlineStatus ? 'bg-primary animate-pulse' : 'bg-success',
                ].join(' ')}
              />
              {ctrl.isRefreshingOnlineStatus
                ? 'Đang đồng bộ trạng thái...'
                : 'Tự động cập nhật mỗi 15 giây'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            isLoading={ctrl.isFetching && !ctrl.isLoading}
            onClick={() => void ctrl.handleRefresh()}
            className="h-9 px-3 py-1.5 text-xs gap-1.5 border-border bg-card text-foreground hover:bg-background"
          >
            {!(ctrl.isFetching && !ctrl.isLoading) && (
              <RefreshIcon className="w-3.5 h-3.5 text-muted" />
            )}
            <span>Làm mới</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={ctrl.handleOpenCreateModal}
            className="h-9 px-3.5 py-1.5 text-xs gap-1.5"
          >
            <UserPlusIcon className="w-3.5 h-3.5" />
            <span>Tạo tài khoản</span>
          </Button>
        </div>
      </header>

      {/* Underline Role Tabs */}
      <div
        role="tablist"
        aria-label="Phân nhóm tài khoản"
        className="flex items-center gap-6 border-b border-border overflow-x-auto"
      >
        {ROLE_TABS.map((tab) => {
          const isSelected = ctrl.activeRoleTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => ctrl.handleSelectRoleTab(tab.id)}
              className={[
                'relative inline-flex items-center gap-2 pb-3 text-sm whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-t-md',
                isSelected
                  ? 'text-primary font-semibold'
                  : 'text-muted font-medium hover:text-foreground',
              ].join(' ')}
            >
              <span>{tab.label}</span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs tabular-nums',
                  isSelected
                    ? 'bg-secondary text-primary font-semibold'
                    : 'bg-card border border-border text-muted',
                ].join(' ')}
              >
                {tabCountMap[tab.id].toLocaleString('vi-VN')}
              </span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <section
        aria-label="Bộ lọc và tìm kiếm người dùng"
        className="rounded-xl border border-border bg-card p-4 space-y-3"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={ctrl.searchQuery}
              onChange={ctrl.handleSearchChange}
              placeholder="Tìm kiếm theo họ tên hoặc email..."
              aria-label="Tìm kiếm người dùng theo họ tên hoặc email"
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {ctrl.searchQuery && (
              <button
                type="button"
                onClick={ctrl.handleClearSearch}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground cursor-pointer"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              aria-label="Lọc trạng thái tài khoản"
              value={ctrl.statusFilter}
              onChange={(e) =>
                ctrl.handleStatusFilterChange(
                  e.target.value as AdminUserStatusFilter,
                )
              }
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="ACTIVE">Chỉ tài khoản đang hoạt động</option>
              <option value="LOCKED">Chỉ tài khoản đã khóa</option>
            </select>

            <select
              aria-label="Lọc trạng thái trực tuyến"
              value={ctrl.onlineFilter}
              onChange={(e) =>
                ctrl.handleOnlineFilterChange(
                  e.target.value as AdminUserOnlineFilter,
                )
              }
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="ALL">Trực tuyến: Tất cả</option>
              <option value="ONLINE">Đang trực tuyến</option>
              <option value="OFFLINE">Ngoại tuyến</option>
            </select>

            <select
              aria-label="Sắp xếp danh sách người dùng"
              value={ctrl.sortOption}
              onChange={(e) =>
                ctrl.handleSortOptionChange(e.target.value as AdminUserSortOption)
              }
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="createdAt:DESC">Sắp xếp: Mới tạo nhất</option>
              <option value="createdAt:ASC">Sắp xếp: Tạo lâu nhất</option>
              <option value="fullName:ASC">Sắp xếp: Tên A → Z</option>
              <option value="isOnline:DESC">Sắp xếp: Trực tuyến trước</option>
            </select>
          </div>
        </div>

        {ctrl.hasActiveFilter && (
          <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted">
            <span>
              Đang áp dụng bộ lọc · Tìm thấy{' '}
              <strong className="text-foreground tabular-nums">
                {ctrl.meta.totalItems.toLocaleString('vi-VN')}
              </strong>{' '}
              tài khoản phù hợp
            </span>
            <button
              type="button"
              onClick={ctrl.handleResetFilters}
              className="font-medium text-primary hover:text-primary-hover hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </section>

      {/* Main Table / States */}
      {ctrl.isLoading ? (
        <div
          role="status"
          aria-label="Đang tải danh sách người dùng"
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="h-0.5 w-full bg-secondary overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-primary animate-indeterminate-bar" />
          </div>

          <div className="px-5 py-3 border-b border-border bg-background/60 flex items-center gap-2 text-xs font-medium text-muted">
            <LoadingSpinner size="sm" />
            <span>Đang tải danh sách người dùng...</span>
          </div>

          <div className="hidden md:block">
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3.5 grid grid-cols-12 items-center gap-4 animate-pulse"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/60" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-36 rounded bg-secondary/60" />
                      <div className="h-3 w-48 rounded bg-border/80" />
                    </div>
                  </div>
                  <div className="col-span-2 h-5 w-20 rounded-md bg-border/80" />
                  <div className="col-span-2 h-4 w-24 rounded bg-border/80" />
                  <div className="col-span-2 h-5 w-24 rounded-full bg-border/80" />
                  <div className="col-span-1 ml-auto h-3.5 w-16 rounded bg-border/80" />
                  <div className="col-span-1 ml-auto h-7 w-20 rounded-lg bg-secondary/50" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:hidden divide-y divide-border">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-2.5 animate-pulse">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/60" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-36 rounded bg-secondary/60" />
                      <div className="h-3 w-44 rounded bg-border/80" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded-full bg-border/80" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-28 rounded bg-border/80" />
                  <div className="h-3 w-20 rounded bg-border/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : ctrl.isError ? (
        <ErrorState
          title="Không thể tải danh sách người dùng"
          description="Đã xảy ra lỗi khi kết nối tới hệ thống. Vui lòng thử lại."
          onRetry={() => void ctrl.handleRefresh()}
        />
      ) : ctrl.items.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-6 h-6" />}
          title={
            ctrl.hasActiveFilter
              ? 'Không tìm thấy người dùng phù hợp'
              : 'Chưa có tài khoản người dùng nào'
          }
          description={
            ctrl.hasActiveFilter
              ? 'Hãy thử thay đổi từ khóa tìm kiếm, tab vai trò hoặc bộ lọc trạng thái.'
              : 'Hệ thống chưa ghi nhận tài khoản nào trong cơ sở dữ liệu.'
          }
          action={
            ctrl.hasActiveFilter
              ? {
                  label: 'Đặt lại bộ lọc',
                  onClick: ctrl.handleResetFilters,
                  variant: 'outline',
                }
              : {
                  label: 'Làm mới',
                  onClick: () => void ctrl.handleRefresh(),
                  variant: 'outline',
                }
          }
        />
      ) : (
        <div
          aria-busy={ctrl.isTransitioningData}
          className="relative rounded-xl border border-border bg-card overflow-hidden"
        >
          {ctrl.isTransitioningData && (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-20 h-0.5 bg-secondary overflow-hidden"
              >
                <div className="h-full w-1/3 rounded-full bg-primary animate-indeterminate-bar" />
              </div>
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-x-0 top-14 z-20 flex justify-center pointer-events-none px-4"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
                  <LoadingSpinner size="sm" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              </div>
            </>
          )}

          {/* Desktop Flat Table */}
          <div
            className={[
              'hidden md:block overflow-x-auto transition-opacity duration-150',
              ctrl.isTransitioningData ? 'opacity-50 pointer-events-none select-none' : '',
            ].join(' ')}
          >
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-background/60">
                  <th className="py-3 px-5 text-xs font-semibold text-muted">Người dùng</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted">Vai trò</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted">Trực tuyến</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted">Trạng thái</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted text-right">
                    Ngày tạo
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-muted text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ctrl.items.map((account) => {
                  const displayName = account.fullName?.trim() || 'Chưa cập nhật tên';
                  const initial = displayName.charAt(0).toUpperCase();
                  const isLocked = !account.isActive;

                  return (
                    <tr
                      key={account.id}
                      onClick={() => ctrl.handleOpenUserDetail(account.id)}
                      className={[
                        'transition-colors cursor-pointer',
                        isLocked
                          ? 'bg-background/40 hover:bg-background/80'
                          : 'hover:bg-background/70',
                      ].join(' ')}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {account.avatarUrl ? (
                              <AppImage
                                src={account.avatarUrl}
                                alt={displayName}
                                rounded
                                className="h-10 w-10 border border-border"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-primary">
                                {initial}
                              </div>
                            )}
                            <span
                              title={account.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                              className={[
                                'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card',
                                account.isOnline ? 'bg-success' : 'bg-muted/50',
                              ].join(' ')}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[260px]">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted truncate max-w-[260px]">
                              {account.email}
                            </p>
                            {isLocked && account.lockReason && (
                              <p className="text-xs text-error truncate max-w-[300px] mt-0.5">
                                Lý do: {account.lockReason}
                              </p>
                            )}
                          </div>
                        </div>
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
                        <span
                          className={[
                            'inline-flex items-center gap-1.5 text-xs font-medium',
                            account.isOnline ? 'text-success' : 'text-muted',
                          ].join(' ')}
                        >
                          <span
                            aria-hidden="true"
                            className={[
                              'h-2 w-2 rounded-full',
                              account.isOnline ? 'bg-success' : 'bg-muted/50',
                            ].join(' ')}
                          />
                          {account.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {account.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
                            <LockIcon className="w-3 h-3" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-muted tabular-nums whitespace-nowrap">
                        {account.createdAt ? formatDate(account.createdAt) : 'Chưa rõ'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            ctrl.handleOpenUserDetail(account.id);
                          }}
                          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Rows */}
          <ul
            className={[
              'md:hidden divide-y divide-border transition-opacity duration-150',
              ctrl.isTransitioningData ? 'opacity-50 pointer-events-none select-none' : '',
            ].join(' ')}
          >
            {ctrl.items.map((account) => {
              const displayName = account.fullName?.trim() || 'Chưa cập nhật tên';
              const initial = displayName.charAt(0).toUpperCase();
              const isLocked = !account.isActive;

              return (
                <li
                  key={account.id}
                  className={isLocked ? 'bg-background/40 p-4' : 'p-4'}
                >
                  <button
                    type="button"
                    onClick={() => ctrl.handleOpenUserDetail(account.id)}
                    className="w-full text-left space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {account.avatarUrl ? (
                            <AppImage
                              src={account.avatarUrl}
                              alt={displayName}
                              rounded
                              className="h-10 w-10 border border-border"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-primary">
                              {initial}
                            </div>
                          )}
                          <span
                            className={[
                              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card',
                              account.isOnline ? 'bg-success' : 'bg-muted/50',
                            ].join(' ')}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted truncate">{account.email}</p>
                        </div>
                      </div>

                      {account.isActive ? (
                        <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error">
                          Đã khóa
                        </span>
                      )}
                    </div>

                    {isLocked && account.lockReason && (
                      <p className="text-xs text-error line-clamp-2">
                        Lý do: {account.lockReason}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>
                        {ROLE_LABELS[account.role] ?? account.role} ·{' '}
                        {account.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                      </span>
                      <span className="tabular-nums">
                        {account.createdAt ? formatDate(account.createdAt) : 'Chưa rõ'}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Pagination Footer */}
          <div className="border-t border-border px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-background/40">
            <span className="text-xs text-muted tabular-nums">
              Hiển thị {rangeStart}–{rangeEnd} trong tổng số{' '}
              {ctrl.meta.totalItems.toLocaleString('vi-VN')} tài khoản
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!ctrl.meta.hasPrevPage || ctrl.isFetching}
                onClick={() => ctrl.handlePageChange(ctrl.meta.page - 1)}
                className="h-8 px-3 py-1 text-xs"
              >
                Trang trước
              </Button>
              <span className="text-xs font-medium text-foreground tabular-nums px-1">
                Trang {ctrl.meta.page} / {ctrl.meta.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={!ctrl.meta.hasNextPage || ctrl.isFetching}
                onClick={() => ctrl.handlePageChange(ctrl.meta.page + 1)}
                className="h-8 px-3 py-1 text-xs"
              >
                Trang sau
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={ctrl.isCreateModalOpen}
        isSubmitting={ctrl.isCreatingUser}
        apiError={ctrl.createUserError}
        onClose={ctrl.handleCloseCreateModal}
        onSubmit={ctrl.handleCreateUser}
      />
    </div>
  );
};

export default AdminUsersView;
