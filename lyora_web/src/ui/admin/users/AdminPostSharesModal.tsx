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
import type { PaginatedPostSharesResult, Post } from '@/features/posts';
import { CloseIcon, ShareIcon } from '../components/AdminIcons';

export interface AdminPostSharesModalProps {
  post: Post | null;
  isOpen: boolean;
  data: PaginatedPostSharesResult | undefined;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onChangePage: (page: number) => void;
  onRetry: () => void;
  onInspectUser: (userId: string) => void;
}

export const AdminPostSharesModal: React.FC<AdminPostSharesModalProps> = ({
  post,
  isOpen,
  data,
  isLoading,
  isError,
  onClose,
  onChangePage,
  onRetry,
  onInspectUser,
}) => {
  if (!isOpen || !post || typeof document === 'undefined') {
    return null;
  }

  const totalBadge = data?.meta.totalItems ?? post.shareCount;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Danh sách người đã chia sẻ bài viết"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[82vh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <ShareIcon className="w-4 h-4 text-primary shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Người đã chia sẻ
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
              {totalBadge.toLocaleString('vi-VN')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách chia sẻ"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted hover:text-foreground hover:bg-border/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Share Users List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {isLoading && !data ? (
            <LoadingState
              variant="skeleton-list"
              count={4}
              label="Đang tải danh sách người chia sẻ..."
            />
          ) : isError ? (
            <ErrorState
              compact
              title="Không thể tải danh sách chia sẻ"
              description="Vui lòng thử lại để xem chi tiết."
              onRetry={onRetry}
            />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              compact
              title="Chưa có dữ liệu người chia sẻ"
              description="Chưa ghi nhận lượt chia sẻ chi tiết nào cho bài viết này."
            />
          ) : (
            data.items.map((item) => {
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
                    {item.user.avatarUrl ? (
                      <AppImage
                        src={item.user.avatarUrl}
                        alt={name}
                        rounded
                        className="h-10 w-10 shrink-0 border border-border"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-primary">
                        {initial}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline truncate">
                        {name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {item.user.email || 'Thành viên cộng đồng'}
                      </p>
                    </div>
                  </button>

                  <time
                    dateTime={item.createdAt}
                    title={formatDateTime(item.createdAt)}
                    className="shrink-0 text-xs text-muted tabular-nums"
                  >
                    {formatRelativeTime(item.createdAt)}
                  </time>
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
