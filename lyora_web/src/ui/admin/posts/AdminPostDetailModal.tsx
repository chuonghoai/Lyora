import React from 'react';
import { AppImage, Button, ErrorState, formatDateTime } from '@/core';
import { REACTION_OPTIONS, type PostVisibility } from '@/features/posts';
import {
  CloseIcon,
  EyeOffIcon,
  RotateCcwIcon,
  TrashIcon,
  ZoomInIcon,
} from '../components/AdminIcons';
import type { AdminPostsController } from './admin-posts.controller';
import { AdminDialog } from './AdminDialog';

export interface AdminPostDetailModalProps {
  controller: AdminPostsController;
}

const VISIBILITY_LABELS: Record<PostVisibility, string> = {
  PUBLIC: 'Công khai',
  FRIENDS: 'Bạn bè',
  PRIVATE: 'Riêng tư',
};

export const AdminPostDetailModal: React.FC<AdminPostDetailModalProps> = ({
  controller,
}) => {
  const post = controller.detailPost;

  return (
    <AdminDialog
      open={controller.isDetailModalOpen}
      onClose={controller.handleCloseDetail}
      labelledBy="admin-post-detail-title"
      closedBy="any"
      maxWidthClassName="max-w-3xl"
      disableDismiss={controller.isRemovingComment}
    >
      <div className="flex max-h-[min(92dvh,880px)] flex-col overflow-hidden rounded-2xl bg-card">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h1
              id="admin-post-detail-title"
              className="text-base font-semibold text-foreground truncate"
            >
              Chi tiết bài viết & bình luận
            </h1>
            {post && (
              <p className="text-xs text-muted font-mono truncate">
                Mã: {post.id}
              </p>
            )}
          </div>

          <button
            type="button"
            autoFocus
            onClick={controller.handleCloseDetail}
            aria-label="Đóng cửa sổ chi tiết"
            className="inline-flex min-h-10 min-w-10 sm:min-h-8 sm:min-w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {controller.isDetailLoading ? (
            <div className="space-y-4 animate-pulse" role="status">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/50" />
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-secondary/50" />
                  <div className="h-3 w-28 rounded bg-border/70" />
                </div>
              </div>
              <div className="h-24 w-full rounded-xl bg-border/70" />
              <div className="h-16 w-full rounded-xl bg-border/70" />
            </div>
          ) : controller.isDetailError || !post ? (
            <ErrorState
              compact
              title="Không thể tải chi tiết bài viết"
              description="Bài viết có thể đã bị xóa hoặc kết nối tới máy chủ gặp gián đoạn."
              onRetry={controller.handleRetryDetail}
            />
          ) : (
            <>
              {/* Author & Status Row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {post.author.avatarUrl ? (
                    <AppImage
                      src={post.author.avatarUrl}
                      alt={post.author.fullName}
                      rounded
                      className="h-10 w-10 shrink-0 border border-border"
                    />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary-active border border-border">
                      {(post.author.fullName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {post.author.fullName}
                      </p>
                      {post.author.role === 'ADMIN' && (
                        <span className="rounded border border-secondary-strong bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-primary-active">
                          Quản trị
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate">
                      {post.author.email} · {formatDateTime(post.createdAt)} ·{' '}
                      {VISIBILITY_LABELS[post.visibility]}
                      {post.updatedAt && post.updatedAt !== post.createdAt
                        ? ` · Cập nhật ${formatDateTime(post.updatedAt)}`
                        : ''}
                    </p>
                  </div>
                </div>

                {post.moderationStatus === 'HIDDEN' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                    <EyeOffIcon className="w-3.5 h-3.5" />
                    <span>Đã ẩn kiểm duyệt</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span>Đang hiển thị</span>
                  </span>
                )}
              </div>

              {/* Moderation Notice Box */}
              {post.moderationStatus === 'HIDDEN' && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 space-y-1 text-xs">
                  <p className="font-semibold text-foreground">
                    Bài viết đang bị ẩn khỏi bảng tin cộng đồng
                  </p>
                  {post.moderationReason && (
                    <p className="text-foreground">
                      Lý do: {post.moderationReason}
                    </p>
                  )}
                  <p className="text-muted tabular-nums">
                    {post.moderatedAt
                      ? `Thực hiện lúc ${formatDateTime(post.moderatedAt)}`
                      : ''}
                    {post.moderatedBy
                      ? ` · Bởi ${post.moderatedBy.fullName} (${post.moderatedBy.email})`
                      : ''}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                {post.content.trim() ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                    {post.content}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted">
                    Bài viết không có nội dung văn bản.
                  </p>
                )}

                {post.media.length > 0 && (() => {
                  const visualMedia = post.media.filter(
                    (m) => m.type === 'IMAGE' || m.type === 'VIDEO',
                  );

                  return (
                    <div
                      className={`grid gap-2.5 pt-1 ${
                        post.media.length === 1
                          ? 'grid-cols-1'
                          : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {post.media.map((item, idx) => {
                        const visualIndex = visualMedia.indexOf(item);

                        return (
                          <div
                            key={item.id ?? `${item.url}-${idx}`}
                            className={`rounded-lg border border-border bg-card overflow-hidden ${
                              item.type === 'AUDIO' && post.media.length > 1
                                ? 'sm:col-span-2'
                                : ''
                            }`}
                          >
                            {item.type === 'IMAGE' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  controller.handleOpenLightbox(
                                    visualMedia,
                                    visualIndex >= 0 ? visualIndex : 0,
                                  )
                                }
                                title="Nhấn để phóng to ảnh ngay trong trang"
                                className="group relative block w-full bg-background/60 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                              >
                                <AppImage
                                  src={item.url}
                                  alt={item.alt || `Ảnh đính kèm ${idx + 1}`}
                                  objectFit="contain"
                                  className={`w-full h-auto rounded-none ${
                                    post.media.length === 1
                                      ? 'max-h-[70dvh]'
                                      : 'max-h-[400px]'
                                  }`}
                                />
                                <span className="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs opacity-90 group-hover:opacity-100 transition-opacity">
                                  <ZoomInIcon className="w-3.5 h-3.5 text-primary" />
                                  <span>Phóng to</span>
                                </span>
                              </button>
                            ) : item.type === 'VIDEO' ? (
                              <video
                                src={item.url}
                                controls
                                playsInline
                                className={`w-full h-auto object-contain bg-foreground ${
                                  post.media.length === 1
                                    ? 'max-h-[70dvh]'
                                    : 'max-h-[400px]'
                                }`}
                              />
                            ) : (
                              <div className="p-3 space-y-1">
                                <p className="text-xs font-medium text-muted">
                                  Bản ghi âm đính kèm
                                </p>
                                <audio
                                  src={item.url}
                                  controls
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Reaction Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-foreground tabular-nums">
                    {post.reactionCount.toLocaleString('vi-VN')} cảm xúc
                  </span>
                  {REACTION_OPTIONS.filter(
                    (opt) => (post.reactionBreakdown[opt.type] ?? 0) > 0,
                  ).map((opt) => (
                    <span key={opt.type} className="text-muted tabular-nums">
                      {opt.label}: {post.reactionBreakdown[opt.type]}
                    </span>
                  ))}
                </div>
                <span className="text-muted tabular-nums">
                  {post.shareCount.toLocaleString('vi-VN')} lượt chia sẻ
                </span>
              </div>

              {/* Comments Moderation Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    Bình luận ({post.comments.length.toLocaleString('vi-VN')})
                  </h2>
                  <span className="text-xs text-muted">
                    Có thể gỡ trực tiếp bình luận vi phạm
                  </span>
                </div>

                {post.comments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted">
                    Chưa có bình luận nào trong bài viết này.
                  </div>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                    {post.comments.map((cmt) => {
                      const isConfirmingThis =
                        controller.removeCommentTarget?.comment.id === cmt.id;

                      return (
                        <li key={cmt.id} className="p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground">
                                  {cmt.author.fullName}
                                </span>
                                {cmt.author.email && (
                                  <span className="text-xs text-muted">
                                    ({cmt.author.email})
                                  </span>
                                )}
                                <span className="text-xs text-muted tabular-nums">
                                  · {formatDateTime(cmt.createdAt)}
                                </span>
                              </div>
                              {cmt.content.trim() && (
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                                  {cmt.content}
                                </p>
                              )}
                              {cmt.media && (
                                <div className="mt-2 max-w-sm rounded-lg border border-border bg-background/60 overflow-hidden">
                                  {cmt.media.type === 'IMAGE' ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        controller.handleOpenLightbox(
                                          cmt.media ? [cmt.media] : [],
                                          0,
                                        )
                                      }
                                      title="Nhấn để phóng to ảnh bình luận"
                                      className="group relative block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                                    >
                                      <AppImage
                                        src={cmt.media.url}
                                        alt="Ảnh bình luận"
                                        objectFit="contain"
                                        className="max-h-60 w-full h-auto rounded-none"
                                      />
                                      <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full border border-border bg-card/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-xs opacity-90 group-hover:opacity-100">
                                        <ZoomInIcon className="w-3 h-3 text-primary" />
                                        <span>Phóng to</span>
                                      </span>
                                    </button>
                                  ) : (
                                    <video
                                      src={cmt.media.url}
                                      controls
                                      className="max-h-60 w-full h-auto object-contain bg-foreground"
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {!isConfirmingThis && (
                              <button
                                type="button"
                                onClick={() =>
                                  controller.handlePromptRemoveComment(
                                    post.id,
                                    cmt,
                                  )
                                }
                                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                                <span>Gỡ</span>
                              </button>
                            )}
                          </div>

                          {isConfirmingThis && (
                            <div className="rounded-lg border border-error/30 bg-error/10 p-3 space-y-2">
                              <label
                                htmlFor={`remove-cmt-reason-${cmt.id}`}
                                className="block text-xs font-medium text-foreground"
                              >
                                Xác nhận gỡ bình luận này (tùy chọn nhập lý do gửi tác giả):
                              </label>
                              <input
                                id={`remove-cmt-reason-${cmt.id}`}
                                type="text"
                                autoFocus
                                maxLength={500}
                                value={controller.removeCommentReason}
                                onChange={
                                  controller.handleRemoveCommentReasonChange
                                }
                                onCompositionEnd={
                                  controller.handleRemoveCommentCompositionEnd
                                }
                                onKeyDown={
                                  controller.handleRemoveCommentReasonKeyDown
                                }
                                placeholder="Ví dụ: Ngôn từ thiếu chuẩn mực..."
                                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                              />
                              {controller.removeCommentError && (
                                <p role="alert" className="text-xs text-error">
                                  {controller.removeCommentError}
                                </p>
                              )}
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={controller.isRemovingComment}
                                  onClick={controller.handleCancelRemoveComment}
                                  className="h-8 px-2.5 py-1 text-xs"
                                >
                                  Hủy
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  isLoading={controller.isRemovingComment}
                                  onClick={() =>
                                    void controller.handleConfirmRemoveComment()
                                  }
                                  className="h-8 px-2.5 py-1 text-xs"
                                >
                                  Xác nhận gỡ
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Moderation Actions */}
        {post && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3.5 bg-background/50 shrink-0">
            <Button
              type="button"
              variant="danger"
              onClick={() => controller.handleOpenRemoveModal(post)}
              className="gap-1.5 text-xs"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Gỡ bài viết</span>
            </Button>

            <div className="flex items-center gap-2">
              {post.moderationStatus === 'HIDDEN' ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={controller.restoringPostId === post.id}
                  onClick={() => void controller.handleRestorePost(post)}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" />
                  <span>
                    {controller.restoringPostId === post.id
                      ? 'Đang khôi phục...'
                      : 'Khôi phục hiển thị'}
                  </span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => controller.handleOpenHideModal(post)}
                  className="gap-1.5 text-xs"
                >
                  <EyeOffIcon className="w-3.5 h-3.5" />
                  <span>Ẩn bài viết</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={controller.handleCloseDetail}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminDialog>
  );
};
