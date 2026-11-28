import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AppImage,
  Button,
  ErrorState,
  formatDateTime,
  LoadingSpinner,
} from '@/core';
import { getTopReactions, type Post, type PostAppealSummary, type PostComment } from '@/features/posts';
import {
  AdminReactionIcon,
  CloseIcon,
  CommentIcon,
  EyeOffIcon,
  ShareIcon,
} from '../components/AdminIcons';
import { AdminPostVisibilityChip } from '../components/AdminPostVisibilityChip';
import { PostViolationBadge } from '@/ui/shared/ViolationIndicators';
import { AdminCommentBubbleItem } from './AdminPostCommentsSection';
import { AdminUserPostActionMenu } from './AdminUserPostActionMenu';
import { AdminUserPostModerationNotice } from './AdminUserPostModerationNotice';

export interface AdminUserPostDetailModalProps {
  isOpen: boolean;
  postId: string | null;
  post: Post | null;
  isAppealsExpanded: boolean;
  fallbackAuthorName: string;
  fallbackAuthorAvatarUrl?: string | null;
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  comments: PostComment[];
  totalRootComments: number;
  isLoadingComments: boolean;
  isCommentsError: boolean;
  hasNextCommentsPage: boolean;
  isFetchingNextComments: boolean;
  isFetchNextCommentsError: boolean;
  isModeratingPost: boolean;
  isRestoringPost: boolean;
  isRestoringAppeal: boolean;
  onClose: () => void;
  onToggleAppealsExpanded: () => void;
  onRetryDetail: () => void;
  onRetryComments: () => void;
  onLoadMoreComments: () => void;
  onInspectAuthor: (userId: string) => void;
  onOpenReactionsModal: (postId: string) => void;
  onOpenSharesModal: (postId: string) => void;
  onHidePost: (post: Post) => void;
  onRestorePost: (post: Post) => void;
  onFlagViolation: (post: Post) => void;
  onUnflagViolation?: (post: Post) => void;
  onInspectViolation?: (post: Post) => void;
  onRemovePost: (post: Post) => void;
  onRequestRemoveComment: (postId: string, comment: PostComment) => void;
  onRequestRestoreAppeal: (post: Post, appeal: PostAppealSummary) => void;
  onOpenEvidenceModal: (post: Post, appeal: PostAppealSummary) => void;
}

export const AdminUserPostDetailModal: React.FC<
  AdminUserPostDetailModalProps
