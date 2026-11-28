import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, formatDateTime } from '@/core';
import {
  MODERATION_REASON_PRESETS,
  type Post,
  type PostComment,
} from '@/features/posts';
import {
  AVATAR_VIOLATION_REASON_PRESETS,
  COVER_VIOLATION_REASON_PRESETS,
  type AdminUserDetail,
} from '@/features/user';
import { CloseIcon } from '../components/AdminIcons';

export type AdminUserModerationTarget =
  | { mode: 'HIDE_POST'; post: Post }
  | { mode: 'REMOVE_POST'; post: Post }
  | { mode: 'REMOVE_COMMENT'; postId: string; comment: PostComment }
  | { mode: 'FLAG_POST'; post: Post }
  | { mode: 'FLAG_AVATAR'; user: AdminUserDetail }
  | { mode: 'FLAG_COVER'; user: AdminUserDetail };

export interface AdminUserPostModerationModalProps {
  target: AdminUserModerationTarget | null;
  fallbackAuthorName?: string;
  reason: string;
  error: string | null;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onSelectPreset: (preset: string) => void;
  onClose: () => void;
  onConfirm: (e: React.FormEvent) => void;
}

export const AdminUserPostModerationModal: React.FC<
  AdminUserPostModerationModalProps
> = ({
  target,
  fallbackAuthorName = 'Thành viên Lyora',
  reason,
  error,
  isSubmitting,
  onReasonChange,
  onSelectPreset,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, isSubmitting, onClose]);

  if (!target || typeof document === 'undefined') return null;

  const isHideMode = target.mode === 'HIDE_POST';
  const isFlagPostMode = target.mode === 'FLAG_POST';
  const isFlagAvatarMode = target.mode === 'FLAG_AVATAR';
  const isFlagCoverMode = target.mode === 'FLAG_COVER';
  const isCommentMode = target.mode === 'REMOVE_COMMENT';
  const isReasonRequired =
    isHideMode || isFlagPostMode || isFlagAvatarMode || isFlagCoverMode;

  const isMediaFlagMode = isFlagAvatarMode || isFlagCoverMode;
  const targetUser = isMediaFlagMode ? target.user : null;
  const targetItem =
    !isMediaFlagMode && !isCommentMode ? target.post : isCommentMode ? target.comment : null;

  const authorName = isMediaFlagMode
    ? target.user.fullName?.trim() || fallbackAuthorName
    : targetItem?.author.fullName?.trim() || fallbackAuthorName;
  const authorEmail = isMediaFlagMode
    ? target.user.email
    : targetItem?.author.email;

  const title = isFlagAvatarMode
    ? 'Đánh dấu vi phạm ảnh đại diện'
    : isFlagCoverMode
      ? 'Đánh dấu vi phạm ảnh bìa'
      : isFlagPostMode
        ? 'Đánh dấu vi phạm bài viết'
        : isHideMode
          ? 'Ẩn bài viết vi phạm'
          : isCommentMode
            ? 'Xác nhận gỡ bỏ bình luận'
            : 'Xác nhận gỡ bỏ bài viết';

  const description = isFlagAvatarMode
    ? 'Ảnh đại diện của thành viên sẽ được gắn viền cảnh báo kèm biểu tượng dấu chấm than để xem lý do & bằng chứng, đồng thời hệ thống gửi thông báo realtime cho người dùng.'
    : isFlagCoverMode
      ? 'Ảnh bìa của thành viên sẽ được gắn viền cảnh báo kèm biểu tượng dấu chấm than để xem lý do & bằng chứng, đồng thời hệ thống gửi thông báo realtime cho người dùng.'
      : isFlagPostMode
        ? 'Bài viết sẽ hiển thị nhãn "Vi phạm" tương tác bấm được trên trang chủ, hồ sơ và trang chi tiết, đồng thời gửi thông báo realtime cho tác giả.'
        : isHideMode
          ? 'Bài viết sẽ bị ẩn khỏi bảng tin cộng đồng ngay lập tức và hệ thống tự động gửi thông báo kèm lý do cho tác giả. Bạn vẫn có thể khôi phục bài viết sau này.'
          : isCommentMode
            ? 'Bình luận sẽ bị gỡ bỏ khỏi bài viết trên toàn hệ thống và tác giả bình luận sẽ nhận được thông báo từ Ban Quản Trị.'
            : 'Bài viết sẽ bị gỡ bỏ khỏi danh sách hiển thị trên toàn hệ thống và tác giả sẽ nhận được thông báo từ Ban Quản Trị.';

  const reasonLabel = isReasonRequired
    ? 'Lý do vi phạm (bắt buộc)'
    : 'Lý do gỡ bỏ gửi tới tác giả (tùy chọn)';

  const reasonPlaceholder = isReasonRequired
    ? 'Nhập lý do cụ thể từ 5 đến 500 ký tự...'
    : 'Nhập lý do gỡ bỏ nếu cần thông báo chi tiết cho tác giả...';

  const reasonPresets = isFlagAvatarMode
    ? AVATAR_VIOLATION_REASON_PRESETS
    : isFlagCoverMode
      ? COVER_VIOLATION_REASON_PRESETS
      : MODERATION_REASON_PRESETS;

  const submitLabel =
    isFlagAvatarMode || isFlagCoverMode || isFlagPostMode
      ? 'Xác nhận đánh dấu vi phạm'
      : isHideMode
        ? 'Xác nhận ẩn bài'
        : 'Xác nhận gỡ bỏ';

  const mediaPreviewUrl = isFlagAvatarMode
    ? targetUser?.avatarUrl
    : isFlagCoverMode
      ? targetUser?.coverUrl
      : null;

  const excerptFallback = isCommentMode
    ? '(Bình luận chỉ đính kèm phương tiện)'
    : '(Bài viết chỉ đính kèm phương tiện)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-post-moderation-modal-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-md flex flex-col max-h-[min(90dvh,760px)] overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <h1
              id="admin-user-post-moderation-modal-title"
              className="text-base font-semibold text-foreground"
            >
              {title}
            </h1>
            <p className="text-xs text-muted truncate">
              {isMediaFlagMode ? 'Thành viên:' : 'Tác giả:'}{' '}
              <strong className="font-medium text-foreground">{authorName}</strong>
              {authorEmail ? ` (${authorEmail})` : ''}
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng hộp thoại kiểm duyệt"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onConfirm} className="flex-1 overflow-y-auto p-6 space-y-4">
          {isMediaFlagMode && mediaPreviewUrl ? (
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">
                {isFlagAvatarMode
                  ? 'Ảnh đại diện đang kiểm duyệt (bằng chứng)'
                  : 'Ảnh bìa đang kiểm duyệt (bằng chứng)'}
              </span>
              <div className="rounded-xl border border-border bg-background p-2.5 flex items-center justify-center overflow-hidden">
                <img
                  src={mediaPreviewUrl}
                  alt={
                    isFlagAvatarMode
                      ? `Ảnh đại diện của ${authorName}`
                      : `Ảnh bìa của ${authorName}`
                  }
                  className="block max-w-full max-h-52 w-auto h-auto object-contain rounded-lg"
                />
              </div>
            </div>
          ) : targetItem ? (
            <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted tabular-nums">
                <span className="font-mono">#{targetItem.id.slice(0, 8)}</span>
                <span>{formatDateTime(targetItem.createdAt)}</span>
              </div>
              <p className="text-xs text-foreground line-clamp-2 break-words">
                {targetItem.content.trim() || excerptFallback}
              </p>
            </div>
          ) : null}

          <p className="text-xs text-muted leading-relaxed">{description}</p>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-foreground">
              Chọn nhanh lý do phổ biến
            </span>
            <div className="flex flex-wrap gap-1.5">
              {reasonPresets.map((preset) => {
                const isSelected = reason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onSelectPreset(preset)}
                    className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      isSelected
                        ? 'border-secondary-strong bg-secondary text-primary-active font-medium'
                        : 'border-border bg-background text-foreground hover:bg-card'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="admin-user-moderation-reason-input"
                className="block text-xs font-medium text-foreground"
              >
                {reasonLabel}
              </label>
              <span className="text-[11px] text-muted tabular-nums">
                {reason.length}/500
              </span>
            </div>

            <textarea
              id="admin-user-moderation-reason-input"
              rows={4}
              autoFocus={isReasonRequired}
              maxLength={500}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              disabled={isSubmitting}
              placeholder={reasonPlaceholder}
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
            {error && (
              <p role="alert" className="text-xs text-error">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              autoFocus={!isReasonRequired}
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={isHideMode ? 'primary' : 'danger'}
              isLoading={isSubmitting}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
