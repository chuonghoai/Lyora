import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateTime, formatRelativeTime } from '@/core';
import {
  AvatarViolationButton,
  PostViolationBadge,
  ViolationDetailModal,
  type ViolationModalTarget,
} from '@/ui/shared/ViolationIndicators';
import type { PostFeedController } from './post-feed.controller';
import {
  PostAvatarChip,
  PostCommentForm,
  PostCommentsList,
  PostInteractionsBlock,
  PostMediaGallery,
  PostVisibilityBadge,
} from './PostCard';
import { CloseIcon } from './ClientIcons';

export interface PostDetailModalProps {
  controller: PostFeedController;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ controller }) => {
  const [violationModalTarget, setViolationModalTarget] =
    useState<ViolationModalTarget | null>(null);
  const post = controller.detailPost;
  if (!post || typeof document === 'undefined') {
    return null;
  }

  const isOwnPost =
    controller.currentUser?.id === post.author.id ||
    controller.currentUser?.email === post.author.email;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Bài viết của ${post.author.fullName}`}
      onClick={controller.handleClosePostDetail}
      className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        {/* Header cố định ở đỉnh Modal: "Bài viết của ..." */}
        <header className="relative shrink-0 flex items-center justify-center border-b border-border bg-card px-12 py-3.5">
          <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
            Bài viết của {post.author.fullName}
          </h2>
          <button
            type="button"
            onClick={controller.handleClosePostDetail}
            aria-label="Đóng chi tiết bài viết"
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted hover:text-foreground hover:bg-border/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Nội dung bài viết & danh sách bình luận mở rộng cuộn bên trong Modal */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Thông tin tác giả */}
          <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => controller.handleOpenUserProfile(post.author.id)}
                  aria-label={`Xem hồ sơ của ${post.author.fullName}`}
                  className="block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <PostAvatarChip
                    name={post.author.fullName}
                    avatarUrl={post.author.avatarUrl}
                    avatarViolation={post.author.avatarViolation}
                  />
                </button>
                {post.author.avatarViolation && (
                  <AvatarViolationButton
                    size="sm"
                    onClick={() =>
                      setViolationModalTarget({
                        kind: 'AVATAR',
                        subjectName: post.author.fullName,
                        reason: post.author.avatarViolation!.reason,
                        flaggedAt: post.author.avatarViolation!.flaggedAt,
                        evidenceUrl:
                          post.author.avatarViolation!.evidenceUrl ??
                          post.author.avatarUrl ??
                          null,
                      })
                    }
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => controller.handleOpenUserProfile(post.author.id)}
                    className="text-sm sm:text-base font-semibold text-foreground hover:text-primary hover:underline truncate cursor-pointer text-left"
                  >
                    {post.author.fullName}
                  </button>
                  {isOwnPost && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-active">
                      Bạn
                    </span>
                  )}
                  {post.violationFlag && (
                    <PostViolationBadge
                      onClick={() =>
                        setViolationModalTarget({
                          kind: 'POST',
                          postId: post.id,
                          subjectName: post.author.fullName,
                          reason: post.violationFlag!.reason,
                          flaggedAt: post.violationFlag!.flaggedAt,
                          postExcerpt: post.content,
                        })
                      }
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      controller.handleClosePostDetail();
                      controller.handleOpenPostDetailPage(post.id);
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)}>
                      {formatRelativeTime(post.createdAt)}
                    </time>
                  </button>
                  <span aria-hidden="true">·</span>
                  <PostVisibilityBadge visibility={post.visibility} />
                </div>
              </div>
            </div>
          </div>

          {/* Toàn bộ văn bản bài viết (không thu gọn) */}
          {post.content && (
            <div className="px-4 py-3 sm:px-5">
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-foreground">
                {post.content}
              </p>
            </div>
          )}

          {/* Media đầy đủ */}
          {post.media && post.media.length > 0 && (
            <div className="px-4 pb-2 sm:px-5">
              <PostMediaGallery
                media={post.media}
                onOpenLightbox={controller.handleOpenLightbox}
              />
            </div>
          )}

          {/* Thống kê tương tác (Hover xem danh sách có pagination) + Thanh 4 nút */}
          <PostInteractionsBlock
            post={post}
            controller={controller}
            onCommentClick={() => controller.handleFocusCommentInput(post.id, 'modal')}
            onStatsCommentsClick={() => controller.handleFocusCommentInput(post.id, 'modal')}
          />

          {/* Toàn bộ danh sách bình luận được nới rộng */}
          <section
            aria-label="Tất cả bình luận"
            className="border-t border-border bg-background/40 px-4 py-4 sm:px-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                Tất cả bình luận ({post.commentCount})
              </h3>
            </div>

            {post.comments.length === 0 ? (
              <p className="py-4 text-center text-xs sm:text-sm text-muted">
                Chưa có bình luận nào. Hãy gửi bình luận đầu tiên của bạn bên dưới!
              </p>
            ) : (
              <PostCommentsList
                comments={post.comments}
                controller={controller}
                onInspectViolation={setViolationModalTarget}
              />
            )}
          </section>
        </div>

        {/* Footer nhập bình luận cố định ở đáy Modal (kèm 2 nút Ảnh / Video ngắn) */}
        <footer className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-5">
          <PostCommentForm
            postId={post.id}
            inputSuffix="modal"
            placeholder={
              post.comments.length === 0
                ? 'Hãy gửi bình luận đầu tiên của bạn...'
                : 'Viết bình luận...'
            }
            controller={controller}
          />
        </footer>
      </article>
      <ViolationDetailModal
        target={violationModalTarget}
        onClose={() => setViolationModalTarget(null)}
      />
    </div>,
    document.body,
  );
};
