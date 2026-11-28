import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppImage,
  Button,
  ErrorState,
  formatDateTime,
  formatRelativeTime,
  LoadingSpinner,
} from '@/core';
import {
  getReactionMeta,
  getTopReactions,
  REACTION_OPTIONS,
  type PostAppealSummary,
  type PostComment,
} from '@/features/posts';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CloseIcon,
  CommentIcon,
  CopyIcon,
  EditIcon,
  ImageIcon,
  LockIcon,
  ReactionIcon,
  SendIcon,
  ShareIcon,
  ThumbUpIcon,
  VideoIcon,
} from '../home/ClientIcons';
import { MediaLightboxModal } from '../home/MediaLightboxModal';
import { PostEditModal } from '../home/PostEditModal';
import {
  PostAvatarChip,
  PostMediaGallery,
  PostVisibilityBadge,
} from '../home/PostCard';
import { PostReactionsModal } from '../home/PostReactionsModal';
import { PostAppealModal } from '../profile/PostAppealModal';
import {
  AvatarViolationButton,
  PostViolationBadge,
  ViolationDetailModal,
  type ViolationModalTarget,
} from '@/ui/shared/ViolationIndicators';
import { useClientPostDetailController } from './post-detail.controller';

function renderAppealStatusPill(appeal: PostAppealSummary) {
  if (appeal.status === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-full border border-secondary-strong bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-active">
        Đang chờ Quản trị viên xem xét
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
      Đã gửi minh chứng giữ quyết định ẩn
    </span>
  );
}