> = ({
  isOpen,
  postId,
  post,
  isAppealsExpanded,
  fallbackAuthorName,
  fallbackAuthorAvatarUrl,
  isLoading,
  isError,
  isNotFound,
  comments,
  totalRootComments,
  isLoadingComments,
  isCommentsError,
  hasNextCommentsPage,
  isFetchingNextComments,
  isFetchNextCommentsError,
  isModeratingPost,
  isRestoringPost,
  isRestoringAppeal,
  onClose,
  onToggleAppealsExpanded,
  onRetryDetail,
  onRetryComments,
  onLoadMoreComments,
  onInspectAuthor,
  onOpenReactionsModal,
  onOpenSharesModal,
  onHidePost,
  onRestorePost,
  onFlagViolation,
  onUnflagViolation,
  onInspectViolation,
  onRemovePost,
  onRequestRemoveComment,
  onRequestRestoreAppeal,
  onOpenEvidenceModal,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !hasNextCommentsPage || isFetchingNextComments) return;
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreComments();
        }
      },
      { root, rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    isOpen,
    hasNextCommentsPage,
    isFetchingNextComments,
    onLoadMoreComments,
    comments.length,
  ]);

  const { rootComments, repliesByParentId } = useMemo(() => {
    const commentIds = new Set(comments.map((c) => c.id));
    const replyMap = new Map<string, PostComment[]>();
    const roots: PostComment[] = [];

    for (const comment of comments) {
      if (
        comment.parentId &&
        commentIds.has(comment.parentId) &&
        comment.parentId !== comment.id
      ) {
        const group = replyMap.get(comment.parentId) ?? [];
        group.push(comment);
        replyMap.set(comment.parentId, group);
      } else {
        roots.push(comment);
      }
    }
    return { rootComments: roots, repliesByParentId: replyMap };
  }, [comments]);

  if (!isOpen || typeof document === 'undefined') return null;

  const authorName = post?.author.fullName?.trim() || fallbackAuthorName;
  const authorAvatar = post?.author.avatarUrl ?? fallbackAuthorAvatarUrl ?? null;
  const authorInitial = authorName.charAt(0).toUpperCase();
  const topReactions = post ? getTopReactions(post.reactionBreakdown, 3) : [];
  const isHidden = post?.moderationStatus === 'HIDDEN';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-post-detail-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-md flex flex-col max-h-[min(90dvh,780px)] overflow-hidden"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="admin-user-post-detail-modal-title"
              className="text-base font-semibold text-foreground truncate"
            >
              Chi tiết bài viết
            </h2>
            {postId && (
              <p className="text-[11px] font-mono text-muted truncate">
                #{postId.slice(0, 8)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết bài viết"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          {isLoading ? (
            <div className="space-y-4 animate-pulse" role="status">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/50" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-44 rounded bg-secondary/50" />
                  <div className="h-3 w-32 rounded bg-border/70" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-border/70" />
                <div className="h-4 w-5/6 rounded bg-border/70" />
              </div>
              <div className="h-40 rounded-xl bg-border/60" />
            </div>
          ) : isNotFound ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 text-warning">
                <EyeOffIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-semibold text-foreground">
                  Không tìm thấy bài viết trong cơ sở dữ liệu
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Bài viết với mã <span className="font-mono text-foreground">{postId}</span> không tồn tại, đã bị gỡ bỏ khỏi hệ thống hoặc đường dẫn không hợp lệ.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button type="button" variant="primary" onClick={onClose}>
                  Đóng và quay lại hồ sơ
                </Button>
              </div>
            </div>
          ) : isError || !post ? (
            <ErrorState
              title="Không thể tải chi tiết bài viết"
              description="Kết nối máy chủ bị gián đoạn khi tải dữ liệu bài viết."
              onRetry={onRetryDetail}
              secondaryAction={{ label: 'Đóng', onClick: onClose }}
            />
          ) : (
            <>
              {/* Author + Visibility + Moderation Menu */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {authorAvatar ? (
                    <AppImage
                      src={authorAvatar}
                      alt={authorName}
                      rounded
                      className="h-10 w-10 shrink-0 border border-border"
                    />
                  ) : (
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-primary">
                      {authorInitial}
                    </span>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {authorName}
                      </span>
                      <AdminPostVisibilityChip visibility={post.visibility} />
                      {isHidden && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                          <EyeOffIcon className="w-3 h-3" />
                          <span>Đã ẩn</span>
                        </span>
                      )}
                      {post.violationFlag && onInspectViolation && (
                        <PostViolationBadge
                          onClick={() => onInspectViolation(post)}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted tabular-nums">
                      Đăng lúc {formatDateTime(post.createdAt)}
                    </p>
                  </div>
                </div>

                <AdminUserPostActionMenu
                  postId={post.id}
                  moderationStatus={post.moderationStatus}
                  isViolationFlagged={Boolean(post.violationFlag)}
                  disabled={isModeratingPost}
                  isRestoring={isRestoringPost}
                  onHidePost={() => onHidePost(post)}
                  onRestorePost={() => onRestorePost(post)}
                  onFlagViolation={() => onFlagViolation(post)}
                  onUnflagViolation={
                    onUnflagViolation ? () => onUnflagViolation(post) : undefined
                  }
                  onRemovePost={() => onRemovePost(post)}
                />
              </div>

              {/* Hidden Moderation & Appeal History Notice */}
              <AdminUserPostModerationNotice
                post={post}
                mode="expanded"
                isAppealsExpanded={isAppealsExpanded}
                onToggleAppealsExpanded={onToggleAppealsExpanded}
                onRequestRestoreAppeal={onRequestRestoreAppeal}
                onOpenEvidenceModal={onOpenEvidenceModal}
                isRestoringAppeal={isRestoringAppeal}
              />

              {/* Content */}
              {post.content && (
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {post.content}
                </p>
              )}

              {/* Media */}
              {post.media.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {post.media.map((media, idx) =>
                    media.type === 'IMAGE' ? (
                      <AppImage
                        key={`${post.id}-modal-media-${idx}`}
                        src={media.url}
                        alt={media.fileName || 'Hình ảnh bài viết'}
                        className="h-52 w-full rounded-xl border border-border object-cover"
                      />
                    ) : media.type === 'VIDEO' ? (
                      <video
                        key={`${post.id}-modal-media-${idx}`}
                        src={media.url}
                        controls
                        className="h-52 w-full rounded-xl border border-border bg-background object-cover"
                      />
                    ) : (
                      <audio
                        key={`${post.id}-modal-media-${idx}`}
                        src={media.url}
                        controls
                        className="w-full"
                      />
                    ),
                  )}
                </div>
              )}

              {/* Stats Row */}
              <div className="border-y border-border py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted tabular-nums">
                <div className="flex items-center gap-1.5">
                  {post.reactionCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenReactionsModal(post.id)}
                      className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline cursor-pointer"
                    >
                      <span className="inline-flex items-center -space-x-1">
                        {topReactions.map((item) => (
                          <AdminReactionIcon
                            key={item.type}
                            type={item.type}
                            className="w-4 h-4"
                          />
                        ))}
                      </span>
                      <span>{post.reactionCount.toLocaleString('vi-VN')} cảm xúc</span>
                    </button>
                  ) : (
                    <span>0 cảm xúc</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                    <CommentIcon className="w-3.5 h-3.5 text-primary" />
                    <span>{post.commentCount.toLocaleString('vi-VN')} bình luận</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSharesModal(post.id)}
                    className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline cursor-pointer"
                  >
                    <ShareIcon className="w-3.5 h-3.5" />
                    <span>{post.shareCount.toLocaleString('vi-VN')} chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Paginated Comments List with Infinite Scroll */}
              <section aria-label="Danh sách bình luận đầy đủ" className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Toàn bộ bình luận ({totalRootComments > 0 ? `${rootComments.length}/${totalRootComments} bình luận gốc` : post.commentCount.toLocaleString('vi-VN')})
                  </h3>
                </div>

                {isLoadingComments ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted">
                    <LoadingSpinner size="sm" />
                    <span>Đang tải bình luận...</span>
                  </div>
                ) : isCommentsError ? (
                  <ErrorState
                    compact
                    title="Không thể tải bình luận"
                    description="Vui lòng thử lại để tải danh sách bình luận."
                    onRetry={onRetryComments}
                  />
                ) : rootComments.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted rounded-xl border border-border bg-background/40">
                    Bài viết này chưa có bình luận nào.
                  </p>
                ) : (
                  <ul className="space-y-3.5">
                    {rootComments.map((root) => {
                      const replies = repliesByParentId.get(root.id) ?? [];
                      return (
                        <li key={root.id} className="space-y-2">
                          <AdminCommentBubbleItem
                            postId={post.id}
                            comment={root}
                            onInspectAuthor={onInspectAuthor}
                            onRequestRemoveComment={onRequestRemoveComment}
                          />
                          {replies.length > 0 && (
                            <div className="ml-5 sm:ml-6 border-l-2 border-border pl-3.5 space-y-2.5">
                              {replies.map((reply) => (
                                <AdminCommentBubbleItem
                                  key={reply.id}
                                  postId={post.id}
                                  comment={reply}
                                  isReply
                                  onInspectAuthor={onInspectAuthor}
                                  onRequestRemoveComment={onRequestRemoveComment}
                                />
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div ref={sentinelRef} className="py-2 text-center">
                  {isFetchingNextComments ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs text-muted">
                      <LoadingSpinner size="sm" />
                      <span>Đang tải thêm bình luận...</span>
                    </div>
                  ) : isFetchNextCommentsError ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onLoadMoreComments}
                      className="text-xs"
                    >
                      Thử tải thêm bình luận
                    </Button>
                  ) : hasNextCommentsPage ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onLoadMoreComments}
                      className="text-xs"
                    >
                      Tải thêm bình luận
                    </Button>
                  ) : rootComments.length > 0 ? (
                    <p className="text-[11px] text-muted">
                      Đã hiển thị toàn bộ bình luận của bài viết.
                    </p>
                  ) : null}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
