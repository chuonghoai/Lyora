import React from 'react';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '@/core';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FilmPlayIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  VolumeOffIcon,
  VolumeOnIcon,
} from '../home/ClientIcons';
import { MediaLightboxModal } from '../home/MediaLightboxModal';
import { PostReactionsModal } from '../home/PostReactionsModal';
import { VideoPostStageCard } from './VideoPostStageCard';
import {
  useVideosController,
  type VideoScopeFilter,
} from './videos.controller';

const SCOPE_OPTIONS: readonly { value: VideoScopeFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'FRIENDS', label: 'Bạn bè' },
  { value: 'MINE', label: 'Của tôi' },
] as const;

const VideoStageSkeleton: React.FC = () => (
  <div className="w-full h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex">
    <div className="h-[320px] sm:h-[420px] lg:h-full flex-1 bg-secondary/40 animate-pulse" />
    <div className="w-full lg:w-[390px] xl:w-[430px] p-4 space-y-4 border-t lg:border-t-0 lg:border-l border-border">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-secondary/60 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-32 rounded-lg bg-secondary/60 animate-pulse" />
          <div className="h-3 w-20 rounded-lg bg-border/70 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded-lg bg-border/70 animate-pulse" />
        <div className="h-3.5 w-4/5 rounded-lg bg-border/70 animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-xl bg-background animate-pulse" />
      <div className="space-y-2.5 pt-2">
        <div className="h-12 w-full rounded-xl bg-background animate-pulse" />
        <div className="h-12 w-5/6 rounded-xl bg-background animate-pulse" />
      </div>
    </div>
  </div>
);

