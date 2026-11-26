import React from 'react';
import { Button } from '@/core';
import { POST_SUGGESTION_TONES } from '@/features/posts';
import type { PostFeedController } from './post-feed.controller';
import { CloseIcon, SparklesIcon, UndoIcon } from './ClientIcons';

export interface PostAiSuggestionPanelProps {
  controller: PostFeedController;
}

export const PostAiSuggestionPanel: React.FC<PostAiSuggestionPanelProps> = ({
  controller,
}) => {
  if (!controller.isAiPanelOpen) {
    return null;
  }

  return (
    <section
      aria-label="Trợ lý gợi ý nội dung bài viết"
      className="rounded-xl border border-border bg-background/70 p-3.5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
            <SparklesIcon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">
            Trợ lý gợi ý nội dung
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {controller.canUndoAiApply && (
            <Button
              type="button"
              variant="ghost"
              onClick={controller.handleUndoAiApply}
              className="min-h-11 sm:min-h-8 px-2.5 py-1 text-xs gap-1.5"
            >
              <UndoIcon className="w-3.5 h-3.5" />
              <span>Hoàn tác</span>
            </Button>
          )}
          <button
            type="button"
            onClick={controller.handleToggleAiPanel}
            aria-label="Đóng bảng gợi ý AI"
            className="inline-flex min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 items-center justify-center rounded-lg text-muted hover:bg-card hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="lyora-ai-topic-input"
            className="block text-xs font-medium text-foreground"
          >
            Ý chính / mô tả chi tiết cho bài viết
          </label>
          <span className="text-[11px] tabular-nums text-muted">
            {controller.aiTopic.length}/2.000
          </span>
        </div>
        <textarea
          id="lyora-ai-topic-input"
          rows={4}
          maxLength={2000}
          value={controller.aiTopic}
          onChange={controller.handleAiTopicChange}
          onKeyDown={controller.handleAiTopicKeyDown}
          disabled={controller.isGeneratingAi}
          placeholder="Ví dụ: Cuối tuần đi phượt Đà Lạt cùng nhóm bạn thân, dừng chân uống cà phê ngắm sương sớm và chụp được nhiều ảnh đẹp..."
          className="min-h-[96px] w-full resize-y rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-background disabled:text-muted/60 disabled:cursor-not-allowed"
        />
        <p className="text-[11px] text-muted">
          Viết thoải mái nhiều dòng (có thể bỏ trống nếu đã đính kèm ảnh, video hoặc ghi âm) · Nhấn Ctrl+Enter để tạo nhanh
        </p>
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-foreground">
          Ngữ cảnh đang đưa vào AI
        </span>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground">
            Hiển thị: {controller.aiContextInfo.visibilityLabel}
          </span>
          {controller.aiContextInfo.hasComposerContent && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
              Nội dung đang soạn
            </span>
          )}
          {controller.aiContextInfo.imageCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
              {controller.aiContextInfo.imageCount} ảnh
            </span>
          )}
          {controller.aiContextInfo.videoCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
              {controller.aiContextInfo.videoCount} video
            </span>
          )}
          {controller.aiContextInfo.audioCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
              {controller.aiContextInfo.audioCount} bản ghi âm
            </span>
          )}
          {controller.aiContextInfo.taggedUserNames.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-primary-active">
              Gắn thẻ {controller.aiContextInfo.taggedUserNames.length} bạn bè
            </span>
          )}
        </div>
        {controller.aiContextInfo.oversizedMediaCount > 0 && (
          <p className="text-[11px] text-warning">
            Có {controller.aiContextInfo.oversizedMediaCount} tệp quá dung lượng gửi trực tiếp (&gt; 18 MB) nên AI chỉ sử dụng tên tệp/thông tin mô tả của tệp đó.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-foreground">
          Giọng điệu
        </span>
        <div
          role="radiogroup"
          aria-label="Chọn giọng điệu"
          className="flex flex-wrap gap-1.5"
        >
          {POST_SUGGESTION_TONES.map((option) => {
            const isSelected = controller.aiTone === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={controller.isGeneratingAi}
                onClick={() => controller.handleAiToneChange(option.value)}
                className={`inline-flex min-h-11 sm:min-h-8 items-center rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? 'border-secondary-strong bg-secondary text-primary-active font-semibold'
                    : 'border-border bg-card text-foreground hover:bg-background'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          isLoading={controller.isGeneratingAi}
          onClick={() => void controller.handleRequestAiSuggestions()}
          className="min-h-11 sm:min-h-9 gap-1.5"
        >
          <SparklesIcon className="w-4 h-4" />
          <span>
            {controller.aiSuggestions.length > 0 ? 'Tạo lại gợi ý' : 'Tạo gợi ý'}
          </span>
        </Button>
      </div>

      {controller.aiError && (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
        >
          {controller.aiError}
        </p>
      )}

      {controller.isGeneratingAi && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Đang tạo gợi ý nội dung"
          className="space-y-2"
        >
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-3 space-y-2"
            >
              <div className="h-3.5 w-24 animate-pulse rounded-lg bg-secondary/50" />
              <div className="h-3.5 w-full animate-pulse rounded-lg bg-secondary/50" />
              <div className="h-3.5 w-4/5 animate-pulse rounded-lg bg-secondary/50" />
            </div>
          ))}
        </div>
      )}

      {!controller.isGeneratingAi && controller.aiSuggestions.length > 0 && (
        <div className="space-y-2">
          {controller.aiSuggestions.map((item, index) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary-active">
                  Phương án {index + 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => controller.handleApplyAiSuggestion(item.id)}
                  className="min-h-11 sm:min-h-8 px-3 py-1 text-xs"
                >
                  Dùng bản này
                </Button>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {item.content}
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        Nội dung do AI tạo, hãy kiểm tra lại trước khi đăng. Văn bản, bạn bè gắn thẻ và tệp đính kèm (ảnh, video, ghi âm) trong bài viết sẽ được gửi tới dịch vụ AI để tạo gợi ý.
      </p>
    </section>
  );
};
