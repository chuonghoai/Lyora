import React from 'react';
import { AppImage, Button } from '@/core';
import type { HomeController } from './home.controller';
import {
  CloseIcon,
  GlobeIcon,
  ImageIcon,
  LockIcon,
  UploadCloudIcon,
  UsersIcon,
  VideoIcon,
} from './ClientIcons';

export interface PostComposerProps {
  controller: HomeController;
}

export const PostComposer: React.FC<PostComposerProps> = ({ controller }) => {
  const displayName = controller.profileUser?.fullName?.trim() || 'Bạn';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <section
      aria-label="Tạo bài viết mới"
      onDragEnter={controller.handleDragEnterComposer}
      onDragOver={controller.handleDragOverComposer}
      onDragLeave={controller.handleDragLeaveComposer}
      onDrop={controller.handleDropComposerMedia}
      className={`rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-3 transition-colors ${
        controller.isDraggingComposerMedia
          ? 'border-primary ring-2 ring-primary/30 bg-secondary/15'
          : 'border-border'
      }`}
    >
      {/* Top Row: Avatar + Prompt Trigger */}
      <div className="flex items-center gap-3">
        {controller.profileUser?.avatarUrl ? (
          <AppImage
            src={controller.profileUser.avatarUrl}
            alt={displayName}
            rounded
            className="h-10 w-10 shrink-0 border border-border"
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary-active border border-border">
            {initials}
          </span>
        )}

        {!controller.isComposerExpanded ? (
          <button
            id="lyora-post-composer-trigger"
            type="button"
            onClick={controller.handleExpandComposer}
            className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-left text-sm text-muted hover:bg-secondary/40 hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {displayName} ơi, bạn đang nghĩ gì thế?
          </button>
        ) : (
          <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              <div className="mt-1 inline-flex rounded-lg border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => controller.handleComposerVisibilityChange('PUBLIC')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    controller.composerVisibility === 'PUBLIC'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <GlobeIcon className="w-3.5 h-3.5" />
                  <span>Công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => controller.handleComposerVisibilityChange('FRIENDS')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    controller.composerVisibility === 'FRIENDS'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <UsersIcon className="w-3.5 h-3.5" />
                  <span>Bạn bè</span>
                </button>
                <button
                  type="button"
                  onClick={() => controller.handleComposerVisibilityChange('PRIVATE')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    controller.composerVisibility === 'PRIVATE'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <LockIcon className="w-3.5 h-3.5" />
                  <span>Riêng tư</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={controller.handleCollapseComposer}
              aria-label="Thu gọn khung đăng bài"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Editor Form */}
      {controller.isComposerExpanded ? (
        <form onSubmit={controller.handleSubmitPost} className="space-y-3 pt-1">
          <div>
            <textarea
              id="lyora-post-composer-trigger"
              rows={3}
              value={controller.composerContent}
              onChange={controller.handleComposerContentChange}
              placeholder={`${displayName} ơi, hãy chia sẻ câu chuyện, cảm nghĩ hoặc hình ảnh hôm nay...`}
              aria-invalid={controller.composerError ? 'true' : 'false'}
              className={`w-full resize-y rounded-xl border bg-background/50 p-3.5 text-sm sm:text-base text-foreground placeholder:text-muted focus:bg-card focus:outline-none focus:ring-2 transition-colors ${
                controller.composerError
                  ? 'border-error focus:border-error focus:ring-error/25'
                  : 'border-border focus:border-primary focus:ring-primary/40'
              }`}
            />
            {controller.composerError && (
              <p role="alert" className="mt-1 text-xs text-error">
                {controller.composerError}
              </p>
            )}
          </div>

          {/* Drag & Drop Local Media Zone */}
          <div
            className={`rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
              controller.isDraggingComposerMedia
                ? 'border-primary bg-secondary/40 text-primary-active'
                : 'border-border bg-background/60 text-muted hover:border-secondary-strong'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
                  controller.isDraggingComposerMedia
                    ? 'border-primary bg-card text-primary'
                    : 'border-border bg-card text-muted'
                }`}
              >
                <UploadCloudIcon className="w-5 h-5" />
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {controller.isDraggingComposerMedia
                  ? 'Thả ảnh hoặc video tại đây để đính kèm'
                  : 'Kéo thả ảnh hoặc video từ máy tính vào đây'}
              </p>
              <p className="text-[11px] text-muted">
                Lưu tạm thời trên trình duyệt (tối đa 8 ảnh/video) hoặc chọn nhanh nút Ảnh / Video bên dưới
              </p>
            </div>
          </div>

          {/* Media Preview Strip */}
          {controller.composerMedia.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {controller.composerMedia.map((item, idx) => (
                <div
                  key={item.id ?? `${item.url}-${idx}`}
                  className="relative aspect-square rounded-xl border border-border bg-background overflow-hidden group"
                >
                  {item.type === 'IMAGE' ? (
                    <AppImage
                      src={item.url}
                      alt={item.alt || 'Ảnh đính kèm'}
                      className="h-full w-full rounded-none"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                    />
                  )}
                  <span className="absolute left-1.5 bottom-1.5 rounded-md bg-foreground/75 px-1.5 py-0.5 text-[10px] font-semibold text-card">
                    {item.type === 'IMAGE' ? 'Ảnh' : 'Video'}
                  </span>
                  <button
                    type="button"
                    onClick={() => controller.handleRemoveMedia(idx)}
                    aria-label="Gỡ phương tiện"
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/75 text-card hover:bg-error transition-colors cursor-pointer"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5">
              <label className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background transition-colors cursor-pointer">
                <ImageIcon className="w-4 h-4 text-success" />
                <span>Ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => controller.handlePickLocalMedia(e, 'IMAGE')}
                  className="sr-only"
                />
              </label>

              <label className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background transition-colors cursor-pointer">
                <VideoIcon className="w-4 h-4 text-accent" />
                <span>Video</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => controller.handlePickLocalMedia(e, 'VIDEO')}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={controller.handleCollapseComposer}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={controller.isCreatingPost}
              >
                Đăng bài
              </Button>
            </div>
          </div>
        </form>
      ) : (
        /* Compact Shortcut Row */
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border">
          <label className="inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer">
            <ImageIcon className="w-4 h-4 text-success" />
            <span>Ảnh</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => controller.handlePickLocalMedia(e, 'IMAGE')}
              className="sr-only"
            />
          </label>

          <label className="inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer">
            <VideoIcon className="w-4 h-4 text-accent" />
            <span>Video</span>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => controller.handlePickLocalMedia(e, 'VIDEO')}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              controller.handleCycleComposerVisibility();
              controller.handleExpandComposer();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
          >
            {controller.composerVisibility === 'PUBLIC' ? (
              <>
                <GlobeIcon className="w-4 h-4 text-primary" />
                <span>Công khai</span>
              </>
            ) : controller.composerVisibility === 'FRIENDS' ? (
              <>
                <UsersIcon className="w-4 h-4 text-info" />
                <span>Bạn bè</span>
              </>
            ) : (
              <>
                <LockIcon className="w-4 h-4 text-warning" />
                <span>Riêng tư</span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
};
