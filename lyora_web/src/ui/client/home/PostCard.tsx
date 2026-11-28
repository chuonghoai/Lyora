import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AppImage,
  Button,
  formatDateTime,
  formatRelativeTime,
  useClickOutside,
  type MediaViolationInfo,
} from '@/core';
import {
  AvatarViolationButton,
  PostViolationBadge,
  ViolationDetailModal,
  type ViolationModalTarget,
} from '@/ui/shared/ViolationIndicators';
import {
  getReactionMeta,
  getTopReactions,
  REACTION_OPTIONS,
  type Post,
  type PostMediaItem,
  type PostVisibility,
} from '@/features/posts';
import type { PostFeedController } from './post-feed.controller';
import {
  BookmarkIcon,
  CloseIcon,
  CommentIcon,
  EditIcon,
  GlobeIcon,
  ImageIcon,
  LockIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  ReactionIcon,
  SendIcon,
  ShareIcon,
  ThumbUpIcon,
  UsersIcon,
  VideoIcon,
} from './ClientIcons';

export const PostVisibilityBadge: React.FC<{ visibility: PostVisibility }> = ({ visibility }) => {
  if (visibility === 'PUBLIC') {
    return (
      <span className="inline-flex items-center gap-1">
        <GlobeIcon className="w-3.5 h-3.5" />
        <span>Công khai</span>
      </span>
    );
  }
  if (visibility === 'FRIENDS') {
    return (
      <span className="inline-flex items-center gap-1 text-info">
        <UsersIcon className="w-3.5 h-3.5" />
        <span>Bạn bè</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <LockIcon className="w-3.5 h-3.5 text-warning" />
      <span>Riêng tư</span>
    </span>
  );
};

export interface PostCardProps {
  post: Post;
  controller: PostFeedController;
  onOpenAppealModal?: (post: Post) => void;
}

const CONTENT_COLLAPSE_THRESHOLD = 280;

export const PostAvatarChip: React.FC<{
  name: string;
  avatarUrl?: string | null;
  sizeClass?: string;
  avatarViolation?: MediaViolationInfo | null;
}> = ({ name, avatarUrl, sizeClass = 'h-10 w-10 text-sm', avatarViolation }) => {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'L';

  const borderClass = avatarViolation
    ? 'border border-error ring-2 ring-error ring-offset-1 ring-offset-card'
    : 'border border-border';

  if (avatarUrl) {
    return (
      <AppImage
        src={avatarUrl}
        alt={name}
        rounded
        className={`${sizeClass} shrink-0 ${borderClass}`}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary-active ${borderClass} ${sizeClass}`}
    >
      {initials}
    </span>
  );
};

const AUDIO_WAVEFORM_BARS = 36;

function formatAudioTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getWaveformBarHeight(index: number): number {
  return 22 + Math.round(Math.abs(Math.sin(index * 1.7) + Math.cos(index * 0.8)) * 34);
}

export const PostAudioPlayer: React.FC<{
  item: PostMediaItem;
  className?: string;
}> = ({ item, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(item.duration ?? 0);

  const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || totalDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * totalDuration;
    setCurrentTime(audio.currentTime);
  };

  const handleSeekByKeyboard = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(totalDuration, audio.currentTime + 5);
    if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 ${className}`}
    >
      <audio
        ref={audioRef}
        src={item.url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const loaded = e.currentTarget.duration;
          if (Number.isFinite(loaded) && loaded > 0) setTotalDuration(loaded);
        }}
      />

      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? 'Tạm dừng bản ghi âm' : 'Phát bản ghi âm'}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4 translate-x-0.5" />
        )}
      </button>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Tiến trình bản ghi âm"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalDuration)}
        aria-valuenow={Math.round(currentTime)}
        onClick={handleSeek}
        onKeyDown={handleSeekByKeyboard}
        className="flex h-10 flex-1 cursor-pointer items-center gap-[3px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {Array.from({ length: AUDIO_WAVEFORM_BARS }, (_, idx) => (
          <span
            key={idx}
            style={{ height: `${getWaveformBarHeight(idx)}%` }}
            className={`w-[3px] flex-1 rounded-full transition-colors ${
              (idx + 1) / AUDIO_WAVEFORM_BARS <= progress ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>

      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
        {formatAudioTime(isPlaying || currentTime > 0 ? currentTime : totalDuration)}
      </span>
    </div>
  );
};

const PostMediaTile: React.FC<{
  item: PostMediaItem;
  index: number;
  allMedia: PostMediaItem[];
  extraCount?: number;
  className?: string;
  onOpenLightbox: (items: PostMediaItem[], index: number) => void;
}> = ({ item, index, allMedia, extraCount = 0, className = '', onOpenLightbox }) => {
  if (item.type === 'VIDEO') {
    return (
      <div className={`relative overflow-hidden bg-foreground/5 rounded-xl ${className}`}>
        <video
          src={item.url}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full max-h-[460px] object-cover"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenLightbox(allMedia, index)}
      className={`group relative block w-full h-full overflow-hidden bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer ${className}`}
    >
      <AppImage
        src={item.url}
        alt={item.alt || `Ảnh bài viết ${index + 1}`}
        className="h-full w-full object-cover rounded-none group-hover:scale-[1.02] transition-transform duration-200"
      />
      {extraCount > 0 && (
        <div className="absolute inset-0 bg-foreground/55 flex items-center justify-center">
          <span className="text-2xl font-bold text-card tabular-nums">+{extraCount}</span>
        </div>
      )}
    </button>
  );
};

export const PostMediaGallery: React.FC<{
  media: PostMediaItem[];
  onOpenLightbox: (items: PostMediaItem[], index: number) => void;
}> = ({ media, onOpenLightbox }) => {
  if (!media || media.length === 0) return null;

  const visualMedia = media.filter((item) => item.type !== 'AUDIO');
  const audioItems = media.filter((item) => item.type === 'AUDIO');

  return (
    <div className="space-y-2">
      <PostVisualGallery media={visualMedia} onOpenLightbox={onOpenLightbox} />
      {audioItems.map((item, idx) => (
        <PostAudioPlayer key={item.id ?? `${item.url}-${idx}`} item={item} />
      ))}
    </div>
  );
};

const PostVisualGallery: React.FC<{
  media: PostMediaItem[];
  onOpenLightbox: (items: PostMediaItem[], index: number) => void;
}> = ({ media, onOpenLightbox }) => {
  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <div className="overflow-hidden rounded-xl border border-border max-h-[480px]">
        <PostMediaTile
          item={media[0]}
          index={0}
          allMedia={media}
          className="max-h-[480px]"
          onOpenLightbox={onOpenLightbox}
        />
      </div>
    );
  }

  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl border border-border">
        {media.map((item, idx) => (
          <PostMediaTile
            key={item.id ?? `${item.url}-${idx}`}
            item={item}
            index={idx}
            allMedia={media}
            className="aspect-[4/4]"
            onOpenLightbox={onOpenLightbox}
          />
        ))}
      </div>
    );
  }

  if (media.length === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-xl border border-border h-[340px] sm:h-[380px]">
        <PostMediaTile
          item={media[0]}
          index={0}
          allMedia={media}
          className="row-span-2 h-full"
          onOpenLightbox={onOpenLightbox}
        />
        <PostMediaTile
          item={media[1]}
          index={1}
          allMedia={media}
          className="h-full"
          onOpenLightbox={onOpenLightbox}
        />
        <PostMediaTile
          item={media[2]}
          index={2}
          allMedia={media}
          className="h-full"
          onOpenLightbox={onOpenLightbox}
        />
      </div>
    );
  }

  const displayFour = media.slice(0, 4);
  const remaining = media.length - 4;

  return (
    <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl border border-border">
      {displayFour.map((item, idx) => (
        <PostMediaTile
          key={item.id ?? `${item.url}-${idx}`}
          item={item}
          index={idx}
          allMedia={media}
          extraCount={idx === 3 ? remaining : 0}
          className="aspect-[4/3]"
          onOpenLightbox={onOpenLightbox}
        />
      ))}
    </div>
  );
};

export const PostInteractionsBlock: React.FC<{
  post: Post;
  controller: PostFeedController;
  onCommentClick: () => void;
  onStatsCommentsClick: () => void;
}> = ({ post, controller, onCommentClick, onStatsCommentsClick }) => {
  const [isReactionDockOpen, setIsReactionDockOpen] = useState(false);
  const [dockPos, setDockPos] = useState<{ left: number; bottom?: number; top?: number } | null>(
    null,
  );

  const likeTriggerRef = useRef<HTMLDivElement>(null);
  const dockPortalRef = useRef<HTMLDivElement>(null);

  const dockOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dockCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeReaction = post.userReaction ? getReactionMeta(post.userReaction) : null;
  const topReactions = getTopReactions(post.reactionBreakdown, 3);
  const isReactionsModalOpenForThisPost = controller.reactionsPopover?.postId === post.id;

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
    if (dockOpenTimerRef.current) {
      clearTimeout(dockOpenTimerRef.current);
    }
    dockOpenTimerRef.current = setTimeout(() => {
      setIsReactionDockOpen(true);
    }, 90);
  };

  const handleLeaveDockZone = () => {
    if (dockOpenTimerRef.current) {
      clearTimeout(dockOpenTimerRef.current);
      dockOpenTimerRef.current = null;
    }
    if (dockCloseTimerRef.current) {
      clearTimeout(dockCloseTimerRef.current);
    }
    dockCloseTimerRef.current = setTimeout(() => {
      setIsReactionDockOpen(false);
    }, 180);
  };

  return (
    <>
      {/* Thống kê tương tác (Bấm vào số lượt thích để mở Modal chi tiết giống Facebook) */}
      <div className="px-4 py-2.5 sm:px-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-1.5 min-h-5">
          {post.reactionCount > 0 ? (
            <button
              type="button"
              onClick={() => controller.handleOpenReactionsModal(post.id)}
              aria-expanded={isReactionsModalOpenForThisPost}
              aria-haspopup="dialog"
              title="Xem danh sách người đã bày tỏ cảm xúc"
              className="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1.5 hover:bg-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="inline-flex items-center -space-x-1">
                {topReactions.map((item) => (
                  <span
                    key={item.type}
                    className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-card ring-2 ring-card"
                  >
                    <ReactionIcon type={item.type} className="w-4.5 h-4.5" />
                  </span>
                ))}
              </span>
              <span className="font-medium text-muted hover:text-foreground hover:underline tabular-nums">
                {post.reactionCount}
              </span>
            </button>
          ) : (
            <span>Hãy là người đầu tiên bày tỏ cảm xúc</span>
          )}
        </div>

        <div className="flex items-center gap-3 tabular-nums">
          <button
            type="button"
            onClick={onStatsCommentsClick}
            className="hover:underline hover:text-foreground cursor-pointer"
          >
            {post.commentCount} bình luận
          </button>
          <span>{post.shareCount} chia sẻ</span>
          <span className={post.isBookmarked ? 'text-primary font-medium' : ''}>
            {post.bookmarkCount} lượt lưu
          </span>
        </div>
      </div>

      {/* Thanh hành động 4 nút */}
      <div className="mx-4 sm:mx-5 border-t border-border py-1.5 grid grid-cols-4 gap-1">
        <div
          ref={likeTriggerRef}
          onMouseEnter={handleEnterDockZone}
          onMouseLeave={handleLeaveDockZone}
          className="relative"
        >
          <button
            type="button"
            onClick={() => void controller.handleReactPost(post.id, post.userReaction ?? 'LIKE')}
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
          onClick={onCommentClick}
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

        <button
          type="button"
          onClick={() => void controller.handleToggleBookmark(post.id)}
          aria-pressed={post.isBookmarked}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium transition-all active:scale-95 cursor-pointer ${
            post.isBookmarked
              ? 'bg-secondary/70 text-primary font-semibold'
              : 'text-muted hover:bg-background hover:text-foreground'
          }`}
        >
          <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" filled={post.isBookmarked} />
          <span>{post.isBookmarked ? 'Đã lưu' : 'Lưu'}</span>
        </button>
      </div>

      {/* Portal Dock 6 Emotes nổi khi Hover vào nút Thích */}
      {isReactionDockOpen &&
        dockPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dockPortalRef}
            role="toolbar"
            aria-label="Chọn cảm xúc bài viết"
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
    </>
  );
};

