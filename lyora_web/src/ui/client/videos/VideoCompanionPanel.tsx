import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppImage, formatDateTime, formatRelativeTime } from '@/core';
import {
  getReactionMeta,
  getTopReactions,
  REACTION_OPTIONS,
  type Post,
} from '@/features/posts';
import {
  CloseIcon,
  CommentIcon,
  CopyIcon,
  ImageIcon,
  ReactionIcon,
  SendIcon,
  ShareIcon,
  ThumbUpIcon,
  VideoIcon,
} from '../home/ClientIcons';
import {
  PostAudioPlayer,
  PostAvatarChip,
  PostVisibilityBadge,
} from '../home/PostCard';
import {
  extractPostAuxiliaryMedia,
  type VideosController,
} from './videos.controller';

export interface VideoCompanionPanelProps {
  post: Post;
  controller: VideosController;
}

const CAPTION_COLLAPSE_LENGTH = 200;

export const VideoCompanionPanel: React.FC<VideoCompanionPanelProps> = ({
  post,
  controller,
}) => {
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isReactionDockOpen, setIsReactionDockOpen] = useState(false);
  const [dockPos, setDockPos] = useState<{ left: number; bottom?: number; top?: number } | null>(
    null,
  );

  const likeTriggerRef = useRef<HTMLDivElement>(null);
  const dockOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dockCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwnPost =
    controller.currentUser?.id === post.author.id ||
    controller.currentUser?.email === post.author.email;
  const activeReaction = post.userReaction ? getReactionMeta(post.userReaction) : null;
  const topReactions = getTopReactions(post.reactionBreakdown, 3);
  const { images, audios } = extractPostAuxiliaryMedia(post);

  const isLongCaption = post.content.length > CAPTION_COLLAPSE_LENGTH;
  const visibleCaption =
    isLongCaption && !isCaptionExpanded
      ? `${post.content.slice(0, CAPTION_COLLAPSE_LENGTH).trimEnd()}...`
      : post.content;

  const commentDraft = controller.commentDrafts[post.id] ?? '';
  const commentMedia = controller.commentMediaDrafts[post.id] ?? null;
  const commentError = controller.commentErrors[post.id];
  const isMobileCommentsOpen = Boolean(controller.mobileCommentsOpenMap[post.id]);

  useEffect(() => {
    return () => {
      if (dockOpenTimerRef.current) clearTimeout(dockOpenTimerRef.current);
      if (dockCloseTimerRef.current) clearTimeout(dockCloseTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isReactionDockOpen || !likeTriggerRef.current) {
      setDockPos(null);
      return;
    }
    const updateDockPosition = () => {
      if (!likeTriggerRef.current) return;
      const rect = likeTriggerRef.current.getBoundingClientRect();
      const dockWidth = 316;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - dockWidth - 8));
      const openUpward = rect.top >= 72;
      setDockPos(
        openUpward
          ? { left, bottom: window.innerHeight - rect.top + 8 }
          : { left, top: rect.bottom + 8 },
      );
    };
    updateDockPosition();
    window.addEventListener('scroll', updateDockPosition, true);
    window.addEventListener('resize', updateDockPosition);
    return () => {
      window.removeEventListener('scroll', updateDockPosition, true);
      window.removeEventListener('resize', updateDockPosition);
    };
  }, [isReactionDockOpen]);

  const handleEnterDockZone = () => {
    if (dockCloseTimerRef.current) {
      clearTimeout(dockCloseTimerRef.current);
      dockCloseTimerRef.current = null;
    }
    if (dockOpenTimerRef.current) clearTimeout(dockOpenTimerRef.current);
    dockOpenTimerRef.current = setTimeout(() => {
      setIsReactionDockOpen(true);
    }, 90);
  };

  const handleLeaveDockZone = () => {
    if (dockOpenTimerRef.current) {
      clearTimeout(dockOpenTimerRef.current);
      dockOpenTimerRef.current = null;
    }
    if (dockCloseTimerRef.current) clearTimeout(dockCloseTimerRef.current);
    dockCloseTimerRef.current = setTimeout(() => {
      setIsReactionDockOpen(false);
    }, 180);
  };

  return (
    <div className="flex w-full lg:w-[390px] xl:w-[430px] lg:h-full shrink-0 flex-col border-t lg:border-t-0 lg:border-l border-border bg-card">
      {/* Đầu panel: Tác giả + Nội dung bài đăng + Media đi kèm */}
      <div className="shrink-0 p-4 space-y-3 border-b border-border">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => controller.handleOpenUserProfile(post.author.id)}
              aria-label={`Xem hồ sơ của ${post.author.fullName}`}
              className="shrink-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <PostAvatarChip name={post.author.fullName} avatarUrl={post.author.avatarUrl} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => controller.handleOpenUserProfile(post.author.id)}
                  className="text-sm font-semibold text-foreground hover:text-primary hover:underline truncate cursor-pointer text-left"
                >
                  {post.author.fullName}
                </button>
                {isOwnPost && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary-active">
                    Bạn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)}>
                  {formatRelativeTime(post.createdAt)}
                </time>
                <span aria-hidden="true">·</span>
                <PostVisibilityBadge visibility={post.visibility} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void controller.handleCopyVideoLink(post.id)}
            aria-label="Sao chép liên kết video"
            title="Sao chép liên kết"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CopyIcon className="w-4 h-4" />
          </button>
        </div>

        {post.content && (
          <div className="space-y-1">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground break-words">
              {visibleCaption}
            </p>
            {isLongCaption && (
              <button
                type="button"
                onClick={() => setIsCaptionExpanded((prev) => !prev)}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                {isCaptionExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>
        )}

        {/* Nếu bài đăng gốc đính kèm thêm ảnh hoặc ghi âm */}
        {images.length > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => controller.handleOpenLightbox(images, 0)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-secondary-strong hover:bg-secondary/40 transition-colors cursor-pointer"
            >
              <AppImage
                src={images[0].url}
                alt={images[0].alt || 'Ảnh đính kèm'}
                className="h-6 w-6 rounded-md object-cover border border-border"
              />
              <span>Xem kèm {images.length} ảnh trong bài viết</span>
            </button>
          </div>
        )}

        {audios.length > 0 && (
          <div className="space-y-1.5">
            {audios.map((audio, idx) => (
              <PostAudioPlayer key={audio.id ?? `${post.id}-audio-${idx}`} item={audio} />
            ))}
          </div>
        )}
      </div>

      {/* Thống kê & Thanh 3 nút tương tác cốt lõi: Thích · Bình luận · Chia sẻ */}
      <div className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-muted">
          <div className="flex items-center gap-1.5 min-h-5">
            {post.reactionCount > 0 ? (
              <button
                type="button"
                onClick={() => controller.handleOpenReactionsModal(post.id)}
                aria-haspopup="dialog"
                title="Xem danh sách người đã bày tỏ cảm xúc"
                className="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1.5 hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                <span className="font-medium text-muted hover:text-foreground hover:underline tabular-nums">
                  {post.reactionCount}
                </span>
              </button>
            ) : (
              <span>Chưa có lượt thích</span>
            )}
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <button
              type="button"
              onClick={() => controller.handleToggleMobileComments(post.id)}
              className="hover:underline hover:text-foreground cursor-pointer lg:pointer-events-none"
            >
              {post.commentCount} bình luận
            </button>
            <span>{post.shareCount} chia sẻ</span>
          </div>
        </div>

        <div className="mx-3 border-t border-border py-1 grid grid-cols-3 gap-1">
          <div
            ref={likeTriggerRef}
            onMouseEnter={handleEnterDockZone}
            onMouseLeave={handleLeaveDockZone}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                void controller.handleReactPost(post.id, post.userReaction ?? 'LIKE')
              }
              aria-pressed={Boolean(activeReaction)}
              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer ${
                activeReaction
                  ? `${activeReaction.activeBgClass} ${activeReaction.activeTextClass} font-semibold`
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              {activeReaction ? (
                <>
                  <ReactionIcon
                    key={activeReaction.type}
                    type={activeReaction.type}
                    className="w-5 h-5 animate-emote-pop"
                  />
                  <span className="truncate">{activeReaction.label}</span>
                </>
              ) : (
                <>
                  <ThumbUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Thích</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => controller.handleFocusCommentInput(post.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
          >
            <CommentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Bình luận</span>
          </button>

          <button
            type="button"
            onClick={() => void controller.handleSharePost(post.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors active:scale-95 cursor-pointer"
          >
            <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Luồng bình luận cuộn độc lập trên Desktop; mở/thu gọn trên Mobile */}
      <div
        className={`${
          isMobileCommentsOpen ? 'flex' : 'hidden lg:flex'
        } flex-1 min-h-0 flex-col bg-background/40`}
      >
        <div
          data-video-scroll-isolated="true"
          className="flex-1 min-h-0 max-h-[300px] lg:max-h-none overflow-y-auto overscroll-contain px-4 py-3 space-y-2.5"
        >
          {post.comments.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted">
                Chưa có bình luận nào. Hãy chia sẻ cảm nghĩ của bạn về video này!
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {post.comments.map((comment) => (
                <li key={comment.id} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => controller.handleOpenUserProfile(comment.author.id)}
                    aria-label={`Xem hồ sơ của ${comment.author.fullName}`}
                    className="mt-0.5 shrink-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <PostAvatarChip
                      name={comment.author.fullName}
                      avatarUrl={comment.author.avatarUrl}
                      sizeClass="h-7 w-7 text-[11px]"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="inline-block max-w-full rounded-2xl border border-border bg-card px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => controller.handleOpenUserProfile(comment.author.id)}
                        className="text-xs font-semibold text-foreground hover:text-primary hover:underline cursor-pointer text-left block"
                      >
                        {comment.author.fullName}
                      </button>
                      {comment.content && (
                        <p className="text-xs sm:text-sm text-foreground break-words mt-0.5">
                          {comment.content}
                        </p>
                      )}
                      {comment.media && (
                        <div className="mt-1.5">
                          {comment.media.type === 'IMAGE' ? (
                            <button
                              type="button"
                              onClick={() => controller.handleOpenLightbox([comment.media!], 0)}
                              className="block overflow-hidden rounded-lg border border-border cursor-pointer"
                            >
                              <AppImage
                                src={comment.media.url}
                                alt={comment.media.alt || 'Ảnh bình luận'}
                                className="max-h-36 w-auto max-w-full rounded-none object-cover"
                              />
                            </button>
                          ) : (
                            <video
                              src={comment.media.url}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-40 w-auto max-w-full rounded-lg border border-border bg-foreground/5"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="px-2 mt-0.5 text-[11px] text-muted">
                      <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
                        {formatRelativeTime(comment.createdAt)}
                      </time>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ô nhập bình luận ghim đáy */}
        <div className="shrink-0 border-t border-border bg-card px-3.5 py-2.5">
          <form
            onSubmit={(e) => void controller.handleSubmitComment(post.id, e)}
            className="flex items-start gap-2"
          >
            <PostAvatarChip
              name={controller.currentUser?.fullName || 'Bạn'}
              avatarUrl={controller.currentUser?.avatarUrl}
              sizeClass="h-8 w-8 text-xs mt-0.5"
            />
            <div className="flex-1 min-w-0 space-y-1.5">
              {commentMedia && (
                <div className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 pr-7">
                  {commentMedia.type === 'IMAGE' ? (
                    <AppImage
                      src={commentMedia.url}
                      alt={commentMedia.alt || 'Ảnh bình luận'}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <video
                      src={commentMedia.url}
                      className="h-12 w-16 rounded-lg object-cover bg-foreground/5"
                      muted
                    />
                  )}
                  <span className="text-[11px] font-medium text-muted max-w-[110px] truncate">
                    {commentMedia.type === 'IMAGE' ? 'Ảnh đính kèm' : 'Video ngắn'}
                  </span>
                  <button
                    type="button"
                    onClick={() => controller.handleRemoveCommentMedia(post.id)}
                    aria-label="Gỡ tệp đính kèm bình luận"
                    className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted hover:bg-error hover:text-on-primary cursor-pointer"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div
                className={`flex items-center gap-1 rounded-full border bg-background pl-3 pr-1.5 py-1 focus-within:bg-card focus-within:ring-2 transition-colors ${
                  commentError
                    ? 'border-error focus-within:border-error focus-within:ring-error/25'
                    : 'border-border focus-within:border-primary focus-within:ring-primary/40'
                }`}
              >
                <input
                  id={`video-comment-input-${post.id}`}
                  type="text"
                  value={commentDraft}
                  onChange={(e) => controller.handleCommentDraftChange(post.id, e.target.value)}
                  placeholder="Viết bình luận..."
                  aria-label="Viết bình luận cho video"
                  aria-invalid={commentError ? 'true' : 'false'}
                  className="flex-1 min-w-0 bg-transparent py-1 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none"
                />

                <label
                  title="Chèn ảnh vào bình luận"
                  aria-label="Chèn ảnh vào bình luận"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-success hover:bg-card transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => controller.handlePickCommentMedia(post.id, 'IMAGE', e)}
                    className="sr-only"
                  />
                </label>

                <label
                  title="Chèn video ngắn vào bình luận"
                  aria-label="Chèn video ngắn vào bình luận"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary hover:bg-card transition-colors cursor-pointer"
                >
                  <VideoIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => controller.handlePickCommentMedia(post.id, 'VIDEO', e)}
                    className="sr-only"
                  />
                </label>

                <button
                  type="submit"
                  disabled={controller.isSubmittingComment}
                  aria-label="Gửi bình luận"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-background disabled:text-muted cursor-pointer transition-colors"
                >
                  <SendIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {commentError && (
                <p role="alert" className="px-2 text-xs text-error">
                  {commentError}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Portal Dock 6 cảm xúc khi hover nút Thích */}
      {isReactionDockOpen &&
        dockPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="toolbar"
            aria-label="Chọn cảm xúc video"
            onMouseEnter={handleEnterDockZone}
            onMouseLeave={handleLeaveDockZone}
            style={{
              left: `${dockPos.left}px`,
              ...(dockPos.top !== undefined ? { top: `${dockPos.top}px` } : {}),
              ...(dockPos.bottom !== undefined ? { bottom: `${dockPos.bottom}px` } : {}),
            }}
            className="fixed z-[60] flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1.5 shadow-md animate-emote-dock-in"
          >
            {REACTION_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                title={option.label}
                aria-label={option.label}
                onClick={() => {
                  setIsReactionDockOpen(false);
                  void controller.handleReactPost(post.id, option.type);
                }}
                className={`group relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:scale-125 hover:-translate-y-2 focus-visible:scale-125 focus-visible:-translate-y-2 hover:bg-background transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  post.userReaction === option.type ? 'bg-secondary scale-110' : ''
                }`}
              >
                <ReactionIcon type={option.type} className="w-9 h-9" />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-card opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  {option.label}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
