import React, { useEffect, useRef } from 'react';
import type { PostMediaItem } from '@/features/posts';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  VolumeOffIcon,
  VolumeOnIcon,
} from '../home/ClientIcons';
import { formatVideoDuration } from './videos.controller';

export interface VideoStagePlayerProps {
  postId: string;
  videos: PostMediaItem[];
  activeClipIndex: number;
  isActivePost: boolean;
  isAutoPlayEnabled: boolean;
  isMuted: boolean;
  onActivatePost: () => void;
  onPrevClip: () => void;
  onNextClip: () => void;
  onSelectClip: (index: number) => void;
  onToggleMute: () => void;
}

export const VideoStagePlayer: React.FC<VideoStagePlayerProps> = ({
  postId,
  videos,
  activeClipIndex,
  isActivePost,
  isAutoPlayEnabled,
  isMuted,
  onActivatePost,
  onPrevClip,
  onNextClip,
  onSelectClip,
  onToggleMute,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const safeIndex = Math.max(0, Math.min(activeClipIndex, Math.max(0, videos.length - 1)));
  const currentVideo = videos[safeIndex];
  const hasMultipleVideos = videos.length > 1;
  const durationLabel = formatVideoDuration(currentVideo?.duration);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = isMuted;
  }, [isMuted, currentVideo?.url]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActivePost && isAutoPlayEnabled) {
      videoEl.muted = isMuted;
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (!videoEl.muted) {
            videoEl.muted = true;
            void videoEl.play().catch(() => undefined);
          }
        });
      }
    } else if (!isActivePost && !videoEl.paused) {
      videoEl.pause();
    }
  }, [isActivePost, isAutoPlayEnabled, isMuted, currentVideo?.url]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!currentVideo) {
    return null;
  }

  return (
    <div
      onMouseDown={onActivatePost}
      className="relative flex min-h-[280px] sm:min-h-[400px] lg:h-full w-full items-center justify-center bg-foreground overflow-hidden select-none"
    >
      <video
        key={`${postId}-${currentVideo.id ?? safeIndex}-${currentVideo.url}`}
        ref={videoRef}
        src={currentVideo.url}
        controls
        playsInline
        preload="metadata"
        muted={isMuted}
        onPlay={onActivatePost}
        onEnded={() => {
          if (hasMultipleVideos && safeIndex < videos.length - 1) {
            onNextClip();
          }
        }}
        className="w-full h-full max-h-[68dvh] lg:max-h-full object-contain"
      />

      {/* Nút tắt/bật tiếng nhanh đồng bộ toàn dòng cuộn */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? 'Bật âm thanh video' : 'Tắt âm thanh video'}
        title={isMuted ? 'Bật tiếng (M)' : 'Tắt tiếng (M)'}
        className="absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-sm hover:bg-card transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {isMuted ? (
          <VolumeOffIcon className="w-4 h-4" />
        ) : (
          <VolumeOnIcon className="w-4 h-4 text-primary" />
        )}
      </button>

      {/* Bộ đếm clip & thời lượng đặt gọn góc trên phải khi có nhiều video hoặc có duration */}
      {(hasMultipleVideos || durationLabel) && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm tabular-nums">
          {hasMultipleVideos && (
            <span>
              Video {safeIndex + 1} / {videos.length}
            </span>
          )}
          {hasMultipleVideos && durationLabel && <span aria-hidden="true">·</span>}
          {durationLabel && <span className="text-muted">{durationLabel}</span>}
        </div>
      )}

      {/* Nút mũi tên Trái / Phải nhảy qua lại giữa các video trong cùng 1 bài đăng */}
      {hasMultipleVideos && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevClip();
            }}
            aria-label="Video trước trong bài đăng"
            title="Video trước (←)"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md hover:bg-card hover:text-primary active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNextClip();
            }}
            aria-label="Video tiếp theo trong bài đăng"
            title="Video tiếp theo (→)"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md hover:bg-card hover:text-primary active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          {/* Thanh chọn nhanh từng clip đặt sát mép trên (không vướng controls của thẻ video ở đáy) */}
          <div
            role="tablist"
            aria-label="Danh sách video trong bài đăng"
            className="absolute left-1/2 top-3 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-2.5 py-1.5 shadow-sm"
          >
            {videos.map((clip, index) => {
              const isSelected = index === safeIndex;
              return (
                <button
                  key={clip.id ?? `${postId}-clip-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Chuyển đến video ${index + 1} / ${videos.length}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(index);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isSelected
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-muted/45 hover:bg-foreground/60'
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