export const PostCommentForm: React.FC<{
  postId: string;
  inputSuffix: 'feed' | 'modal';
  placeholder?: string;
  controller: PostFeedController;
}> = ({
  postId,
  inputSuffix,
  placeholder = 'Viết bình luận công khai...',
  controller,
}) => {
  const commentDraft = controller.commentDrafts[postId] ?? '';
  const commentMedia = controller.commentMediaDrafts[postId] ?? null;
  const commentError = controller.commentErrors[postId];

  return (
    <form
      onSubmit={(e) => void controller.handleSubmitComment(postId, e)}
      className="flex items-start gap-2.5"
    >
      <PostAvatarChip
        name={controller.currentUser?.fullName || 'Bạn'}
        avatarUrl={controller.currentUser?.avatarUrl}
        sizeClass="h-8 w-8 text-xs mt-0.5"
      />
      <div className="flex-1 min-w-0 space-y-2">
        {commentMedia && (
          <div className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-7 shadow-sm">
            {commentMedia.type === 'IMAGE' ? (
              <AppImage
                src={commentMedia.url}
                alt={commentMedia.alt || 'Ảnh bình luận'}
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <video
                src={commentMedia.url}
                className="h-14 w-20 rounded-lg object-cover bg-foreground/5"
                muted
              />
            )}
            <span className="text-[11px] font-medium text-muted max-w-[140px] truncate">
              {commentMedia.type === 'IMAGE' ? 'Ảnh đính kèm' : 'Video ngắn'}
            </span>
            <button
              type="button"
              onClick={() => controller.handleRemoveCommentMedia(postId)}
              aria-label="Gỡ tệp đính kèm bình luận"
              className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted hover:bg-error hover:text-on-primary cursor-pointer"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          </div>
        )}

        <div
          className={`flex items-center gap-1 rounded-full border bg-card pl-3.5 pr-1.5 py-1 focus-within:ring-2 transition-colors ${
            commentError
              ? 'border-error focus-within:border-error focus-within:ring-error/25'
              : 'border-border focus-within:border-primary focus-within:ring-primary/40'
          }`}
        >
          <input
            id={`comment-input-${inputSuffix}-${postId}`}
            type="text"
            value={commentDraft}
            onChange={(e) => controller.handleCommentDraftChange(postId, e.target.value)}
            placeholder={placeholder}
            aria-label="Viết bình luận"
            aria-invalid={commentError ? 'true' : 'false'}
            className="flex-1 min-w-0 bg-transparent py-1 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none"
          />

          {/* 2 nút chèn Ảnh & Video ngắn */}
          <label
            title="Chèn ảnh vào bình luận"
            aria-label="Chèn ảnh vào bình luận"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-success hover:bg-background transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => controller.handlePickCommentMedia(postId, 'IMAGE', e)}
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
              onChange={(e) => controller.handlePickCommentMedia(postId, 'VIDEO', e)}
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

        {commentError && (
          <p role="alert" className="px-2 text-xs text-error">
            {commentError}
          </p>
        )}
      </div>
    </form>
  );
};

