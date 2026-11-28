import React from 'react';
import { Button, formatDateTime } from '@/core';
import { MODERATION_REASON_PRESETS } from '@/features/posts';
import { CloseIcon } from '../components/AdminIcons';
import type { AdminPostsController } from './admin-posts.controller';
import { AdminDialog } from './AdminDialog';

export interface AdminModerationModalProps {
  controller: AdminPostsController;
}

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  controller,
}) => {
  const isOpen =
    controller.moderationMode !== null &&
    controller.moderationTargetPost !== null;
  const activeMode = controller.moderationMode ?? controller.lastModerationMode;
  const isHideMode = activeMode === 'HIDE_POST';
  const target = controller.moderationTargetPost;

  return (
    <AdminDialog
      open={isOpen}
      onClose={controller.handleCloseModerationModal}
      labelledBy="admin-moderation-modal-title"
      closedBy="any"
      maxWidthClassName="max-w-lg"
      disableDismiss={controller.isModeratingPost}
    >
      <div className="flex max-h-[min(88dvh,720px)] flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <h1
              id="admin-moderation-modal-title"
              className="text-base font-semibold text-foreground"
            >
              {isHideMode ? 'Ẩn bài viết vi phạm' : 'Xác nhận gỡ bỏ bài viết'}
            </h1>
            {target && (
              <p className="text-xs text-muted truncate">
                Tác giả:{' '}
                <strong className="font-medium text-foreground">
                  {target.author.fullName}
                </strong>{' '}
                ({target.author.email})
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={controller.isModeratingPost}
            onClick={controller.handleCloseModerationModal}
            aria-label="Đóng hộp thoại kiểm duyệt"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={controller.handleConfirmModeration}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {/* Quoted Post Excerpt Context */}
          {target && (
            <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted tabular-nums">
                <span className="font-mono">#{target.id.slice(0, 8)}</span>
                <span>{formatDateTime(target.createdAt)}</span>
              </div>
              <p className="text-xs text-foreground line-clamp-2 break-words">
                {target.content.trim() || '(Bài viết chỉ đính kèm phương tiện)'}
              </p>
            </div>
          )}

          <p className="text-xs text-muted leading-relaxed">
            {isHideMode
              ? 'Bài viết sẽ bị ẩn khỏi bảng tin cộng đồng ngay lập tức và hệ thống tự động gửi thông báo kèm lý do cho tác giả. Bạn vẫn có thể khôi phục bài viết sau này.'
              : 'Bài viết sẽ bị gỡ bỏ khỏi danh sách hiển thị trên toàn hệ thống và tác giả sẽ nhận được thông báo từ Ban Quản Trị.'}
          </p>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-foreground">
              Chọn nhanh lý do phổ biến
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MODERATION_REASON_PRESETS.map((preset) => {
                const isSelected = controller.moderationReason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={controller.isModeratingPost}
                    onClick={() => controller.handleSelectReasonPreset(preset)}
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
                htmlFor="admin-moderation-reason-input"
                className="block text-xs font-medium text-foreground"
              >
                {isHideMode
                  ? 'Lý do kiểm duyệt (bắt buộc)'
                  : 'Lý do gỡ bỏ gửi tới tác giả (tùy chọn)'}
              </label>
              <span className="text-[11px] text-muted tabular-nums">
                {controller.moderationReason.length}/500
              </span>
            </div>

            <textarea
              id="admin-moderation-reason-input"
              autoFocus={isHideMode}
              maxLength={500}
              value={controller.moderationReason}
              onChange={controller.handleModerationReasonChange}
              disabled={controller.isModeratingPost}
              placeholder={
                isHideMode
                  ? 'Nhập lý do cụ thể từ 5 đến 500 ký tự...'
                  : 'Nhập lý do gỡ bỏ nếu cần thông báo chi tiết cho tác giả...'
              }
              className="lyora-auto-textarea-compact rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {controller.moderationError && (
              <p role="alert" className="text-xs text-error">
                {controller.moderationError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              autoFocus={!isHideMode}
              disabled={controller.isModeratingPost}
              onClick={controller.handleCloseModerationModal}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={isHideMode ? 'primary' : 'danger'}
              isLoading={controller.isModeratingPost}
            >
              {isHideMode ? 'Xác nhận ẩn bài' : 'Xác nhận gỡ bỏ'}
            </Button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
};
