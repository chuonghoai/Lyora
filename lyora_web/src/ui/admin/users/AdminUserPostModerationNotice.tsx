import React from 'react';
import { Button, formatDateTime } from '@/core';
import type { Post, PostAppealSummary } from '@/features/posts';
import { LockIcon, RotateCcwIcon } from '../components/AdminIcons';

export interface AdminUserPostModerationNoticeProps {
  post: Post;
  mode: 'compact' | 'expanded';
  isAppealsExpanded?: boolean;
  onToggleAppealsExpanded?: () => void;
  onOpenAppealHistory?: (postId: string) => void;
  onRequestRestoreAppeal?: (post: Post, appeal: PostAppealSummary) => void;
  onOpenEvidenceModal?: (post: Post, appeal: PostAppealSummary) => void;
  isRestoringAppeal?: boolean;
}

function renderAppealStatusPill(appeal: PostAppealSummary) {
  if (appeal.status === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-full border border-secondary-strong bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-active">
        Đang chờ Quản trị viên xem xét khiếu nại
      </span>
    );
  }
  if (appeal.status === 'RESTORED') {
    return (
      <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
        Đã khôi phục bài viết
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-error/30 bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error">
      Đã gửi minh chứng phản hồi
    </span>
  );
}

export const AdminUserPostModerationNotice: React.FC<
  AdminUserPostModerationNoticeProps
