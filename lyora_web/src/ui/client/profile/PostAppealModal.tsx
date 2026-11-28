import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, formatDateTime } from '@/core';
import {
  buildFinalPostAppealPayload,
  createPostAppealFormSchema,
  POST_APPEAL_REASON_OPTIONS,
  type Post,
  type PostAppealReasonKey,
} from '@/features/posts';
import { CloseIcon, LockIcon } from '../home/ClientIcons';

export interface PostAppealModalProps {
  post: Post | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitAppeal: (payload: {
    reasonCategory: string;
    reasonDetail: string;
  }) => Promise<void>;
}

export const PostAppealModal: React.FC<PostAppealModalProps> = ({
  post,
  isSubmitting,
  onClose,
  onSubmitAppeal,
}) => {
  const [reasonKey, setReasonKey] = useState<PostAppealReasonKey>(
    POST_APPEAL_REASON_OPTIONS[0].key,
  );
  const [detail, setDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!post) {
      setReasonKey(POST_APPEAL_REASON_OPTIONS[0].key);
      setDetail('');
      setErrorMsg(null);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, isSubmitting, onClose]);

  if (!post || typeof document === 'undefined') return null;

  const isOtherReason = reasonKey === 'OTHER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createPostAppealFormSchema.safeParse({
      reasonKey,
      detail: isOtherReason ? detail : undefined,
    });
    if (!parsed.success) {
      setErrorMsg(
        parsed.error.issues[0]?.message ??
          'Vui lòng chọn lý do hoặc nhập mô tả khiếu nại hợp lệ.',
      );
      return;
    }

    setErrorMsg(null);
    const payload = buildFinalPostAppealPayload(
      parsed.data.reasonKey,
      parsed.data.detail,
    );
    await onSubmitAppeal(payload);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-post-appeal-modal-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-md flex flex-col max-h-[90vh] overflow-hidden"
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning border border-warning/30">
              <LockIcon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="client-post-appeal-modal-title"
                className="text-lg font-bold text-foreground"
              >
                Khiếu nại quyết định ẩn bài viết
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Khiếu nại của bạn sẽ được gửi tới Ban Quản Trị để xem xét khôi phục hoặc cung cấp minh chứng cụ thể.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng hộp thoại khiếu nại"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Hidden post summary + admin reason */}
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2 text-muted tabular-nums">
                <span className="font-semibold text-warning">
                  Bài viết đang bị ẩn
                </span>
                <span>{formatDateTime(post.createdAt)}</span>
              </div>
              <p className="text-foreground line-clamp-2 break-words">
                {post.content.trim() || '(Bài viết chỉ đính kèm phương tiện)'}
              </p>
              <p className="text-foreground pt-1 border-t border-warning/25">
                <strong>Lý do ẩn từ Quản trị viên:</strong>{' '}
                {post.moderationReason?.trim() || 'Vi phạm tiêu chuẩn cộng đồng'}
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs sm:text-sm font-medium text-error"
              >
                {errorMsg}
              </div>
            )}

            <fieldset className="space-y-2.5">
              <legend className="text-sm font-semibold text-foreground">
                Chọn lý do khiếu nại <span className="text-error">*</span>
              </legend>

              <div className="space-y-2 pt-1">
                {POST_APPEAL_REASON_OPTIONS.map((option) => {
                  const selected = reasonKey === option.key;
                  return (
                    <label
                      key={option.key}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                        selected
                          ? 'border-primary bg-secondary/40'
                          : 'border-border bg-card hover:bg-background/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="postAppealReasonOption"
                        value={option.key}
                        checked={selected}
                        disabled={isSubmitting}
                        onChange={() => {
                          setReasonKey(option.key);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="mt-0.5 h-4 w-4 accent-primary shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          {option.label}
                        </p>
                        <p className="text-xs text-muted leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {isOtherReason && (
              <div className="space-y-1.5">
                <label
                  htmlFor="post-appeal-detail-input"
                  className="block text-sm font-semibold text-foreground"
                >
                  Mô tả chi tiết lý do khiếu nại{' '}
                  <span className="text-error">*</span>
                </label>
                <textarea
                  id="post-appeal-detail-input"
                  rows={4}
                  autoFocus
                  maxLength={1000}
                  disabled={isSubmitting}
                  value={detail}
                  onChange={(e) => {
                    setDetail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Trình bày rõ lý do bạn cho rằng bài viết không vi phạm hoặc cần được xem xét lại..."
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y"
                />
                <div className="flex items-center justify-between text-xs text-muted tabular-nums">
                  <span>Tối thiểu 10 ký tự</span>
                  <span>{detail.trim().length} / 1000</span>
                </div>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-background/50 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Gửi khiếu nại
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
};
