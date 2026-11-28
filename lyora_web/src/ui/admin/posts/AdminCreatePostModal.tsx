import React from 'react';
import { AppImage, Button } from '@/core';
import { POST_SUGGESTION_TONES, type PostVisibility } from '@/features/posts';
import {
  CloseIcon,
  ImageIcon,
  RotateCcwIcon,
  SparklesIcon,
} from '../components/AdminIcons';
import type { AdminPostsController } from './admin-posts.controller';
import { AdminDialog } from './AdminDialog';

export interface AdminCreatePostModalProps {
  controller: AdminPostsController;
}

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Công khai toàn cộng đồng' },
  { value: 'FRIENDS', label: 'Chỉ bạn bè' },
  { value: 'PRIVATE', label: 'Nội bộ (Riêng tư)' },
];

export const AdminCreatePostModal: React.FC<AdminCreatePostModalProps> = ({
  controller,
}) => {
  return (
    <AdminDialog
      open={controller.isCreateModalOpen}
      onClose={controller.handleCloseCreateModal}
      labelledBy="admin-create-post-title"
      closedBy={controller.isComposerDirty ? 'closerequest' : 'any'}
      maxWidthClassName="max-w-2xl"
      disableDismiss={controller.isPublishingPost}
    >
      <div className="flex max-h-[min(88dvh,780px)] flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
          <div>
            <h1
              id="admin-create-post-title"
              className="text-base font-semibold text-foreground"
            >
              Đăng bài viết / Thông báo từ Ban Quản Trị
            </h1>
            <p className="text-xs text-muted">
              Bài viết sẽ mang dấu xác thực Quản trị khi hiển thị trên hệ thống.
            </p>
          </div>

          <button
            type="button"
            disabled={controller.isPublishingPost}
            onClick={controller.handleCloseCreateModal}
            aria-label="Đóng khung đăng bài quản trị"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={controller.handleSubmitAdminPost}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-foreground">
              Phạm vi hiển thị
            </span>
            <div
              role="radiogroup"
              aria-label="Phạm vi hiển thị bài viết"
              className="flex flex-wrap gap-1.5"
            >
              {VISIBILITY_OPTIONS.map((opt) => {
                const active = controller.composerVisibility === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      controller.handleComposerVisibilityChange(opt.value)
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? 'border-secondary-strong bg-secondary text-primary-active'
                        : 'border-border bg-card text-foreground hover:bg-background'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="admin-post-content-input"
                className="block text-xs font-medium text-foreground"
              >
                Nội dung thông báo / bài viết
              </label>
              <span className="text-[11px] text-muted tabular-nums">
                {controller.composerContent.length.toLocaleString('vi-VN')} /
                5.000
              </span>
            </div>
            <textarea
              id="admin-post-content-input"
              autoFocus
              maxLength={5000}
              value={controller.composerContent}
              onChange={controller.handleComposerContentChange}
              disabled={controller.isPublishingPost}
              placeholder="Nhập nội dung thông báo chính thức hoặc chia sẻ gửi tới cộng đồng Lyora..."
              className="lyora-auto-textarea rounded-xl border border-border bg-card p-3.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {controller.composerError && (
              <p role="alert" className="text-xs text-error">
                {controller.composerError}
              </p>
            )}
          </div>

          {/* Media Previews */}
          {controller.composerMedia.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {controller.composerMedia.map((item, idx) => (
                <div
                  key={item.id ?? `${item.url}-${idx}`}
                  className="relative aspect-square rounded-xl border border-border bg-background overflow-hidden"
                >
                  {item.type === 'IMAGE' ? (
                    <AppImage
                      src={item.url}
                      alt={item.fileName || 'Ảnh đính kèm'}
                      className="h-full w-full rounded-none object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      muted
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => controller.handleRemoveComposerMedia(idx)}
                    aria-label="Gỡ phương tiện"
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/75 text-card hover:bg-error transition-colors cursor-pointer"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Suggestion Tray */}
          {controller.isAiPanelOpen && (
            <div className="rounded-xl border border-border bg-background/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Trợ lý gợi ý nội dung AI
                  </span>
                </div>

                {controller.canUndoAiApply && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={controller.handleUndoAiApply}
                    className="h-7 px-2 py-1 text-xs gap-1"
                  >
                    <RotateCcwIcon className="w-3 h-3" />
                    <span>Hoàn tác</span>
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="admin-ai-topic-input"
                    className="block text-xs font-medium text-foreground"
                  >
                    Ý chính cần truyền tải
                  </label>
                  <span className="text-[11px] text-muted">
                    Enter để tạo gợi ý · Shift + Enter xuống dòng
                  </span>
                </div>
                <textarea
                  id="admin-ai-topic-input"
                  maxLength={2000}
                  value={controller.aiTopic}
                  onChange={controller.handleAiTopicChange}
                  onCompositionEnd={controller.handleAiTopicCompositionEnd}
                  onKeyDown={controller.handleAiTopicKeyDown}
                  disabled={controller.isGeneratingAi}
                  placeholder="Ví dụ: Thông báo cập nhật quy tắc cộng đồng văn minh tuần này..."
                  className="lyora-auto-textarea-compact rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div
                className="flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label="Chọn giọng điệu"
              >
                {POST_SUGGESTION_TONES.map((tone) => {
                  const selected = controller.aiTone === tone.value;
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={controller.isGeneratingAi}
                      onClick={() => controller.handleAiToneChange(tone.value)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        selected
                          ? 'border-secondary-strong bg-secondary text-primary-active font-semibold'
                          : 'border-border bg-card text-foreground hover:bg-background'
                      }`}
                    >
                      {tone.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={controller.isGeneratingAi}
                  onClick={() => void controller.handleRequestAiSuggestions()}
                  className="h-8 px-3 py-1 text-xs gap-1.5"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>
                    {controller.aiSuggestions.length > 0
                      ? 'Tạo lại gợi ý'
                      : 'Tạo gợi ý'}
                  </span>
                </Button>
              </div>

              {controller.aiError && (
                <p role="alert" className="text-xs text-error">
                  {controller.aiError}
                </p>
              )}

              {controller.isGeneratingAi ? (
                <div className="space-y-2 animate-pulse" role="status">
                  {[0, 1, 2].map((slot) => (
                    <div
                      key={slot}
                      className="rounded-lg border border-border bg-card p-3 space-y-2"
                    >
                      <div className="h-3.5 w-24 rounded bg-secondary/50" />
                      <div className="h-10 w-full rounded bg-border/70" />
                    </div>
                  ))}
                </div>
              ) : (
                controller.aiSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {controller.aiSuggestions.map((sug, idx) => (
                      <div
                        key={sug.id}
                        className="rounded-lg border border-border bg-card p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-primary-active">
                            Phương án {idx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              controller.handleApplyAiSuggestion(sug.id)
                            }
                            className="h-7 px-2.5 py-0.5 text-xs"
                          >
                            Dùng bản này
                          </Button>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
                          {sug.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* Toolbar & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors cursor-pointer">
                <ImageIcon className="w-3.5 h-3.5 text-muted" />
                <span>Đính kèm ảnh/video</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  disabled={controller.isPublishingPost}
                  onChange={controller.handlePickComposerMedia}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={controller.handleToggleAiPanel}
                aria-pressed={controller.isAiPanelOpen}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  controller.isAiPanelOpen
                    ? 'border-secondary-strong bg-secondary text-primary-active'
                    : 'border-border bg-card text-foreground hover:bg-background'
                }`}
              >
                <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                <span>Gợi ý AI</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                disabled={controller.isPublishingPost}
                onClick={controller.handleCloseCreateModal}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={controller.isPublishingPost}
              >
                Xuất bản bài viết
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
};