export const PostCommentsList: React.FC<{
  comments: Post['comments'];
  controller: PostFeedController;
  onInspectViolation?: (target: ViolationModalTarget) => void;
}> = ({ comments, controller, onInspectViolation }) => {
  if (comments.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {comments.map((comment) => (
        <li key={comment.id} className="flex items-start gap-2.5">
          <div className="relative mt-0.5 shrink-0">
            <button
              type="button"
              onClick={() => controller.handleOpenUserProfile(comment.author.id)}
              aria-label={`Xem hồ sơ của ${comment.author.fullName}`}
              className="block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <PostAvatarChip
                name={comment.author.fullName}
                avatarUrl={comment.author.avatarUrl}
                avatarViolation={comment.author.avatarViolation}
                sizeClass="h-8 w-8 text-xs"
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
            <div className="inline-block max-w-full rounded-2xl bg-card border border-border px-3.5 py-2">
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
                <div className="mt-2">
                  {comment.media.type === 'IMAGE' ? (
                    <button
                      type="button"
                      onClick={() => controller.handleOpenLightbox([comment.media!], 0)}
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
            <div className="px-2 mt-1 text-[11px] text-muted">
              <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
                {formatRelativeTime(comment.createdAt)}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  controller,
  onOpenAppealModal,
}) => {
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [violationModalTarget, setViolationModalTarget] =
    useState<ViolationModalTarget | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  if (controller.temporarilyHiddenIds[post.id]) {
    return (
      <article
        aria-label={`Đã ẩn bài viết của ${post.author.fullName}`}
        className="rounded-2xl border border-border bg-card px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted">
            <CloseIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Đã ẩn bài viết của {post.author.fullName}
            </p>
            <p className="text-xs text-muted">
              Bạn sẽ nhìn thấy ít bài viết tương tự hơn trên bảng tin.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void controller.handleUndoHidePost(post.id)}
          className="h-8 px-3 py-1 text-xs shrink-0"
        >
          Hoàn tác
        </Button>
      </article>
    );
  }

  const isOwnPost =
    controller.currentUser?.id === post.author.id ||
    controller.currentUser?.email === post.author.email;

  const isLongText = post.content.length > CONTENT_COLLAPSE_THRESHOLD;
  const visibleContent =
    isLongText && !isContentExpanded
      ? `${post.content.slice(0, CONTENT_COLLAPSE_THRESHOLD).trimEnd()}...`
      : post.content;

  const isCommentsExpanded = Boolean(controller.expandedCommentsMap[post.id]);
  const visibleComments = isCommentsExpanded ? post.comments : post.comments.slice(-2);
  const hiddenCommentsCount = Math.max(0, post.comments.length - visibleComments.length);

  return (
    <article className="rounded-2xl border border-border bg-card shadow-sm overflow-visible">
      {/* Header Tác giả */}
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
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
                onClick={() => controller.handleOpenPostDetailPage(post.id)}
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

        {/* Nhóm nút ... và X (Ẩn bài viết) */}
        <div className="flex items-center gap-1 shrink-0">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-label="Tùy chọn bài viết"
              title="Tùy chọn bài viết"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            >
              <MoreHorizontalIcon className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-52 rounded-xl border border-border bg-card p-1.5 shadow-md z-20"
              >
                {isOwnPost && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      controller.handleOpenEditPost(post);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer"
                  >
                    <EditIcon className="w-4 h-4 text-primary" />
                    <span>Chỉnh sửa bài viết</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    controller.handleOpenPostDetail(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer"
                >
                  <CommentIcon className="w-4 h-4 text-primary" />
                  <span>Xem chi tiết bài viết</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    controller.handleOpenPostDetailPage(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer"
                >
                  <ShareIcon className="w-4 h-4 text-muted" />
                  <span>Mở trang riêng bài viết</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void controller.handleToggleBookmark(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer"
                >
                  <BookmarkIcon className="w-4 h-4 text-primary" filled={post.isBookmarked} />
                  <span>{post.isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void controller.handleCopyPostLink(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer"
                >
                  <ShareIcon className="w-4 h-4 text-muted" />
                  <span>Sao chép liên kết</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void controller.handleHidePost(post.id);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4 text-muted" />
                  <span>Ẩn bài viết này</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void controller.handleHidePost(post.id)}
            aria-label="Ẩn bài viết"
            title="Ẩn bài viết"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Thông báo bài viết bị ẩn & Khiếu nại (chỉ hiển thị cho chính tác giả) */}
      {isOwnPost && post.moderationStatus === 'HIDDEN' && (() => {
        const appealsList =
          post.appeals && post.appeals.length > 0
            ? post.appeals
            : post.appeal
              ? [post.appeal]
              : [];
        const latestAppeal = appealsList[0] ?? null;
        const canSubmitAppeal =
          Boolean(onOpenAppealModal) &&
          (!latestAppeal || latestAppeal.status !== 'PENDING');
        const compactAppeals = appealsList.slice(0, 2);

        return (
          <div
            role="region"
            aria-label="Thông báo kiểm duyệt bài viết bị ẩn"
            className="mx-4 mt-3 sm:mx-5 rounded-xl border border-warning/40 bg-warning/10 p-3.5 space-y-2.5 text-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-card px-2 py-0.5 text-[11px] font-semibold text-warning">
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
                  {post.moderationReason?.trim() || 'Vi phạm tiêu chuẩn cộng đồng'}
                </p>
              </div>

              {canSubmitAppeal && onOpenAppealModal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenAppealModal(post)}
                  className="h-8 px-3 py-1 text-xs border-warning/50 bg-card text-warning hover:bg-warning/10 shrink-0"
                >
                  Khiếu nại
                </Button>
              )}
            </div>

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
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              appeal.status === 'PENDING'
                                ? 'border-secondary-strong bg-secondary text-primary-active'
                                : appeal.status === 'RESTORED'
                                  ? 'border-success/30 bg-success/10 text-success'
                                  : 'border-error/30 bg-error/10 text-error'
                            }`}
                          >
                            {appeal.status === 'PENDING'
                              ? 'Đang chờ Quản trị viên xem xét khiếu nại'
                              : appeal.status === 'RESTORED'
                                ? 'Khiếu nại được chấp nhận'
                                : 'Đã gửi minh chứng phản hồi'}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted tabular-nums">
                          {formatDateTime(appeal.createdAt)}
                        </span>
                      </div>

                      <p className="text-foreground line-clamp-1 break-words">
                        <strong>Khiếu nại:</strong> {appeal.reasonCategory} —{' '}
                        {appeal.reasonDetail}
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
                    </div>
                  );
                })}
              </div>
            )}

            {appealsList.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    controller.handleOpenPostDetailPage(post.id, {
                      expandAppeals: true,
                    });
                  }}
                  className="text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                >
                  {appealsList.length > 1
                    ? `Xem lịch sử khiếu nại (${appealsList.length})`
                    : 'Xem lịch sử khiếu nại'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Nội dung chữ (nhấn vào bài viết để mở Modal chi tiết nổi bật) */}
      {post.content && (
        <div className="px-4 py-3 sm:px-5">
          <div
            onClick={() => controller.handleOpenPostDetail(post.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                controller.handleOpenPostDetail(post.id);
              }
            }}
            title="Nhấn để xem chi tiết bài viết và bình luận"
            className="cursor-pointer rounded-xl -mx-1 px-1 py-0.5 hover:bg-background/50 transition-colors"
          >
            <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-foreground">
              {visibleContent}
            </p>
          </div>

          {isLongText && (
            <button
              type="button"
              onClick={() => setIsContentExpanded((prev) => !prev)}
              className="mt-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
            >
              {isContentExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* Media Files (Ảnh / Video) */}
      {post.media && post.media.length > 0 && (
        <div className={`${post.content ? 'pb-1' : 'pt-3 pb-1'} px-4 sm:px-5`}>
          <PostMediaGallery
            media={post.media}
            onOpenLightbox={controller.handleOpenLightbox}
          />
        </div>
      )}

      {/* Thanh thống kê + 4 nút hành động */}
      <PostInteractionsBlock
        post={post}
        controller={controller}
        onCommentClick={() => controller.handleOpenPostDetail(post.id)}
        onStatsCommentsClick={() => controller.handleOpenPostDetail(post.id)}
      />

      {/* Khu vực Bình luận thu gọn bên dưới bài đăng */}
      <section
        aria-label="Bình luận bài viết"
        className="border-t border-border bg-background/40 px-4 py-3 sm:px-5 space-y-3"
      >
        {hiddenCommentsCount > 0 && (
          <button
            type="button"
            onClick={() => controller.handleOpenPostDetail(post.id)}
            className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
          >
            Xem tất cả {post.commentCount} bình luận
          </button>
        )}

        <PostCommentsList
          comments={visibleComments}
          controller={controller}
          onInspectViolation={setViolationModalTarget}
        />

        <PostCommentForm
          postId={post.id}
          inputSuffix="feed"
          controller={controller}
        />
      </section>

      <ViolationDetailModal
        target={violationModalTarget}
        onClose={() => setViolationModalTarget(null)}
      />
    </article>
  );
};