const CommentNode: React.FC<{
  comment: PostComment;
  isReply?: boolean;
  onInspectAuthor: (userId: string) => void;
  onOpenLightbox: (items: PostComment['media'][], index: number) => void;
  onInspectViolation?: (target: ViolationModalTarget) => void;
}> = ({
  comment,
  isReply = false,
  onInspectAuthor,
  onOpenLightbox,
  onInspectViolation,
}) => (
  <div className="flex items-start gap-2.5">
    <div className="relative mt-0.5 shrink-0">
      <button
        type="button"
        onClick={() => onInspectAuthor(comment.author.id)}
        aria-label={`Xem hồ sơ của ${comment.author.fullName}`}
        className="block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <PostAvatarChip
          name={comment.author.fullName}
          avatarUrl={comment.author.avatarUrl}
          avatarViolation={comment.author.avatarViolation}
          sizeClass={isReply ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs'}
        />
      </button>
      {comment.author.avatarViolation && onInspectViolation && (
        <AvatarViolationButton
          size="sm"
          onClick={() =>
            onInspectViolation({
              kind: 'AVATAR',
              subjectName: comment.author.fullName,
              reason: comment.author.avatarViolation!.reason,
              flaggedAt: comment.author.avatarViolation!.flaggedAt,
              evidenceUrl:
                comment.author.avatarViolation!.evidenceUrl ??
                comment.author.avatarUrl ??
                null,
            })
          }
        />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="inline-block max-w-full rounded-2xl border border-border bg-background/70 px-3.5 py-2">
        <button
          type="button"
          onClick={() => onInspectAuthor(comment.author.id)}
          className="text-xs font-semibold text-foreground hover:text-primary hover:underline cursor-pointer text-left block"
        >
          {comment.author.fullName}
        </button>

        {comment.content && (
          <p className="mt-0.5 text-xs sm:text-sm text-foreground break-words whitespace-pre-line">
            {comment.content}
          </p>
        )}

        {comment.media && (
          <div className="mt-2">
            {comment.media.type === 'IMAGE' ? (
              <button
                type="button"
                onClick={() => onOpenLightbox([comment.media!], 0)}
                className="block overflow-hidden rounded-xl border border-border cursor-pointer"
              >
                <AppImage
                  src={comment.media.url}
                  alt={comment.media.alt || 'Ảnh bình luận'}
                  className="max-h-48 w-auto max-w-full rounded-none object-cover"
                />
              </button>
            ) : (
              <video
                src={comment.media.url}
                controls
                playsInline
                preload="metadata"
                className="max-h-52 w-auto max-w-full rounded-xl border border-border bg-foreground/5"
              />
            )}
          </div>
        )}
      </div>

      <div className="px-2 mt-1 text-[11px] text-muted tabular-nums">
        <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
          {formatRelativeTime(comment.createdAt)}
        </time>
        {isReply && <span> · Phản hồi</span>}
      </div>
    </div>
  </div>
);

export const ClientPostDetailView: React.FC = () => {
  const controller = useClientPostDetailController();
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [violationModalTarget, setViolationModalTarget] =
    useState<ViolationModalTarget | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !controller.post ||
      !controller.hasNextCommentsPage ||
      controller.isFetchingNextComments
    ) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          controller.handleLoadMoreComments();
        }
      },
      { rootMargin: '160px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    controller,
    controller.post,
    controller.hasNextCommentsPage,
    controller.isFetchingNextComments,
    controller.comments.length,
  ]);

  const { rootComments, repliesByParentId } = useMemo(() => {
    const ids = new Set(controller.comments.map((c) => c.id));
    const replyMap = new Map<string, PostComment[]>();
    const roots: PostComment[] = [];

    for (const cmt of controller.comments) {
      if (cmt.parentId && ids.has(cmt.parentId) && cmt.parentId !== cmt.id) {
        const list = replyMap.get(cmt.parentId) ?? [];
        list.push(cmt);
        replyMap.set(cmt.parentId, list);
      } else {
        roots.push(cmt);
      }
    }
    return { rootComments: roots, repliesByParentId: replyMap };
  }, [controller.comments]);

  if (controller.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="h-9 w-48 rounded-lg bg-secondary/50 animate-pulse" />
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-secondary/50" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-44 rounded bg-secondary/50" />
              <div className="h-3 w-28 rounded bg-border/70" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-border/70" />
            <div className="h-4 w-5/6 rounded bg-border/70" />
          </div>
          <div className="h-56 rounded-xl bg-border/60" />
        </div>
      </div>
    );
  }

  if (controller.isPostNotFound) {
    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <section
          aria-label="Không tìm thấy bài viết"
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-4 shadow-sm"
        >
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 text-warning">
            <LockIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h1 className="text-lg font-bold text-foreground">
              Không tìm thấy bài viết
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Bài viết này không tồn tại, đã bị gỡ bỏ hoặc bạn không có quyền xem nội dung này.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="primary"
              onClick={controller.handleNavigateToFeed}
            >
              Về bảng tin
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={controller.handleNavigateToMyProfile}
            >
              Về hồ sơ của tôi
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (controller.isError || !controller.post) {
    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <ErrorState
          title="Không thể tải chi tiết bài viết"
          description="Kết nối máy chủ bị gián đoạn khi tải bài viết. Vui lòng thử lại."
          onRetry={controller.handleRetryPost}
          secondaryAction={{
            label: 'Về bảng tin',
            onClick: controller.handleNavigateToFeed,
          }}
        />
      </div>
    );
  }

  const post = controller.post;
  const topReactions = getTopReactions(post.reactionBreakdown, 3);
  const currentReactionMeta = post.userReaction
    ? getReactionMeta(post.userReaction)
    : null;
  const appealsList = controller.appealsList;
  const latestAppeal = appealsList[0] ?? null;
  const canSubmitAppeal =
    controller.isOwnPost &&
    post.moderationStatus === 'HIDDEN' &&
    (!latestAppeal || latestAppeal.status !== 'PENDING');
  const visibleAppeals = controller.isAppealsExpanded
    ? appealsList
    : appealsList.slice(0, 1);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* Top Context Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={controller.handleGoBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
            Chi tiết bài viết · {post.author.fullName}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {controller.isOwnPost && (
            <Button
              type="button"
              variant="secondary"
              onClick={controller.handleOpenEditPost}
              className="h-8 px-3 py-1 text-xs gap-1.5"
            >
              <EditIcon className="w-3.5 h-3.5" />
              <span>Chỉnh sửa bài viết</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void controller.handleCopyPostLink()}
            className="h-8 px-3 py-1 text-xs gap-1.5"
          >
            <CopyIcon className="w-3.5 h-3.5 text-muted" />
            <span>Sao chép liên kết</span>
          </Button>
        </div>
      </div>

      {/* Main Post Detail Card */}
      <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Author Header */}
        <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
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
                  sizeClass="h-11 w-11 text-sm"
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
                {controller.isOwnPost && (
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

              <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5 tabular-nums">
                <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)}>
                  {formatDateTime(post.createdAt)}
                </time>
                <span aria-hidden="true">·</span>
                <PostVisibilityBadge visibility={post.visibility} />
              </div>
            </div>
          </div>
        </header>

        {/* Moderation & Full Appeal History Block (Owner Only, HIDDEN Only) */}
        {controller.isOwnPost && post.moderationStatus === 'HIDDEN' && (
          <section
            aria-label="Thông tin kiểm duyệt và lịch sử khiếu nại"
            className="mx-4 mt-4 sm:mx-6 rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-card px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                    <LockIcon className="w-3 h-3" />
                    <span>Bài viết đang bị ẩn</span>
                  </span>
                  {post.moderatedAt && (
                    <span className="text-[11px] text-muted tabular-nums">
                      Cập nhật {formatDateTime(post.moderatedAt)}
                    </span>
                  )}
                </div>

                <p className="text-foreground leading-relaxed">
                  <strong>Lý do bị ẩn:</strong>{' '}
                  {post.moderationReason?.trim() ||
                    'Vi phạm tiêu chuẩn cộng đồng'}
                </p>
              </div>

              {canSubmitAppeal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={controller.handleOpenAppealModal}
                  className="h-8 px-3 py-1 text-xs border-warning/50 bg-card text-warning hover:bg-warning/10 shrink-0"
                >
                  Khiếu nại
                </Button>
              )}
            </div>

            {appealsList.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-border/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    Lịch sử khiếu nại &amp; minh chứng ({appealsList.length})
                  </span>

                  {appealsList.length > 1 && (
                    <button
                      type="button"
                      onClick={controller.handleToggleAppealsExpanded}
                      className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                    >
                      {controller.isAppealsExpanded
                        ? 'Thu gọn lịch sử'
                        : `Mở rộng toàn bộ (${appealsList.length})`}
                    </button>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {visibleAppeals.map((appeal, index) => (
                    <li
                      key={appeal.id}
                      className="rounded-xl border border-border bg-card p-3 space-y-2"
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
                        <div className="rounded-lg border border-error/35 bg-error/10 p-2.5 space-y-1">
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
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Full Post Content */}
        {post.content && (
          <div className="px-4 py-4 sm:px-6">
            <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-foreground">
              {post.content}
            </p>
          </div>
        )}

        {/* Media Gallery */}
        {post.media && post.media.length > 0 && (
          <div className={`${post.content ? 'pb-2' : 'pt-4 pb-2'} px-4 sm:px-6`}>
            <PostMediaGallery
              media={post.media}
              onOpenLightbox={controller.handleOpenLightbox}
            />
          </div>
        )}

        {/* Interaction Stats */}
        <div className="mx-4 sm:mx-6 py-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted tabular-nums">
          <div className="flex items-center gap-1.5 min-h-5">
            {post.reactionCount > 0 ? (
              <button
                type="button"
                onClick={controller.handleOpenReactionsModal}
                className="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1.5 hover:bg-background hover:text-foreground transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center -space-x-1">
                  {topReactions.map((item) => (
                    <span
                      key={item.type}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-card"
                    >
                      <ReactionIcon type={item.type} className="w-4 h-4" />
                    </span>
                  ))}
                </span>
                <span className="font-medium hover:underline">
                  {post.reactionCount.toLocaleString('vi-VN')} cảm xúc
                </span>
              </button>
            ) : (
              <span>Chưa có cảm xúc</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span>{post.commentCount.toLocaleString('vi-VN')} bình luận</span>
            <span>{post.shareCount.toLocaleString('vi-VN')} chia sẻ</span>
          </div>
        </div>

        {/* 4 Action Buttons + Quick Reaction Strip */}
        <div className="mx-4 sm:mx-6 border-t border-border py-1.5 space-y-1.5">
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() =>
                setIsReactionPickerOpen((prev) => !prev)
              }
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentReactionMeta
                  ? `${currentReactionMeta.activeBgClass} ${currentReactionMeta.activeTextClass} font-semibold`
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              {currentReactionMeta ? (
                <ReactionIcon type={currentReactionMeta.type} className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ThumbUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span>{currentReactionMeta?.label ?? 'Thích'}</span>
            </button>

            <button
              type="button"
              onClick={controller.handleFocusCommentInput}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            >
              <CommentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Bình luận</span>
            </button>

            <button
              type="button"
              onClick={() => void controller.handleSharePost()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            >
              <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Chia sẻ</span>
            </button>

            <button
              type="button"
              onClick={() => void controller.handleToggleBookmark()}
              aria-pressed={post.isBookmarked}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                post.isBookmarked
                  ? 'bg-secondary/70 text-primary font-semibold'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              <BookmarkIcon
                className="w-4 h-4 sm:w-5 sm:h-5"
                filled={post.isBookmarked}
              />
              <span>{post.isBookmarked ? 'Đã lưu' : 'Lưu'}</span>
            </button>
          </div>

          {isReactionPickerOpen && (
            <div
              role="toolbar"
              aria-label="Chọn cảm xúc"
              className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-border bg-background/60 p-1.5"
            >
              {REACTION_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setIsReactionPickerOpen(false);
                    void controller.handleReactPost(option.type);
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    post.userReaction === option.type
                      ? 'bg-secondary text-primary-active border border-secondary-strong'
                      : 'hover:bg-card text-foreground'
                  }`}
                >
                  <ReactionIcon type={option.type} className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paginated Comments + Infinite Scroll */}
        <section
          aria-label="Danh sách bình luận bài viết"
          className="border-t border-border bg-background/40 px-4 py-4 sm:px-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">
              Bình luận ({controller.totalRootComments > 0 ? `${rootComments.length}/${controller.totalRootComments} bình luận gốc` : post.commentCount.toLocaleString('vi-VN')})
            </h2>
          </div>

          {/* Comment Composer */}
          <form
            onSubmit={(e) => void controller.handleSubmitComment(e)}
            className="flex items-start gap-2.5"
          >
            <PostAvatarChip
              name={controller.currentUser?.fullName || 'Bạn'}
              avatarUrl={controller.currentUser?.avatarUrl}
              sizeClass="h-8 w-8 text-xs mt-0.5"
            />
            <div className="flex-1 min-w-0 space-y-2">
              {controller.commentMedia && (
                <div className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-7 shadow-sm">
                  {controller.commentMedia.type === 'IMAGE' ? (
                    <AppImage
                      src={controller.commentMedia.url}
                      alt={controller.commentMedia.alt || 'Ảnh bình luận'}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <video
                      src={controller.commentMedia.url}
                      className="h-14 w-20 rounded-lg object-cover bg-foreground/5"
                      muted
                    />
                  )}
                  <span className="text-[11px] font-medium text-muted max-w-[140px] truncate">
                    {controller.commentMedia.type === 'IMAGE'
                      ? 'Ảnh đính kèm'
                      : 'Video ngắn'}
                  </span>
                  <button
                    type="button"
                    onClick={controller.handleRemoveCommentMedia}
                    aria-label="Gỡ tệp đính kèm bình luận"
                    className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted hover:bg-error hover:text-on-primary cursor-pointer"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div
                className={`flex items-center gap-1 rounded-full border bg-card pl-3.5 pr-1.5 py-1 focus-within:ring-2 transition-colors ${
                  controller.commentError
                    ? 'border-error focus-within:border-error focus-within:ring-error/25'
                    : 'border-border focus-within:border-primary focus-within:ring-primary/40'
                }`}
              >
                <input
                  id="client-post-detail-comment-input"
                  type="text"
                  value={controller.commentDraft}
                  onChange={(e) =>
                    controller.handleCommentDraftChange(e.target.value)
                  }
                  placeholder="Viết bình luận..."
                  aria-label="Viết bình luận"
                  className="flex-1 min-w-0 bg-transparent py-1 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none"
                />

                <label
                  title="Chèn ảnh vào bình luận"
                  aria-label="Chèn ảnh vào bình luận"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-success hover:bg-background transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => controller.handlePickCommentMedia('IMAGE', e)}
                    className="sr-only"
                  />
                </label>

                <label
                  title="Chèn video ngắn vào bình luận"
                  aria-label="Chèn video ngắn vào bình luận"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary hover:bg-background transition-colors cursor-pointer"
                >
                  <VideoIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => controller.handlePickCommentMedia('VIDEO', e)}
                    className="sr-only"
                  />
                </label>

                <button
                  type="submit"
                  disabled={controller.isSubmittingComment}
                  aria-label="Gửi bình luận"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-background disabled:text-muted cursor-pointer transition-colors"
                >
                  <SendIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {controller.commentError && (
                <p role="alert" className="px-2 text-xs text-error">
                  {controller.commentError}
                </p>
              )}
            </div>
          </form>

          {controller.isCommentsLoading ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted">
              <LoadingSpinner size="sm" />
              <span>Đang tải bình luận...</span>
            </div>
          ) : controller.isCommentsError ? (
            <ErrorState
              compact
              title="Không thể tải bình luận"
              description="Vui lòng thử lại để xem danh sách bình luận."
              onRetry={controller.handleRetryComments}
            />
          ) : rootComments.length === 0 ? (
            <p className="py-4 text-center text-xs sm:text-sm text-muted">
              Chưa có bình luận nào. Hãy gửi bình luận đầu tiên của bạn!
            </p>
          ) : (
            <ul className="space-y-3.5">
              {rootComments.map((root) => {
                const replies = repliesByParentId.get(root.id) ?? [];
                return (
                  <li key={root.id} className="space-y-2">
                    <CommentNode
                      comment={root}
                      onInspectAuthor={controller.handleOpenUserProfile}
                      onInspectViolation={setViolationModalTarget}
                      onOpenLightbox={(items, idx) =>
                        controller.handleOpenLightbox(
                          items.filter(
                            (m): m is NonNullable<typeof m> => Boolean(m),
                          ),
                          idx,
                        )
                      }
                    />
                    {replies.length > 0 && (
                      <div className="ml-5 sm:ml-7 border-l-2 border-border pl-3.5 space-y-2.5">
                        {replies.map((reply) => (
                          <CommentNode
                            key={reply.id}
                            comment={reply}
                            isReply
                            onInspectAuthor={controller.handleOpenUserProfile}
                            onInspectViolation={setViolationModalTarget}
                            onOpenLightbox={(items, idx) =>
                              controller.handleOpenLightbox(
                                items.filter(
                                  (m): m is NonNullable<typeof m> => Boolean(m),
                                ),
                                idx,
                              )
                            }
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
            {controller.isFetchingNextComments ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted">
                <LoadingSpinner size="sm" />
                <span>Đang tải thêm bình luận...</span>
              </div>
            ) : controller.isFetchNextCommentsError ? (
              <Button
                type="button"
                variant="outline"
                onClick={controller.handleLoadMoreComments}
                className="text-xs"
              >
                Thử tải thêm bình luận
              </Button>
            ) : controller.hasNextCommentsPage ? (
              <Button
                type="button"
                variant="outline"
                onClick={controller.handleLoadMoreComments}
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
      </article>

      <PostReactionsModal controller={controller} />
      <PostEditModal
        post={controller.editingPost}
        friends={controller.friends}
        profileUser={controller.profileUser}
        onClose={controller.handleCloseEditPost}
        onOpenLightbox={controller.handleOpenLightbox}
      />
      <MediaLightboxModal controller={controller} />
      <PostAppealModal
        post={controller.appealTargetPost}
        isSubmitting={controller.isSubmittingAppeal}
        onClose={controller.handleCloseAppealModal}
        onSubmitAppeal={controller.handleSubmitPostAppeal}
      />
      <ViolationDetailModal
        target={violationModalTarget}
        onClose={() => setViolationModalTarget(null)}
      />
    </div>
  );
};

export default ClientPostDetailView;