> = ({
  post,
  mode,
  isAppealsExpanded = false,
  onToggleAppealsExpanded,
  onOpenAppealHistory,
  onRequestRestoreAppeal,
  onOpenEvidenceModal,
  isRestoringAppeal = false,
}) => {
  const isHidden = post.moderationStatus === 'HIDDEN';
  const appealsList: PostAppealSummary[] =
    post.appeals && post.appeals.length > 0
      ? post.appeals
      : post.appeal
        ? [post.appeal]
        : [];

  if (!isHidden && (mode === 'compact' || appealsList.length === 0)) {
    return null;
  }

  const compactAppeals = appealsList.slice(0, 2);

  const showCompactHistoryButton =
    Boolean(onOpenAppealHistory) && appealsList.length > 0;

  const visibleExpandedAppeals = isAppealsExpanded
    ? appealsList
    : appealsList.slice(0, 1);

  return (
    <div
      role="region"
      aria-label="Thông tin kiểm duyệt và khiếu nại bài viết"
      className={`rounded-xl border p-3.5 space-y-2.5 text-xs ${
        isHidden
          ? 'border-warning/40 bg-warning/10'
          : 'border-border bg-background/60'
      }`}
    >
      {/* Hidden status + reason header */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              isHidden
                ? 'border-warning/40 bg-card text-warning'
                : 'border-success/30 bg-success/10 text-success'
            }`}
          >
            <LockIcon className="w-3 h-3" />
            <span>
              {isHidden
                ? 'Bài viết đang bị ẩn'
                : 'Bài viết đã được khôi phục'}
            </span>
          </span>
          {post.moderatedAt && (
            <span className="text-[11px] text-muted tabular-nums">
              Cập nhật {formatDateTime(post.moderatedAt)}
            </span>
          )}
        </div>

        {isHidden && (
          <p className="text-foreground leading-relaxed">
            <strong>Lý do bị ẩn:</strong>{' '}
            {post.moderationReason?.trim() || 'Vi phạm tiêu chuẩn cộng đồng'}
          </p>
        )}
      </div>

      {/* COMPACT MODE: Max 2 recent unified rounds (appeal + attached evidence) + History button */}
      {mode === 'compact' && (
        <>
          {compactAppeals.length > 0 && (
            <div className="space-y-2">
              {compactAppeals.map((appeal, idx) => {
                const roundNumber = appealsList.length - idx;
                return (
                  <div
                    key={appeal.id}
                    className="rounded-lg border border-border bg-card px-3 py-2 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-muted tabular-nums">
                          Lần #{roundNumber}
                        </span>
                        {renderAppealStatusPill(appeal)}
                      </div>
                      <span className="text-[11px] text-muted tabular-nums">
                        {formatDateTime(appeal.createdAt)}
                      </span>
                    </div>

                    <p className="text-foreground line-clamp-1 break-words">
                      <strong>Khiếu nại của thành viên:</strong>{' '}
                      {appeal.reasonCategory} — {appeal.reasonDetail}
                    </p>

                    {appeal.adminEvidence?.trim() && (
                      <div className="rounded-md border border-error/30 bg-error/10 px-2.5 py-1.5 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-error">
                            Minh chứng từ Quản trị viên
                          </span>
                          {appeal.resolvedAt && (
                            <span className="text-[11px] text-muted tabular-nums">
                              {formatDateTime(appeal.resolvedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground line-clamp-1 break-words">
                          {appeal.adminEvidence.trim()}
                        </p>
                      </div>
                    )}

                    {appeal.status === 'PENDING' &&
                      (onRequestRestoreAppeal || onOpenEvidenceModal) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/70">
                          {onRequestRestoreAppeal && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isRestoringAppeal}
                              onClick={() =>
                                onRequestRestoreAppeal(post, appeal)
                              }
                              className="h-7 px-2.5 py-0.5 text-[11px] gap-1 border-secondary-strong bg-secondary/50 text-primary-active hover:bg-secondary"
                            >
                              <RotateCcwIcon className="w-3 h-3" />
                              <span>Khôi phục bài viết</span>
                            </Button>
                          )}

                          {onOpenEvidenceModal && (
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => onOpenEvidenceModal(post, appeal)}
                              className="h-7 px-2.5 py-0.5 text-[11px]"
                            >
                              Gửi minh chứng
                            </Button>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {showCompactHistoryButton && onOpenAppealHistory && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onOpenAppealHistory(post.id)}
                className="text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                {appealsList.length > 1
                  ? `Xem lịch sử khiếu nại (${appealsList.length})`
                  : 'Xem lịch sử khiếu nại'}
              </button>
            </div>
          )}
        </>
      )}

      {/* EXPANDED MODE (Modal): Full timeline + Admin resolve actions */}
      {mode === 'expanded' && appealsList.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground">
              Lịch sử khiếu nại &amp; minh chứng ({appealsList.length})
            </span>

            {appealsList.length > 1 && onToggleAppealsExpanded && (
              <button
                type="button"
                onClick={onToggleAppealsExpanded}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                {isAppealsExpanded
                  ? 'Thu gọn lịch sử khiếu nại'
                  : `Xem toàn bộ lịch sử khiếu nại (${appealsList.length})`}
              </button>
            )}
          </div>

          <ul className="space-y-2.5">
            {visibleExpandedAppeals.map((appeal, index) => (
              <li
                key={appeal.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted tabular-nums">
                      Lần #{appealsList.length - index}
                    </span>
                    {renderAppealStatusPill(appeal)}
                  </div>
                  <span className="text-[11px] text-muted tabular-nums">
                    Gửi lúc {formatDateTime(appeal.createdAt)}
                  </span>
                </div>

                <div className="space-y-0.5 text-foreground">
                  <p className="font-semibold">{appeal.reasonCategory}</p>
                  <p className="leading-relaxed whitespace-pre-line break-words">
                    {appeal.reasonDetail}
                  </p>
                </div>

                {appeal.adminEvidence && (
                  <div className="rounded-lg border border-error/35 bg-error/10 px-3 py-2 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-error">
                        Minh chứng từ Quản trị viên
                      </span>
                      {appeal.resolvedAt && (
                        <span className="text-[11px] text-muted tabular-nums">
                          {formatDateTime(appeal.resolvedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground leading-relaxed whitespace-pre-line break-words">
                      {appeal.adminEvidence}
                    </p>
                  </div>
                )}

                {appeal.status === 'PENDING' &&
                  (onRequestRestoreAppeal || onOpenEvidenceModal) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/70">
                      {onRequestRestoreAppeal && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isRestoringAppeal}
                          onClick={() => onRequestRestoreAppeal(post, appeal)}
                          className="h-8 px-2.5 py-1 text-xs gap-1.5 border-secondary-strong bg-secondary/50 text-primary-active hover:bg-secondary"
                        >
                          <RotateCcwIcon className="w-3.5 h-3.5" />
                          <span>Khôi phục bài viết</span>
                        </Button>
                      )}

                      {onOpenEvidenceModal && (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => onOpenEvidenceModal(post, appeal)}
                          className="h-8 px-2.5 py-1 text-xs"
                        >
                          Gửi minh chứng
                        </Button>
                      )}
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
