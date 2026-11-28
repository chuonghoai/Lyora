import React from 'react';
import { Button, ErrorState } from '@/core';
import type {
  AdminPostAuthorRoleFilter,
  AdminPostMediaFilter,
  AdminPostStatusFilter,
  AdminPostVisibilityFilter,
} from '@/features/posts';
import {
  CloseIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
} from '../components/AdminIcons';
import { useAdminPostsController } from './admin-posts.controller';
import { AdminCreatePostModal } from './AdminCreatePostModal';
import { AdminModerationModal } from './AdminModerationModal';
import { AdminPostDetailModal } from './AdminPostDetailModal';
import { AdminPostsTable } from './AdminPostsTable';

const STATUS_FILTER_OPTIONS: { value: AdminPostStatusFilter; label: string }[] =
  [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'ACTIVE', label: 'Đang hiển thị' },
    { value: 'HIDDEN', label: 'Đã ẩn' },
  ];

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export const AdminPostsView: React.FC = () => {
  const controller = useAdminPostsController();
  const stats = controller.stats;
  const activePct = stats ? toPercent(stats.activePosts, stats.totalPosts) : 0;
  const publicPct = stats
    ? toPercent(stats.visibilityBreakdown.PUBLIC, stats.totalPosts)
    : 0;
  const friendsPct = stats
    ? toPercent(stats.visibilityBreakdown.FRIENDS, stats.totalPosts)
    : 0;
  const privatePct = stats
    ? Math.max(0, 100 - publicPct - friendsPct)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border px-5 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý bài viết
          </h1>
          <p className="text-sm text-muted">
            Giám sát luồng bài viết cộng đồng, xử lý nội dung vi phạm và phát hành thông báo chính thức.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            isLoading={controller.isManualRefreshing}
            onClick={() => void controller.handleRefreshAll()}
            className="h-9 px-3 py-1.5 text-xs gap-1.5"
          >
            {!controller.isManualRefreshing && (
              <RefreshIcon className="w-3.5 h-3.5 text-muted" />
            )}
            <span>Làm mới</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={controller.handleOpenCreateModal}
            className="h-9 px-3.5 py-1.5 text-xs gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Đăng bài quản trị</span>
          </Button>
        </div>
      </header>

      {/* 4-Cell Divided KPI Ledger Strip */}
      {controller.isStatsLoading ? (
        <div
          aria-label="Đang tải thống kê bài viết"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border"
        >
          {[0, 1, 2, 3].map((slot) => (
            <div key={slot} className="p-5 space-y-2.5 animate-pulse">
              <div className="h-3.5 w-28 rounded bg-secondary/50" />
              <div className="h-7 w-20 rounded bg-secondary/50" />
              <div className="h-3 w-40 rounded bg-border/70" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <section aria-label="Chỉ số tổng quan bài viết">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden">
            <button
              type="button"
              aria-pressed={controller.statusFilter === 'ALL'}
              onClick={() => controller.handleSelectStatusFilter('ALL')}
              className={`relative p-5 text-left space-y-2 transition-colors cursor-pointer hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${
                controller.statusFilter === 'ALL' ? 'bg-background/35' : ''
              }`}
            >
              {controller.statusFilter === 'ALL' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                />
              )}
              <p className="text-xs font-medium text-muted">Tổng bài viết</p>
              <p className="text-[28px] leading-tight font-semibold tracking-tight text-foreground tabular-nums">
                {stats.totalPosts.toLocaleString('vi-VN')}
              </p>
              {stats.totalPosts > 0 && (
                <div
                  aria-hidden="true"
                  className="flex h-1.5 w-full overflow-hidden rounded-full bg-background gap-px"
                >
                  {publicPct > 0 && (
                    <span
                      style={{ width: `${publicPct}%` }}
                      className="bg-primary"
                    />
                  )}
                  {friendsPct > 0 && (
                    <span
                      style={{ width: `${friendsPct}%` }}
                      className="bg-info"
                    />
                  )}
                  {privatePct > 0 && (
                    <span
                      style={{ width: `${privatePct}%` }}
                      className="bg-muted/60"
                    />
                  )}
                </div>
              )}
              <p className="text-xs text-muted tabular-nums">
                Công khai {stats.visibilityBreakdown.PUBLIC} · Bạn bè{' '}
                {stats.visibilityBreakdown.FRIENDS} · Riêng tư{' '}
                {stats.visibilityBreakdown.PRIVATE}
              </p>
            </button>

            <button
              type="button"
              aria-pressed={controller.statusFilter === 'ACTIVE'}
              onClick={() => controller.handleSelectStatusFilter('ACTIVE')}
              className={`relative p-5 text-left space-y-2 transition-colors cursor-pointer hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${
                controller.statusFilter === 'ACTIVE' ? 'bg-secondary/20' : ''
              }`}
            >
              {controller.statusFilter === 'ACTIVE' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                />
              )}
              <p className="text-xs font-medium text-muted">Đang hiển thị</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[28px] leading-tight font-semibold tracking-tight text-foreground tabular-nums">
                  {stats.activePosts.toLocaleString('vi-VN')}
                </p>
                <span className="rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success tabular-nums">
                  {activePct}%
                </span>
              </div>
              <p className="text-xs text-muted tabular-nums">
                Đính kèm phương tiện:{' '}
                {stats.withMediaCount.toLocaleString('vi-VN')} bài
              </p>
            </button>

            <button
              type="button"
              aria-pressed={controller.statusFilter === 'HIDDEN'}
              onClick={() => controller.handleSelectStatusFilter('HIDDEN')}
              className={`relative p-5 text-left space-y-2 sm:border-t xl:border-t-0 border-border transition-colors cursor-pointer hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${
                controller.statusFilter === 'HIDDEN' ? 'bg-secondary/20' : ''
              }`}
            >
              {controller.statusFilter === 'HIDDEN' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                />
              )}
              <p className="text-xs font-medium text-muted">Đã ẩn kiểm duyệt</p>
              <p
                className={`text-[28px] leading-tight font-semibold tracking-tight tabular-nums ${
                  stats.hiddenPosts > 0 ? 'text-warning' : 'text-foreground'
                }`}
              >
                {stats.hiddenPosts.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-muted">
                {stats.hiddenPosts > 0
                  ? 'Nhấn để lọc các bài đang bị ẩn'
                  : 'Không có bài viết đang bị ẩn'}
              </p>
            </button>

            <div className="p-5 space-y-2 sm:border-t xl:border-t-0 border-border">
              <p className="text-xs font-medium text-muted">
                Đăng mới trong tháng
              </p>
              <p className="text-[28px] leading-tight font-semibold tracking-tight text-primary tabular-nums">
                {stats.postsThisMonth.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-muted tabular-nums">
                Hôm nay: {stats.postsToday.toLocaleString('vi-VN')} · Ban quản
                trị: {stats.adminPostsCount.toLocaleString('vi-VN')} bài
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Main List Card (Filters + Adaptive Table) */}
      <section
        aria-label="Danh sách bài viết hệ thống"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Filter Toolbar */}
        <div className="border-b border-border p-4 sm:p-5 space-y-3 bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Segmented Control */}
            <div
              role="tablist"
              aria-label="Lọc theo trạng thái kiểm duyệt"
              className="inline-flex self-start rounded-lg border border-border bg-background p-1"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => {
                const active = controller.statusFilter === opt.value;
                const count =
                  stats === null
                    ? null
                    : opt.value === 'ALL'
                      ? stats.totalPosts
                      : opt.value === 'ACTIVE'
                        ? stats.activePosts
                        : stats.hiddenPosts;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => controller.handleSelectStatusFilter(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? 'bg-card text-primary border border-border shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {count !== null && (
                      <span
                        className={`tabular-nums text-[11px] ${
                          active ? 'text-primary-active' : 'text-muted'
                        }`}
                      >
                        ({count.toLocaleString('vi-VN')})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Auto-Sizing Filter Selects + Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="visibility"
                aria-label="Lọc theo phạm vi hiển thị"
                value={controller.visibilityFilter}
                onChange={(e) =>
                  controller.handleSelectVisibilityFilter(
                    e.target.value as AdminPostVisibilityFilter,
                  )
                }
                className={`lyora-fit-select h-9 rounded-lg border px-2.5 text-xs transition-colors cursor-pointer focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  controller.visibilityFilter !== 'ALL'
                    ? 'border-secondary-strong bg-secondary/40 text-primary-active font-medium'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <option value="ALL">Mọi phạm vi hiển thị</option>
                <option value="PUBLIC">Công khai</option>
                <option value="FRIENDS">Bạn bè</option>
                <option value="PRIVATE">Riêng tư</option>
              </select>

              <select
                name="authorRole"
                aria-label="Lọc theo vai trò tác giả"
                value={controller.authorRoleFilter}
                onChange={(e) =>
                  controller.handleSelectAuthorRoleFilter(
                    e.target.value as AdminPostAuthorRoleFilter,
                  )
                }
                className={`lyora-fit-select h-9 rounded-lg border px-2.5 text-xs transition-colors cursor-pointer focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  controller.authorRoleFilter !== 'ALL'
                    ? 'border-secondary-strong bg-secondary/40 text-primary-active font-medium'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <option value="ALL">Mọi tác giả</option>
                <option value="CLIENT">Bài thành viên</option>
                <option value="ADMIN">Bài Ban Quản Trị</option>
              </select>

              <select
                name="media"
                aria-label="Lọc theo phương tiện đính kèm"
                value={controller.mediaFilter}
                onChange={(e) =>
                  controller.handleSelectMediaFilter(
                    e.target.value as AdminPostMediaFilter,
                  )
                }
                className={`lyora-fit-select h-9 rounded-lg border px-2.5 text-xs transition-colors cursor-pointer focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  controller.mediaFilter !== 'ALL'
                    ? 'border-secondary-strong bg-secondary/40 text-primary-active font-medium'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <option value="ALL">Mọi định dạng</option>
                <option value="WITH_MEDIA">Có ảnh / video / ghi âm</option>
                <option value="TEXT_ONLY">Chỉ văn bản</option>
              </select>

              {controller.hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={controller.handleResetFilters}
                  className="h-9 px-2.5 py-1 text-xs"
                >
                  Đặt lại bộ lọc
                </Button>
              )}
            </div>
          </div>

          {/* Search Input & Live Sync Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-posts-search-input"
                type="search"
                value={controller.searchQuery}
                onChange={controller.handleSearchChange}
                placeholder="Tìm theo nội dung bài viết, tên hoặc email tác giả..."
                aria-label="Tìm kiếm bài viết"
                className="h-9 w-full rounded-lg border border-border bg-background/40 pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              />
              {controller.searchQuery && (
                <button
                  type="button"
                  onClick={controller.handleClearSearch}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {controller.isPostsFetching && !controller.isPostsLoading && (
              <span
                role="status"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted shrink-0"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>Đang đồng bộ...</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        {controller.isPostsLoading ? (
          <div className="p-5 space-y-3 animate-pulse" role="status">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="h-16 w-full rounded-lg bg-border/70" />
            ))}
          </div>
        ) : controller.isPostsError ? (
          <div className="p-6">
            <ErrorState
              title="Không thể tải danh sách bài viết"
              description="Kết nối tới máy chủ gặp sự cố hoặc phiên đăng nhập đã hết hạn. Vui lòng thử lại."
              onRetry={controller.handleRetryLoad}
            />
          </div>
        ) : (
          <AdminPostsTable controller={controller} />
        )}
      </section>

      {/* Native Top-Layer Modals */}
      <AdminPostDetailModal controller={controller} />
      <AdminModerationModal controller={controller} />
      <AdminCreatePostModal controller={controller} />
    </div>
  );
};

export default AdminPostsView;