export default function VideosView(): React.ReactElement {
  const controller = useVideosController();

  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-col gap-3 lg:h-full lg:min-h-0">
      {/* Thanh tiêu đề & điều khiển cố định */}
      <header className="shrink-0 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <FilmPlayIcon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Video
              </h1>
              <span className="rounded-full bg-background border border-border px-2 py-0.5 text-xs font-semibold text-muted tabular-nums">
                {controller.posts.length > 0
                  ? `${controller.activePostIndex + 1} / ${controller.totalItems}`
                  : controller.totalItems}
              </span>
            </div>
            <p className="text-xs text-muted truncate hidden sm:block">
              Tất cả bài đăng video từ cộng đồng Lyora
            </p>
          </div>
        </div>

        {/* Bộ lọc phạm vi */}
        <div
          role="tablist"
          aria-label="Lọc danh sách video"
          className="inline-flex items-center rounded-xl bg-background p-1 border border-border"
        >
          {SCOPE_OPTIONS.map((option) => {
            const isSelected = controller.scopeFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => controller.handleSelectScopeFilter(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-card text-primary font-semibold shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Điều khiển phát & đăng video */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={controller.handleToggleAutoPlay}
            aria-pressed={controller.isAutoPlayEnabled}
            title={
              controller.isAutoPlayEnabled
                ? 'Đang bật tự phát khi chuyển video'
                : 'Đang tắt tự phát khi chuyển video'
            }
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              controller.isAutoPlayEnabled
                ? 'border-secondary-strong bg-secondary/60 text-primary-active'
                : 'border-border bg-card text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            {controller.isAutoPlayEnabled ? (
              <PlayIcon className="w-3.5 h-3.5" />
            ) : (
              <PauseIcon className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">Tự phát</span>
          </button>

          <button
            type="button"
            onClick={controller.handleToggleMute}
            aria-pressed={!controller.isMuted}
            aria-label={controller.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            title={controller.isMuted ? 'Bật âm thanh (M)' : 'Tắt âm thanh (M)'}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              !controller.isMuted
                ? 'border-secondary-strong bg-secondary/60 text-primary-active'
                : 'border-border bg-card text-muted hover:bg-background hover:text-foreground'
            }`}
          >
            {controller.isMuted ? (
              <VolumeOffIcon className="w-4 h-4" />
            ) : (
              <VolumeOnIcon className="w-4 h-4" />
            )}
            <span className="hidden md:inline">
              {controller.isMuted ? 'Đang tắt tiếng' : 'Có tiếng'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void controller.handleRefreshVideos()}
            disabled={controller.isFeedRefetching}
            aria-label="Làm mới danh sách video"
            title="Làm mới"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted hover:bg-background hover:text-foreground disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshIcon
              className={`w-4 h-4 ${controller.isFeedRefetching ? 'animate-spin' : ''}`}
            />
          </button>

          <Button
            type="button"
            variant="primary"
            onClick={controller.handleOpenCreateVideoPost}
            className="h-9 px-3 py-1.5 text-xs sm:text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Đăng video</span>
          </Button>
        </div>
      </header>

      {/* Thông báo khi liên kết video được chia sẻ không còn khả dụng */}
      {controller.isDeepLinkUnavailable && (
        <div
          role="status"
          className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs sm:text-sm text-foreground"
        >
          <span>
            Video từ liên kết chia sẻ không tồn tại, không chứa video hoặc bạn không có quyền xem.
          </span>
          <button
            type="button"
            onClick={controller.handleClearDeepLink}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            Đóng thông báo
          </button>
        </div>
      )}

      {/* Khung chiếu duy nhất ôm trọn padding xung quanh — không lộ bài trên/dưới */}
      {controller.isFeedLoading ? (
        <div className="flex-1 min-h-0">
          <VideoStageSkeleton />
        </div>
      ) : controller.isFeedError ? (
        <div className="flex-1 flex items-center justify-center">
          <ErrorState
            title="Không thể tải danh sách video"
            description="Kết nối đến máy chủ gặp sự cố. Vui lòng thử tải lại."
            onRetry={() => void controller.handleRefreshVideos()}
          />
        </div>
      ) : !controller.activePost ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<FilmPlayIcon className="w-7 h-7" />}
            title={
              controller.scopeFilter === 'MINE'
                ? 'Bạn chưa đăng bài viết video nào'
                : controller.scopeFilter === 'FRIENDS'
                  ? 'Chưa có bài đăng video nào từ bạn bè'
                  : 'Chưa có bài đăng video nào'
            }
            description="Mọi bài viết có đính kèm video được đăng lên Lyora sẽ tự động hiển thị tại đây để bạn theo dõi và tương tác."
            action={
              controller.scopeFilter !== 'ALL'
                ? {
                    label: 'Xem tất cả video',
                    onClick: () => controller.handleSelectScopeFilter('ALL'),
                    variant: 'secondary',
                  }
                : {
                    label: 'Đăng bài viết kèm video',
                    onClick: controller.handleOpenCreateVideoPost,
                    variant: 'primary',
                  }
            }
          />
        </div>
      ) : (
        <div
          ref={controller.scrollContainerRef}
          onWheel={controller.handleStageWheel}
          onTouchStart={controller.handleStageTouchStart}
          onTouchEnd={controller.handleStageTouchEnd}
          aria-label="Khung trình chiếu bài đăng video"
          className="flex-1 min-h-0 flex flex-col lg:flex-row lg:items-stretch gap-3 lg:overflow-hidden"
        >
          {/* Vùng sân khấu trượt dọc liên tục (không unmount, không nháy opacity) */}
          <div className="flex-1 min-w-0 min-h-0 lg:overflow-hidden rounded-2xl">
            <div
              className="lyora-video-track lg:h-full w-full"
              style={
                {
                  '--video-track-index': controller.activePostIndex,
                } as React.CSSProperties
              }
            >
              {controller.posts.map((post, index) => {
                const isCurrent = index === controller.activePostIndex;
                const shouldRenderCard = Math.abs(index - controller.activePostIndex) <= 1;
                return (
                  <div
                    key={post.id}
                    aria-hidden={!isCurrent}
                    className={`w-full shrink-0 lg:block lg:h-full ${
                      isCurrent ? 'block' : 'hidden'
                    }`}
                  >
                    {shouldRenderCard ? (
                      <VideoPostStageCard post={post} controller={controller} />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2 nút mũi tên Lên / Xuống chuyển mượt giữa các bài đăng video */}
          <aside
            aria-label="Điều hướng giữa các bài đăng video"
            className="shrink-0 flex lg:flex-col items-center justify-center gap-2.5 py-1 lg:py-0 lg:px-0.5"
          >
            <button
              type="button"
              disabled={!controller.canScrollPrev}
              onClick={() => controller.handleScrollToAdjacentPost('prev')}
              aria-label="Lướt lên video trước"
              title="Video trước (↑ hoặc cuộn lên)"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:border-secondary-strong hover:bg-secondary/50 hover:text-primary active:scale-95 disabled:bg-background disabled:text-muted/40 disabled:border-border disabled:hover:bg-background disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ChevronUpIcon className="w-5 h-5" />
            </button>

            <div className="min-w-[52px] text-center text-xs font-semibold text-muted tabular-nums select-none">
              {controller.isFetchingNextPage ? (
                <LoadingSpinner size="sm" className="mx-auto" />
              ) : (
                <span>
                  {controller.activePostIndex + 1} / {controller.totalItems}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!controller.canScrollNext || controller.isFetchingNextPage}
              onClick={() => controller.handleScrollToAdjacentPost('next')}
              aria-label="Lướt xuống video kế tiếp"
              title="Video kế tiếp (↓ hoặc cuộn xuống)"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:border-secondary-strong hover:bg-secondary/50 hover:text-primary active:scale-95 disabled:bg-background disabled:text-muted/40 disabled:border-border disabled:hover:bg-background disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ChevronDownIcon className="w-5 h-5" />
            </button>
          </aside>
        </div>
      )}

      {/* Tái sử dụng modal cảm xúc & phóng to ảnh đính kèm */}
      <PostReactionsModal controller={controller} />
      <MediaLightboxModal controller={controller} />
    </div>
  );
}
