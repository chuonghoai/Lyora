import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, formatDateTime } from '@/core';
import type { Post, PostAppealSummary } from '@/features/posts';
import { CloseIcon } from '../components/AdminIcons';

export interface AdminUserAppealEvidenceTarget {
  post: Post;
  appeal: PostAppealSummary;
}

export interface AdminUserAppealEvidenceModalProps {
  target: AdminUserAppealEvidenceTarget | null;
  fallbackAuthorName?: string;
  evidence: string;
  error: string | null;
  isSubmitting: boolean;
  onEvidenceChange: (value: string) => void;
  onClose: () => void;
  onConfirm: (e: React.FormEvent) => void;
}

export const AdminUserAppealEvidenceModal: React.FC<
  AdminUserAppealEvidenceModalProps
> = ({
  target,
  fallbackAuthorName = 'Thành viên Lyora',
  evidence,
  error,
  isSubmitting,
  onEvidenceChange,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, isSubmitting, onClose]);

  if (!target || typeof document === 'undefined') return null;

  const { post, appeal } = target;
  const authorName = post.author.fullName?.trim() || fallbackAuthorName;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-appeal-evidence-modal-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-md flex flex-col max-h-[min(88dvh,740px)] overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <h1
              id="admin-user-appeal-evidence-modal-title"
              className="text-base font-semibold text-foreground"
            >
              Gửi minh chứng giữ nguyên quyết định ẩn bài
            </h1>
            <p className="text-xs text-muted truncate">
              Thành viên: <strong className="font-medium text-foreground">{authorName}</strong>
              {post.author.email ? ` (${post.author.email})` : ''}
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng hộp thoại gửi minh chứng"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onConfirm} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2.5">
            <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted tabular-nums">
                <span className="font-mono">#{post.id.slice(0, 8)}</span>
                <span>{formatDateTime(post.createdAt)}</span>
              </div>
              <p className="text-xs text-foreground line-clamp-2 break-words">
                {post.content.trim() || '(Bài viết chỉ đính kèm phương tiện)'}
              </p>
              {post.moderationReason && (
                <p className="text-xs text-warning pt-1 border-t border-border/70">
                  <strong>Lý do ẩn ban đầu:</strong> {post.moderationReason}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-secondary-strong bg-secondary/35 p-3.5 space-y-1 text-xs">
              <p className="font-semibold text-primary-active">
                Khiếu nại của thành viên: {appeal.reasonCategory}
              </p>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {appeal.reasonDetail}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="admin-user-appeal-evidence-input"
                className="block text-xs font-medium text-foreground"
              >
                Minh chứng cụ thể gửi tới tác giả{' '}
                <span className="text-error">*</span>
              </label>
              <span className="text-[11px] text-muted tabular-nums">
                {evidence.length}/1000
              </span>
            </div>

            <textarea
              id="admin-user-appeal-evidence-input"
              rows={5}
              autoFocus
              maxLength={1000}
              value={evidence}
              onChange={(e) => onEvidenceChange(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nêu rõ bằng chứng, đoạn nội dung vi phạm hoặc điều khoản cụ thể dẫn tới quyết định giữ nguyên việc ẩn bài viết..."
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
            {error && (
              <p role="alert" className="text-xs text-error">
                {error}
              </p>
            )}
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Minh chứng này sẽ được gửi kèm thông báo tới tác giả và hiển thị trực tiếp trên bài viết bị ẩn tại trang hồ sơ cá nhân của họ.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button type="submit" variant="danger" isLoading={isSubmitting}>
              Gửi minh chứng
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
