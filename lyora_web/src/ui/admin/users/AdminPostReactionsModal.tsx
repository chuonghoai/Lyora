import React from 'react';
import { createPortal } from 'react-dom';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  formatDateTime,
  formatRelativeTime,
  LoadingState,
} from '@/core';
import {
  getReactionMeta,
  REACTION_OPTIONS,
  type PaginatedPostReactionsResult,
  type Post,
  type ReactionType,
} from '@/features/posts';
import { AdminReactionIcon, CloseIcon } from '../components/AdminIcons';

export interface AdminPostReactionsModalState {
  postId: string;
  page: number;
  reactionType?: ReactionType;
}

export interface AdminPostReactionsModalProps {
  post: Post | null;
  modalState: AdminPostReactionsModalState | null;
  data: PaginatedPostReactionsResult | undefined;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onChangeFilter: (reactionType?: ReactionType) => void;
  onChangePage: (page: number) => void;
  onRetry: () => void;
  onInspectUser: (userId: string) => void;
}

export const AdminPostReactionsModal: React.FC<AdminPostReactionsModalProps> = ({
  post,
  modalState,
  data,
  isLoading,
  isError,
  onClose,
  onChangeFilter,
  onChangePage,
  onRetry,
  onInspectUser,
}) => {
  if (!post || !modalState || typeof document === 'undefined') {
    return null;
  }

  const activeFilterType = modalState.reactionType;
  const sortedReactionTabs = REACTION_OPTIONS.filter(
    (opt) => (post.reactionBreakdown[opt.type] ?? 0) > 0,
  ).sort(
    (a, b) => (post.reactionBreakdown[b.type] ?? 0) - (post.reactionBreakdown[a.type] ?? 0),
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Danh sách người đã bày tỏ cảm xúc bài viết"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[82vh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-5 pt-4 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Lượt thích &amp; cảm xúc
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
              {post.reactionCount.toLocaleString('vi-VN')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách cảm xúc"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted hover:text-foreground hover:bg-border/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Reaction Tabs */}
        <div
          role="tablist"
          aria-label="Phân loại theo biểu tượng cảm xúc"
          className="shrink-0 flex items-center gap-1 overflow-x-auto border-b border-border px-3 sm:px-5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!activeFilterType}
            onClick={() => onChangeFilter(undefined)}
            className={`shrink-0 inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              !activeFilterType
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            <span>Tất cả</span>
            <span className="tabular-nums text-xs">({post.reactionCount})</span>
          </button>

          {sortedReactionTabs.map((opt) => (
            <button
              key={opt.type}
              type="button"
              role="tab"
              aria-selected={activeFilterType === opt.type}
              onClick={() => onChangeFilter(opt.type)}
              className={`shrink-0 inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeFilterType === opt.type
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              <AdminReactionIcon type={opt.type} className="w-5 h-5" />
              <span className="tabular-nums">{post.reactionBreakdown[opt.type]}</span>
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {isLoading && !data ? (
            <LoadingState
              variant="skeleton-list"
              count={4}
              label="Đang tải danh sách cảm xúc..."
            />
          ) : isError ? (
            <ErrorState
              compact
              title="Không thể tải danh sách cảm xúc"
              description="Vui lòng thử lại để xem danh sách chi tiết."
              onRetry={onRetry}
            />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              compact
              title="Chưa có lượt bày tỏ cảm xúc"
              description="Không có thành viên nào bày tỏ cảm xúc trong mục này."
            />
          ) : (
            data.items.map((item) => {
              const meta = getReactionMeta(item.reactionType);
              const name = item.user.fullName?.trim() || 'Người dùng Lyora';
              const initial = name.charAt(0).toUpperCase();

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 hover:bg-background transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onInspectUser(item.user.id)}
                    className="group flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="relative shrink-0">
                      {item.user.avatarUrl ? (
                        <AppImage
                          src={item.user.avatarUrl}
                          alt={name}
                          rounded
                          className="h-10 w-10 border border-border"
                        />
                      ) : (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-primary">
                          {initial}
                        </span>
                      )}
                      <span
                        title={meta.label}
                        className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-card shadow-sm"
                      >
                        <AdminReactionIcon type={meta.type} className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                        {name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {item.user.email ? `${item.user.email} · ` : ''}
                        <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                          {formatRelativeTime(item.createdAt)}
                        </time>
                      </p>
                    </div>
                  </button>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.activeBgClass} ${meta.activeTextClass}`}
                  >
                    <AdminReactionIcon type={meta.type} className="w-4 h-4" />
                    <span>{meta.label}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {data && data.meta.totalPages > 1 && (
          <footer className="shrink-0 border-t border-border bg-background/40 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted tabular-nums">
              Trang <strong className="text-foreground">{data.meta.page}</strong> /{' '}
              {data.meta.totalPages} ({data.meta.totalItems} lượt)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!data.meta.hasPrevPage || isLoading}
                onClick={() => onChangePage(data.meta.page - 1)}
                className="h-8 px-3 py-1 text-xs"
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!data.meta.hasNextPage || isLoading}
                onClick={() => onChangePage(data.meta.page + 1)}
                className="h-8 px-3 py-1 text-xs"
              >
                Sau
              </Button>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
