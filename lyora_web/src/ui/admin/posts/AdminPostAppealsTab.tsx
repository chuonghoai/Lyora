import React from 'react';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  formatDateTime,
} from '@/core';
import type {
  AdminPostAppealItem,
  AdminPostAppealStatusFilter,
} from '@/features/posts';
import {
  CloseIcon,
  EyeIcon,
  RotateCcwIcon,
  SearchIcon,
} from '../components/AdminIcons';
import { AdminPostVisibilityChip } from '../components/AdminPostVisibilityChip';
import type { AdminPostsController } from './admin-posts.controller';

const APPEAL_STATUS_FILTERS: {
  value: AdminPostAppealStatusFilter;
  label: string;
}[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'RESTORED', label: 'Đã khôi phục' },
  { value: 'REJECTED', label: 'Đã gửi minh chứng' },
];

function renderPostModerationBadge(appeal: AdminPostAppealItem) {
  const isRestored =
    appeal.post.moderationStatus === 'ACTIVE' || appeal.status === 'RESTORED';
  if (isRestored) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success whitespace-nowrap">
        Đã khôi phục
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/35 bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning whitespace-nowrap">
      Đang bị ẩn
    </span>
  );
}

function renderAppealWorkflowBadge(appeal: AdminPostAppealItem) {
  const isRestored =
    appeal.post.moderationStatus === 'ACTIVE' || appeal.status === 'RESTORED';
  if (isRestored) {
    if (!appeal.hasEvidence && !appeal.adminEvidence) return null;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted whitespace-nowrap">
        Đã từng gửi minh chứng
      </span>
    );
  }
  if (appeal.status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error whitespace-nowrap">
        Đã gửi minh chứng
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary-strong bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary-active whitespace-nowrap">
      Chờ xử lý
    </span>
  );
}

