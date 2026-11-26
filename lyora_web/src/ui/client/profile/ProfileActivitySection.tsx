import React from 'react';
import { AppImage, formatDateTime, formatRelativeTime } from '@/core';
import {
  ArrowLeftIcon,
  AtSignIcon,
  BookmarkIcon,
  CommentIcon,
  GlobeIcon,
  HeartIcon,
  ShareIcon,
  ThumbUpIcon,
  UsersIcon,
} from '../home/ClientIcons';
import type { ProfileController } from './profile.controller';

export interface ProfileActivitySectionProps {
  controller: ProfileController;
}

export const ProfileActivitySection: React.FC<ProfileActivitySectionProps> = ({
  controller,
}) => {
  const profile = controller.profile;
  if (!profile) return null;

  return (
    <section
      aria-label="Dấu ấn tương tác và lưu trữ"
      className="mx-auto w-full max-w-4xl space-y-4"
    >
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              {controller.isOwnProfile
                ? 'Dấu ấn tương tác & Lưu trữ'
                : `Bài viết gắn thẻ ${profile.fullName}`}
            </h2>
            <p className="text-xs text-muted">
              {controller.isOwnProfile
                ? 'Tập hợp 3 mục: bài viết được chia sẻ/gắn thẻ, bài viết bạn yêu thích và bài viết bạn đã lưu bookmark.'
                : 'Những bài viết công khai mà thành viên này được gắn thẻ.'}
            </p>
          </div>

          <button
            type="button"
            onClick={controller.handleNavigateToMyPosts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Về bài viết hồ sơ</span>
          </button>
        </div>

        {/* 1 thanh tab gôm 3 nút (Hồ sơ cá nhân) hoặc 1 mục Được gắn thẻ (Hồ sơ người khác) */}
        {controller.isOwnProfile ? (
          <div
            role="tablist"
            aria-label="Lọc dấu ấn tương tác trên hồ sơ"
            className="grid grid-cols-1 sm:grid-cols-3 gap-1 rounded-xl border border-border bg-background p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={controller.activityTab === 'tagged'}
              onClick={() => controller.handleSelectActivityTab('tagged')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                controller.activityTab === 'tagged'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <AtSignIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Được chia sẻ &amp; Gắn thẻ</span>
              <span className="text-[11px] font-medium text-muted tabular-nums">
                ({controller.activityCounts.tagged})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={controller.activityTab === 'reacted'}
              onClick={() => controller.handleSelectActivityTab('reacted')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                controller.activityTab === 'reacted'
                  ? 'bg-card text-accent shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <HeartIcon
                className="w-4 h-4 shrink-0"
                filled={controller.activityTab === 'reacted'}
              />
              <span className="truncate">Yêu thích</span>
              <span className="text-[11px] font-medium text-muted tabular-nums">
                ({controller.activityCounts.reacted})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={controller.activityTab === 'saved'}
              onClick={() => controller.handleSelectActivityTab('saved')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                controller.activityTab === 'saved'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <BookmarkIcon
                className="w-4 h-4 shrink-0"
                filled={controller.activityTab === 'saved'}
              />
              <span className="truncate">Đã lưu bookmark</span>
              <span className="text-[11px] font-medium text-muted tabular-nums">
                ({controller.activityCounts.saved})
              </span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm font-semibold text-primary">
            <AtSignIcon className="w-4 h-4 shrink-0" />
            <span>Được gắn thẻ</span>
            <span className="text-[11px] font-medium text-muted tabular-nums">
              ({controller.activityCounts.tagged})
            </span>
          </div>
        )}
      </div>

      {/* Danh sách bài viết trong nhóm đang chọn */}
      {controller.isLoadingActivity ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl border border-border bg-card animate-pulse" />
          <div className="h-44 rounded-2xl border border-border bg-card animate-pulse" />
        </div>
      ) : controller.activityItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Chưa có bài viết nào trong mục này
          </p>
          <p className="text-xs text-muted">
            {controller.activityTab === 'tagged'
              ? 'Các bài viết bạn được gắn thẻ hoặc chia sẻ tới bạn sẽ xuất hiện tại đây.'
              : controller.activityTab === 'reacted'
                ? 'Những bài viết bạn bày tỏ cảm xúc yêu thích trên bảng tin sẽ hiển thị ở đây.'
                : 'Các bài viết bạn lưu bookmark sẽ tập hợp tại đây để xem lại nhanh.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {controller.activityItems.map((item) => {
            const authorInitial = item.author.fullName.charAt(0).toUpperCase();
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.kind === 'REACTED'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-secondary text-primary-active'
                    }`}
                  >
                    {item.kind === 'REACTED' ? (
                      <HeartIcon className="w-3 h-3" filled />
                    ) : item.kind === 'SAVED' ? (
                      <BookmarkIcon className="w-3 h-3" filled />
                    ) : item.kind === 'SHARED_TO_ME' ? (
                      <ShareIcon className="w-3 h-3" />
                    ) : (
                      <AtSignIcon className="w-3 h-3" />
                    )}
                    <span>{item.contextLabel}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                    {item.visibility === 'FRIENDS' ? (
                      <>
                        <UsersIcon className="w-3.5 h-3.5 text-info" />
                        <span>Bạn bè</span>
                      </>
                    ) : (
                      <>
                        <GlobeIcon className="w-3.5 h-3.5" />
                        <span>Công khai</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Tác giả (nhấn avatar hoặc tên để vào trang hồ sơ /{userId}) */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => controller.handleOpenUserProfile(item.author.id)}
                    aria-label={`Xem hồ sơ của ${item.author.fullName}`}
                    className="shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {item.author.avatarUrl ? (
                      <AppImage
                        src={item.author.avatarUrl}
                        alt={item.author.fullName}
                        rounded
                        className="h-10 w-10 border border-border"
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-bold text-primary-active border border-border">
                        {authorInitial}
                      </span>
                    )}
                  </button>

                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => controller.handleOpenUserProfile(item.author.id)}
                      className="text-sm font-semibold text-foreground hover:text-primary hover:underline truncate cursor-pointer block text-left"
                    >
                      {item.author.fullName}
                    </button>
                    <time
                      dateTime={item.createdAt}
                      title={formatDateTime(item.createdAt)}
                      className="text-xs text-muted block"
                    >
                      {formatRelativeTime(item.createdAt)}
                    </time>
                  </div>
                </div>

                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {item.content}
                </p>

                {item.mediaPreviewUrl && (
                  <div className="overflow-hidden rounded-xl border border-border bg-background">
                    <AppImage
                      src={item.mediaPreviewUrl}
                      alt={item.mediaPreviewAlt || 'Hình ảnh bài viết'}
                      className="w-full max-h-64 rounded-none object-cover"
                    />
                  </div>
                )}

                <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted tabular-nums">
                  <span className="inline-flex items-center gap-1.5">
                    <ThumbUpIcon className="w-3.5 h-3.5 text-primary" />
                    <span>{item.reactionCount} cảm xúc</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <CommentIcon className="w-3.5 h-3.5" />
                      <span>{item.commentCount} bình luận</span>
                    </span>
                    <span>{item.shareCount} chia sẻ</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
