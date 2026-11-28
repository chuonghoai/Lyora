import React, { useEffect, useRef } from 'react';
import { Button, ErrorState, formatDateTime, LoadingSpinner } from '@/core';
import type {
  AdminPostAppealHistoryItem,
  AdminPostAppealItem,
} from '@/features/posts';
import {
  CloseIcon,
  EyeOffIcon,
  RotateCcwIcon,
} from '../components/AdminIcons';
import { AdminDialog } from './AdminDialog';

export interface AdminPostAppealHistoryModalProps {
  appealTarget: AdminPostAppealItem | null;
  items: AdminPostAppealHistoryItem[];
  totalItems: number;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextError: boolean;
  isRestoringAppeal: boolean;
  onClose: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onRequestRestoreAppeal: (appeal: AdminPostAppealItem) => void;
  onOpenEvidenceModal: (appeal: AdminPostAppealItem) => void;
}

function renderRoundStatusBadge(item: AdminPostAppealHistoryItem) {
  if (item.status === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-full border border-secondary-strong bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-active">
        Chờ xử lý
      </span>
    );
  }
  if (item.status === 'RESTORED') {
    return (
      <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
        Đã khôi phục
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error">
      Đã gửi minh chứng
    </span>
  );
}

export const AdminPostAppealHistoryModal: React.FC<
  AdminPostAppealHistoryModalProps
> = ({
  appealTarget,
  items,
  totalItems,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextError,
  isRestoringAppeal,
  onClose,
  onRetry,
  onLoadMore,
  onRequestRestoreAppeal,
  onOpenEvidenceModal,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isOpen = Boolean(appealTarget);

  useEffect(() => {
    if (!isOpen || !hasNextPage || isFetchingNextPage) return;
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root, rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasNextPage, isFetchingNextPage, onLoadMore, items.length]);

  const isPostRestored =
    appealTarget?.post.moderationStatus === 'ACTIVE' ||
    appealTarget?.status === 'RESTORED';

  const toAppealActionTarget = (
    item: AdminPostAppealHistoryItem,
  ): AdminPostAppealItem | null => {
    if (!appealTarget) return null;
    return {
      ...appealTarget,
      id: item.id,
      appellant: item.appellant,
      reasonCategory: item.reasonCategory,
      reasonDetail: item.reasonDetail,
      status: item.status,
      adminEvidence: item.adminEvidence,
      resolvedAt: item.resolvedAt,
      resolvedBy: item.resolvedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  };

  return (
    <AdminDialog
      open={isOpen}
      onClose={onClose}
      labelledBy="admin-post-appeal-history-title"
      closedBy="any"
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex max-h-[min(88dvh,780px)] flex-col overflow-hidden rounded-2xl bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="admin-post-appeal-history-title"
              className="text-base font-semibold text-foreground truncate"
            >
              Lịch sử khiếu nại &amp; minh chứng bài viết
            </h2>
            {appealTarget && (
              <p className="text-xs text-muted truncate tabular-nums">
                Mã bài viết #{appealTarget.postId.slice(0, 8)} ·{' '}
                {totalItems > 0 ? `${totalItems} lần khiếu nại` : 'Đang tải'}
              </p>
            )}
          </div>

          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Đóng lịch sử khiếu nại"
            className="inline-flex min-h-10 min-w-10 sm:min-h-8 sm:min-w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {appealTarget && (
            <div
              className={`rounded-xl border p-3.5 space-y-1.5 text-xs ${
                isPostRestored
                  ? 'border-border bg-background/60'
                  : 'border-warning/35 bg-warning/10'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                {isPostRestored ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                    Đã khôi phục
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-card px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                    <EyeOffIcon className="w-3 h-3" />
                    <span>Đang bị ẩn</span>
                  </span>
                )}
                <span className="text-[11px] text-muted tabular-nums">
                  {formatDateTime(appealTarget.post.createdAt)}
                </span>
              </div>

              <p className="text-foreground line-clamp-2 break-words leading-relaxed">
                {appealTarget.post.content.trim() ||
                  '(Bài viết chỉ đính kèm phương tiện)'}
              </p>

              {!isPostRestored && (
                <p className="text-warning pt-1 border-t border-warning/25">
                  <strong>Lý do ẩn gốc:</strong>{' '}
                  {appealTarget.post.moderationReason?.trim() ||
                    'Vi phạm tiêu chuẩn cộng đồng'}
                </p>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted">
              <LoadingSpinner size="sm" />
              <span>Đang tải lịch sử khiếu nại...</span>
            </div>
          ) : isError ? (
            <ErrorState
              compact
              title="Không thể tải lịch sử khiếu nại"
              description="Vui lòng thử lại để xem chi tiết từng lần khiếu nại."
              onRetry={onRetry}
            />
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted rounded-xl border border-border bg-background/40">
              Không có lịch sử khiếu nại nào trong chu kỳ kiểm duyệt hiện tại.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const actionTarget = toAppealActionTarget(item);
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted tabular-nums">
                          Lần #{item.roundNumber}
                        </span>
                        {renderRoundStatusBadge(item)}
                      </div>
                      <span className="text-[11px] text-muted tabular-nums">
                        Gửi lúc {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1 text-foreground">
                      <p className="font-semibold">{item.reasonCategory}</p>
                      <p className="leading-relaxed whitespace-pre-line break-words">
                        {item.reasonDetail}
                      </p>
                    </div>

                    {item.adminEvidence?.trim() && (
                      <div className="rounded-lg border border-error/35 bg-error/10 p-3 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-error">
                            Minh chứng từ Quản trị viên
                          </span>
                          {item.resolvedAt && (
                            <span className="text-[11px] text-muted tabular-nums">
                              {formatDateTime(item.resolvedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-line break-words">
                          {item.adminEvidence.trim()}
                        </p>
                      </div>
                    )}

                    {!isPostRestored &&
                      item.status === 'PENDING' &&
                      actionTarget && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/70">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isRestoringAppeal}
                            onClick={() => onRequestRestoreAppeal(actionTarget)}
                            className="h-8 px-2.5 py-1 text-xs gap-1.5 border-secondary-strong bg-secondary/50 text-primary-active hover:bg-secondary"
                          >
                            <RotateCcwIcon className="w-3.5 h-3.5" />
                            <span>Khôi phục bài viết</span>
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => onOpenEvidenceModal(actionTarget)}
                            className="h-8 px-2.5 py-1 text-xs"
                          >
                            Gửi minh chứng
                          </Button>
                        </div>
                      )}
                  </li>
                );
              })}
            </ul>
          )}

          <div ref={sentinelRef} className="py-2 text-center">
            {isFetchingNextPage ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs text-muted">
                <LoadingSpinner size="sm" />
                <span>Đang tải thêm lịch sử khiếu nại...</span>
              </div>
            ) : isFetchNextError ? (
              <Button
                type="button"
                variant="outline"
                onClick={onLoadMore}
                className="text-xs"
              >
                Thử tải thêm lịch sử
              </Button>
            ) : hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                onClick={onLoadMore}
                className="text-xs"
              >
                Tải thêm lịch sử khiếu nại
              </Button>
            ) : items.length > 0 ? (
              <p className="text-[11px] text-muted">
                Đã hiển thị toàn bộ lịch sử khiếu nại của bài viết.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </AdminDialog>
  );
};