function renderRoundStatusBadge(status: AdminPostAppealItem['status']) {
  if (status === 'RESTORED') {
    return (
      <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
        Đã khôi phục
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error">
        Đã gửi minh chứng
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-secondary-strong bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-active">
      Chờ xử lý
    </span>
  );
}

export interface AdminPostAppealsTabProps {
  controller: AdminPostsController;
}

export const AdminPostAppealsTab: React.FC<AdminPostAppealsTabProps> = ({
  controller,
}) => {
  const startItem =
    controller.appealsPaginationMeta.totalItems === 0
      ? 0
      : (controller.appealsPaginationMeta.page - 1) *
          controller.appealsPaginationMeta.limit +
        1;
  const endItem = Math.min(
    controller.appealsPaginationMeta.page *
      controller.appealsPaginationMeta.limit,
    controller.appealsPaginationMeta.totalItems,
  );

  return (
    <section
      aria-label="Danh sách khiếu nại bài viết bị ẩn"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Toolbar */}
      <div className="border-b border-border p-4 sm:p-5 space-y-3 bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Lọc khiếu nại theo trạng thái"
            className="inline-flex self-start flex-wrap rounded-lg border border-border bg-background p-1"
          >
            {APPEAL_STATUS_FILTERS.map((opt) => {
              const active = controller.appealStatusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => controller.handleAppealStatusFilterChange(opt.value)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active
                      ? 'bg-card text-primary border border-border shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={controller.appealSearchQuery}
              onChange={controller.handleAppealSearchChange}
              placeholder="Tìm theo nội dung khiếu nại, bài viết hoặc tác giả..."
              aria-label="Tìm kiếm khiếu nại bài viết"
              className="h-9 w-full rounded-lg border border-border bg-background/40 pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus:bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
            {controller.appealSearchQuery && (
              <button
                type="button"
                onClick={controller.handleClearAppealSearch}
                aria-label="Xóa từ khóa tìm kiếm khiếu nại"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground cursor-pointer"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {controller.isAppealsLoading ? (
        <div className="p-5 space-y-3 animate-pulse" role="status">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="h-28 rounded-xl bg-border/60" />
          ))}
        </div>
      ) : controller.isAppealsError ? (
        <div className="p-6">
          <ErrorState
            title="Không thể tải danh sách khiếu nại"
            description="Kết nối máy chủ bị gián đoạn khi tải danh sách khiếu nại bài viết."
            onRetry={controller.handleRetryAppeals}
          />
        </div>
      ) : controller.appeals.length === 0 ? (
        <div className="p-6">
          <EmptyState
            compact
            title="Không có khiếu nại bài viết nào"
            description="Khi thành viên gửi khiếu nại về bài viết bị ẩn, thông tin chi tiết sẽ xuất hiện tại đây để bạn xử lý."
          />
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {controller.appeals.map((appeal) => {
              const isRestoringThis =
                controller.isRestoringAppeal &&
                controller.restoreAppealTarget?.id === appeal.id;
              const isPostRestored =
                appeal.post.moderationStatus === 'ACTIVE' ||
                appeal.status === 'RESTORED';
              const recentRounds =
                appeal.recentAppeals && appeal.recentAppeals.length > 0
                  ? appeal.recentAppeals
                  : [
                      {
                        id: appeal.id,
                        status: appeal.status,
                        reasonCategory: appeal.reasonCategory,
                        reasonDetail: appeal.reasonDetail,
                        adminEvidence: appeal.adminEvidence,
                        createdAt: appeal.createdAt,
                        resolvedAt: appeal.resolvedAt,
                        resolvedBy: appeal.resolvedBy
                          ? {
                              id: appeal.resolvedBy.id,
                              fullName: appeal.resolvedBy.fullName,
                            }
                          : null,
                      },
                    ];
              const totalCount =
                appeal.totalAppealsCount ?? recentRounds.length;

              return (
                <article
                  key={appeal.id}
                  className="p-4 sm:p-5 hover:bg-background/40 transition-colors space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {appeal.appellant.avatarUrl ? (
                        <AppImage
                          src={appeal.appellant.avatarUrl}
                          alt={appeal.appellant.fullName}
                          rounded
                          className="h-9 w-9 shrink-0 border border-border"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-secondary text-xs font-semibold text-primary-active">
                          {(appeal.appellant.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {appeal.appellant.fullName}
                          </span>
                          <AdminPostVisibilityChip visibility={appeal.post.visibility} />
                          {renderPostModerationBadge(appeal)}
                          {renderAppealWorkflowBadge(appeal)}
                        </div>
                        <p className="text-xs text-muted truncate tabular-nums">
                          {appeal.appellant.email} · Khiếu nại gần nhất lúc{' '}
                          {formatDateTime(appeal.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => controller.handleOpenDetail(appeal.postId)}
                        className="h-8 px-2.5 py-1 text-xs gap-1.5"
                      >
                        <EyeIcon className="w-3.5 h-3.5 text-muted" />
                        <span>Xem bài viết</span>
                      </Button>

                      {totalCount > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            controller.handleOpenAppealHistoryModal(appeal)
                          }
                          className="h-8 px-2.5 py-1 text-xs"
                        >
                          Xem lịch sử khiếu nại ({totalCount})
                        </Button>
                      )}

                      {!isPostRestored && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isRestoringThis}
                            onClick={() =>
                              controller.handleRequestRestoreAppeal(appeal)
                            }
                            className="h-8 px-2.5 py-1 text-xs gap-1.5 border-secondary-strong bg-secondary/50 text-primary-active hover:bg-secondary"
                          >
                            <RotateCcwIcon className="w-3.5 h-3.5" />
                            <span>Khôi phục bài viết</span>
                          </Button>

                          {appeal.status === 'PENDING' && (
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() =>
                                controller.handleOpenEvidenceModal(appeal)
                              }
                              className="h-8 px-2.5 py-1 text-xs"
                            >
                              Gửi minh chứng
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Bài viết (#{appeal.postId.slice(0, 8)})
                      </p>
                      <p className="text-foreground line-clamp-2 break-words leading-relaxed">
                        {appeal.post.content.trim() ||
                          '(Bài viết chỉ đính kèm phương tiện)'}
                      </p>
                      {!isPostRestored ? (
                        <p className="text-warning pt-1 border-t border-border/70">
                          <strong>Lý do ẩn gốc:</strong>{' '}
                          {appeal.post.moderationReason?.trim() ||
                            'Vi phạm tiêu chuẩn cộng đồng'}
                        </p>
                      ) : (
                        <p className="text-success pt-1 border-t border-border/70">
                          Bài viết đã được khôi phục hiển thị trở lại.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {recentRounds.map((round, idx) => {
                        const roundNumber = totalCount - idx;
                        return (
                          <div
                            key={round.id}
                            className="rounded-xl border border-secondary-strong bg-secondary/20 p-3.5 space-y-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold text-muted tabular-nums">
                                  Lần #{roundNumber}
                                </span>
                                {renderRoundStatusBadge(round.status)}
                              </div>
                              <span className="text-[11px] text-muted tabular-nums">
                                {formatDateTime(round.createdAt)}
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-primary-active">
                              {round.reasonCategory}
                            </p>
                            <p className="text-foreground leading-relaxed whitespace-pre-line break-words">
                              {round.reasonDetail}
                            </p>

                            {round.adminEvidence?.trim() && (
                              <div className="pt-1.5 mt-1.5 border-t border-error/25 text-error space-y-0.5 rounded-lg bg-error/10 p-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-[11px]">
                                    Minh chứng đã gửi tới thành viên:
                                  </p>
                                  {round.resolvedAt && (
                                    <span className="text-[11px] text-muted tabular-nums">
                                      {formatDateTime(round.resolvedAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-foreground whitespace-pre-line break-words">
                                  {round.adminEvidence.trim()}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border px-5 py-3.5 bg-card">
            <p className="text-xs text-muted tabular-nums">
              Hiển thị{' '}
              <span className="font-medium text-foreground">
                {startItem}–{endItem}
              </span>{' '}
              trong tổng số{' '}
              <span className="font-medium text-foreground">
                {controller.appealsPaginationMeta.totalItems.toLocaleString('vi-VN')}
              </span>{' '}
              khiếu nại
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  !controller.appealsPaginationMeta.hasPrevPage ||
                  controller.isAppealsFetching
                }
                onClick={() =>
                  controller.handleAppealPageChange(
                    controller.appealsPaginationMeta.page - 1,
                  )
                }
                className="min-h-9 sm:min-h-8 px-3 py-1 text-xs"
              >
                Trang trước
              </Button>
              <span className="px-2 text-xs text-muted tabular-nums">
                Trang{' '}
                <strong className="font-medium text-foreground">
                  {controller.appealsPaginationMeta.page}
                </strong>{' '}
                / {Math.max(1, controller.appealsPaginationMeta.totalPages)}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={
                  !controller.appealsPaginationMeta.hasNextPage ||
                  controller.isAppealsFetching
                }
                onClick={() =>
                  controller.handleAppealPageChange(
                    controller.appealsPaginationMeta.page + 1,
                  )
                }
                className="min-h-9 sm:min-h-8 px-3 py-1 text-xs"
              >
                Trang sau
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
