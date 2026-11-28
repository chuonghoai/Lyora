import React from 'react';
import { createPortal } from 'react-dom';
import { AppImage, Button } from '@/core';
import type { Post, PostMediaItem } from '@/features/posts';
import {
  AtSignIcon,
  CloseIcon,
  EyeIcon,
  GlobeIcon,
  ImageIcon,
  LockIcon,
  MicIcon,
  SparklesIcon,
  StopIcon,
  UploadCloudIcon,
  UsersIcon,
  VideoIcon,
} from './ClientIcons';
import { PostAiSuggestionPanel } from './PostAiSuggestionPanel';
import { PostAudioPlayer, PostAvatarChip, PostMediaGallery } from './PostCard';
import {
  MAX_AUDIO_RECORDING_SECONDS,
  type FriendContactItem,
  type PostFeedProfileUser,
} from './post-feed.controller';
import { usePostEditModalController } from './post-edit-modal.controller';

export interface PostEditModalProps {
  post: Post | null;
  friends: FriendContactItem[];
  profileUser?: PostFeedProfileUser | null;
  onClose: () => void;
  onOpenLightbox: (items: PostMediaItem[], index: number) => void;
}

const RECORDING_WAVE_BARS = 28;

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const PostEditModal: React.FC<PostEditModalProps> = ({
  post,
  friends,
  profileUser,
  onClose,
  onOpenLightbox,
}) => {
  const controller = usePostEditModalController({
    post,
    friends,
    profileUser,
    onClose,
    onOpenLightbox,
  });

  if (!post || typeof document === 'undefined') {
    return null;
  }

  const visualMedia = controller.media.filter((item) => item.type !== 'AUDIO');
  const audioMedia = controller.media.filter((item) => item.type === 'AUDIO');

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chỉnh sửa bài viết"
      onClick={controller.handleRequestClose}
      className="fixed inset-0 z-[55] bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onDragEnter={controller.handleDragEnter}
        onDragOver={controller.handleDragOver}
        onDragLeave={controller.handleDragLeave}
        onDrop={controller.handleDropMedia}
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border bg-card shadow-xl overflow-hidden transition-colors ${
          controller.isDraggingMedia
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-border'
        }`}
      >
        {/* Header cố định */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 border-b border-border bg-card shrink-0">
          <h2 className="text-base font-bold text-foreground">Chỉnh sửa bài viết</h2>
          <button
            type="button"
            disabled={controller.isUpdatingPost}
            onClick={controller.handleRequestClose}
            aria-label="Đóng hộp thoại chỉnh sửa bài viết"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form soạn thảo */}
        <form onSubmit={controller.handleSubmitEdit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto px-4 py-4 sm:px-5 space-y-3 flex-1">
            {/* Tác giả + Chọn phạm vi hiển thị */}
            <div className="flex items-center gap-3">
              <PostAvatarChip name={controller.displayName} avatarUrl={controller.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {controller.displayName}
                </p>
                <div className="mt-1 inline-flex rounded-lg border border-border bg-background p-0.5">
                  <button
                    type="button"
                    onClick={() => controller.handleVisibilityChange('PUBLIC')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      controller.visibility === 'PUBLIC'
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <GlobeIcon className="w-3.5 h-3.5" />
                    <span>Công khai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => controller.handleVisibilityChange('FRIENDS')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      controller.visibility === 'FRIENDS'
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>Bạn bè</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => controller.handleVisibilityChange('PRIVATE')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      controller.visibility === 'PRIVATE'
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <LockIcon className="w-3.5 h-3.5" />
                    <span>Riêng tư</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ô nhập nội dung */}
            <div>
              <textarea
                id="lyora-post-edit-input"
                rows={4}
                value={controller.content}
                onChange={controller.handleContentChange}
                placeholder={`${controller.displayName} ơi, hãy cập nhật nội dung bài viết của bạn...`}
                aria-invalid={controller.error ? 'true' : 'false'}
                className={`w-full resize-y rounded-xl border bg-background/50 p-3.5 text-sm sm:text-base text-foreground placeholder:text-muted focus:bg-card focus:outline-none focus:ring-2 transition-colors ${
                  controller.error
                    ? 'border-error focus:border-error focus:ring-error/25'
                    : 'border-border focus:border-primary focus:ring-primary/40'
                }`}
              />
              {controller.error && (
                <p role="alert" className="mt-1 text-xs text-error">
                  {controller.error}
                </p>
              )}
            </div>

            {/* Vùng kéo thả ảnh / video */}
            <div
              className={`rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
                controller.isDraggingMedia
                  ? 'border-primary bg-secondary/40 text-primary-active'
                  : 'border-border bg-background/60 text-muted hover:border-secondary-strong'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
                    controller.isDraggingMedia
                      ? 'border-primary bg-card text-primary'
                      : 'border-border bg-card text-muted'
                  }`}
                >
                  <UploadCloudIcon className="w-5 h-5" />
                </span>
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  {controller.isDraggingMedia
                    ? 'Thả ảnh hoặc video tại đây để đính kèm'
                    : 'Kéo thả ảnh hoặc video từ máy tính vào đây'}
                </p>
                <p className="text-[11px] text-muted">
                  Tối đa 8 ảnh, video hoặc bản ghi âm, hoặc chọn nhanh nút Ảnh / Video / Ghi âm bên dưới
                </p>
              </div>
            </div>

            {/* Lưới xem trước Ảnh / Video đính kèm */}
            {visualMedia.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {controller.media.map((item, idx) =>
                  item.type === 'AUDIO' ? null : (
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
                  ),
                )}
              </div>
            )}

            {/* Thanh ghi âm giọng nói */}
            {controller.isRecordingAudio && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-foreground"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-error animate-pulse" aria-hidden="true" />
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatRecordingTime(controller.audioRecordingDuration)}
                  <span className="font-normal text-muted">
                    {' '}
                    / {formatRecordingTime(MAX_AUDIO_RECORDING_SECONDS)}
                  </span>
                </span>
                <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden="true">
                  {Array.from({ length: RECORDING_WAVE_BARS }, (_, idx) => (
                    <span
                      key={idx}
                      style={{
                        height: `${25 + ((idx * 37) % 70)}%`,
                        animationDelay: `${(idx % 7) * 90}ms`,
                      }}
                      className="w-[3px] flex-1 rounded-full bg-primary/70 animate-pulse"
                    />
                  ))}
                </div>
                <Button type="button" variant="ghost" onClick={controller.cancelAudioRecording}>
                  Hủy
                </Button>
                <Button type="button" variant="primary" onClick={controller.stopAudioRecording}>
                  <StopIcon className="mr-1.5 w-3.5 h-3.5" />
                  Dừng
                </Button>
              </div>
            )}

            {/* Bản ghi âm đã đính kèm */}
            {audioMedia.map((item) => {
              const index = controller.media.findIndex((media) => media.id === item.id);
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <PostAudioPlayer item={item} className="flex-1" />
                  <button
                    type="button"
                    onClick={() => controller.handleRemoveMedia(index)}
                    aria-label="Xóa bản ghi âm"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background hover:text-error transition-colors cursor-pointer"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Danh sách bạn bè đã gắn thẻ */}
            {controller.taggedUsers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {controller.taggedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary-active"
                  >
                    @{user.fullName}
                    <button
                      type="button"
                      onClick={() => controller.handleRemoveTaggedUser(user.id)}
                      aria-label={`Bỏ gắn thẻ ${user.fullName}`}
                      className="inline-flex cursor-pointer text-muted hover:text-error"
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {controller.isMentionPickerOpen && (
              <div
                role="listbox"
                aria-label="Chọn bạn bè để gắn thẻ"
                className="max-h-44 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-sm"
              >
                {controller.friends.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted">Chưa có bạn bè để gắn thẻ.</p>
                ) : (
                  controller.friends.map((friend) => {
                    const isTagged = controller.taggedUsers.some((user) => user.id === friend.id);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        role="option"
                        aria-selected={isTagged}
                        onClick={() => controller.handleToggleTaggedUser(friend)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-background ${
                          isTagged ? 'text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        <span>{friend.fullName}</span>
                        {isTagged && <span className="text-xs">Đã gắn thẻ</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Trợ lý gợi ý AI */}
            <PostAiSuggestionPanel
              controller={controller}
              topicInputId="lyora-edit-ai-topic-input"
            />

            {/* Xem trước trên bảng tin */}
            {controller.isPreviewOpen && (
              <div className="rounded-xl border border-dashed border-border bg-background/60 p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Xem trước trên bảng tin
                </p>
                <article className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <PostAvatarChip
                      name={controller.displayName}
                      avatarUrl={controller.avatarUrl}
                      sizeClass="h-8 w-8 text-xs"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {controller.displayName}
                      </p>
                      <p className="text-[11px] text-muted">Sau khi cập nhật</p>
                    </div>
                  </div>
                  {controller.content.trim() ? (
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                      {controller.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted">Nội dung bài viết sẽ hiển thị tại đây.</p>
                  )}
                  <PostMediaGallery
                    media={controller.media}
                    onOpenLightbox={controller.handleOpenLightbox}
                  />
                </article>
              </div>
            )}
          </div>

          {/* Footer cố định */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5 border-t border-border bg-card shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
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
                <VideoIcon className="w-4 h-4 text-primary" />
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
                onClick={controller.startAudioRecording}
                disabled={controller.isRecordingAudio}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-background transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-muted/60"
              >
                <MicIcon className="w-4 h-4 text-primary" />
                <span>Ghi âm</span>
              </button>

              <button
                type="button"
                onClick={controller.handleToggleMentionPicker}
                aria-pressed={controller.isMentionPickerOpen}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer hover:bg-background ${
                  controller.isMentionPickerOpen ? 'text-primary' : 'text-foreground'
                }`}
              >
                <AtSignIcon className="w-4 h-4 text-info" />
                <span>Gắn thẻ</span>
              </button>

              <button
                type="button"
                onClick={controller.handleTogglePreview}
                aria-pressed={controller.isPreviewOpen}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer hover:bg-background ${
                  controller.isPreviewOpen ? 'text-primary' : 'text-foreground'
                }`}
              >
                <EyeIcon className="w-4 h-4 text-muted" />
                <span>Xem trước</span>
              </button>

              <button
                type="button"
                onClick={controller.handleToggleAiPanel}
                aria-pressed={controller.isAiPanelOpen}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  controller.isAiPanelOpen ? 'bg-secondary text-primary-active' : 'text-foreground'
                }`}
              >
                <SparklesIcon className="w-4 h-4 text-primary" />
                <span>Gợi ý AI</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={controller.isUpdatingPost}
                onClick={controller.handleRequestClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={controller.isUpdatingPost}
                disabled={controller.isRecordingAudio}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
