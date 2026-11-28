import React from 'react';
import { Button, ErrorState } from '@/core';
import type { AdminPostStatistics } from '@/features/posts';
import { ArrowRightIcon } from './AdminIcons';

export interface PostStatsSectionProps {
  stats: AdminPostStatistics | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onNavigateAdminPosts: () => void;
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export const PostStatsSection: React.FC<PostStatsSectionProps> = ({
  stats,
  isLoading,
  isError,
  onRetry,
  onNavigateAdminPosts,
}) => {
  if (isLoading) {
    return (
      <section aria-label="Đang tải thống kê bài viết" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-44 rounded bg-secondary/50 animate-pulse" />
          <div className="h-4 w-36 rounded bg-border/70 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[0, 1, 2, 3].map((slot) => (
            <div key={slot} className="p-5 space-y-2.5 animate-pulse">
              <div className="h-3.5 w-28 rounded-lg bg-secondary/50" />
              <div className="h-8 w-20 rounded-lg bg-secondary/50" />
              <div className="h-3 w-36 rounded-lg bg-border/70" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError || !stats) {
    return (
      <section aria-labelledby="post-stats-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="post-stats-heading" className="text-base font-semibold text-foreground">
            Thống kê bài viết
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={onNavigateAdminPosts}
            className="h-8 px-3 py-1 text-xs gap-1.5 border-border bg-card text-foreground hover:bg-background"
          >
            <span>Quản lý bài viết</span>
            <ArrowRightIcon className="w-3.5 h-3.5 text-muted" />
          </Button>
        </div>

        <ErrorState
          compact
          title="Không thể tải thống kê bài viết"
          description="Kết nối tới API quản trị bài viết gặp sự cố hoặc phiên đăng nhập chưa hợp lệ."
          onRetry={onRetry}
        />
      </section>
    );
  }

  const activePct = toPercent(stats.activePosts, stats.totalPosts);
  const publicPct = toPercent(stats.visibilityBreakdown.PUBLIC, stats.totalPosts);
  const friendsPct = toPercent(stats.visibilityBreakdown.FRIENDS, stats.totalPosts);
  const privatePct =
    stats.totalPosts > 0 && stats.visibilityBreakdown.PRIVATE > 0
      ? Math.max(0, 100 - publicPct - friendsPct)
      : 0;

  return (
    <section aria-labelledby="post-stats-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="post-stats-heading" className="text-base font-semibold text-foreground">
            Thống kê bài viết
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onNavigateAdminPosts}
          className="h-8 px-3 py-1 text-xs gap-1.5 border-border bg-card text-foreground hover:bg-background"
        >
          <span>Quản lý bài viết</span>
          <ArrowRightIcon className="w-3.5 h-3.5 text-muted" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5 space-y-2">
          <p className="text-xs font-medium text-muted">Tổng bài viết</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.totalPosts.toLocaleString('vi-VN')}
          </p>
          {stats.totalPosts > 0 && (
            <div
              aria-hidden="true"
              className="flex h-1.5 w-full overflow-hidden rounded-full bg-background gap-px"
            >
              {publicPct > 0 && (
                <span style={{ width: `${publicPct}%` }} className="bg-primary" />
              )}
              {friendsPct > 0 && (
                <span style={{ width: `${friendsPct}%` }} className="bg-success" />
              )}
              {privatePct > 0 && (
                <span style={{ width: `${privatePct}%` }} className="bg-warning" />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
              <span>Công khai {stats.visibilityBreakdown.PUBLIC.toLocaleString('vi-VN')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
              <span>Bạn bè {stats.visibilityBreakdown.FRIENDS.toLocaleString('vi-VN')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-warning" />
              <span>Riêng tư {stats.visibilityBreakdown.PRIVATE.toLocaleString('vi-VN')}</span>
            </span>
          </div>
        </div>

        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-muted">Đang hiển thị</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.activePosts.toLocaleString('vi-VN')}
            </p>
            <span className="text-xs font-semibold text-success tabular-nums">
              {activePct}%
            </span>
          </div>
          <p className="text-xs text-muted tabular-nums">
            Đính kèm phương tiện: {stats.withMediaCount.toLocaleString('vi-VN')} bài
          </p>
        </div>

        <div className="p-5 space-y-1.5 sm:border-t xl:border-t-0 border-border">
          <p className="text-xs font-medium text-muted">Đã ẩn kiểm duyệt</p>
          <p
            className={`text-2xl font-bold tracking-tight tabular-nums ${
              stats.hiddenPosts > 0 ? 'text-warning' : 'text-foreground'
            }`}
          >
            {stats.hiddenPosts.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-muted">
            {stats.hiddenPosts > 0
              ? 'Bài viết cộng đồng đang tạm ẩn'
              : 'Không có bài viết đang bị ẩn'}
          </p>
        </div>

        <div className="p-5 space-y-1.5 sm:border-t xl:border-t-0 border-border">
          <p className="text-xs font-medium text-muted">Đăng mới trong tháng</p>
          <p className="text-2xl font-bold tracking-tight text-primary tabular-nums">
            {stats.postsThisMonth.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-muted tabular-nums">
            Hôm nay: {stats.postsToday.toLocaleString('vi-VN')} · Ban quản trị:{' '}
            {stats.adminPostsCount.toLocaleString('vi-VN')} bài
          </p>
        </div>
      </div>
    </section>
  );
};
