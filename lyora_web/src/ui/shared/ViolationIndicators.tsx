import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, formatDateTime } from '@/core';

export type ViolationModalTarget =
  | {
      kind: 'AVATAR';
      subjectName?: string;
      reason: string;
      flaggedAt?: string | null;
      evidenceUrl?: string | null;
    }
  | {
      kind: 'COVER';
      subjectName?: string;
      reason: string;
      flaggedAt?: string | null;
      evidenceUrl?: string | null;
    }
  | {
      kind: 'POST';
      postId?: string;
      subjectName?: string;
      reason: string;
      flaggedAt?: string | null;
      postExcerpt?: string | null;
    };

export const ExclamationAlertIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="16.25" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

const ChevronRightMiniIcon: React.FC<{ className?: string }> = ({
  className = 'w-3 h-3',
}) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M7.5 5l5 5-5 5" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export interface AvatarViolationButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  className?: string;
}

const AVATAR_BADGE_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-5 w-5 -top-1 -right-1',
  md: 'h-6 w-6 -top-1 -right-1',
  lg: 'h-7 w-7 sm:h-8 sm:w-8 top-0 right-0',
};

const AVATAR_BADGE_ICON_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4 h-4 sm:w-[18px] sm:h-[18px]',
};

/**
 * Nút cảnh báo chấm than bấm được đặt ở góc trên-phải ảnh đại diện đang bị gắn cờ vi phạm.
 */
export const AvatarViolationButton: React.FC<AvatarViolationButtonProps> = ({
  onClick,
  size = 'md',
  ariaLabel = 'Xem lý do và bằng chứng ảnh đại diện vi phạm',
  className = '',
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }}
    aria-label={ariaLabel}
    title="Nhấn để xem lý do và bằng chứng vi phạm"
    className={`absolute z-20 inline-flex items-center justify-center rounded-full bg-error text-on-primary ring-2 ring-card shadow-sm cursor-pointer transition-transform duration-150 hover:bg-error/90 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-card ${AVATAR_BADGE_SIZE_CLASSES[size]} ${className}`}
  >
    <ExclamationAlertIcon className={AVATAR_BADGE_ICON_CLASSES[size]} />
  </button>
);

export interface CoverViolationButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Nút cảnh báo chấm than bấm được hiển thị trên ảnh bìa khi bị đánh dấu vi phạm.
 */
export const CoverViolationButton: React.FC<CoverViolationButtonProps> = ({
  onClick,
  ariaLabel = 'Xem lý do và bằng chứng ảnh bìa vi phạm',
  className = '',
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }}
    aria-label={ariaLabel}
    title="Nhấn để xem lý do và bằng chứng ảnh bìa vi phạm"
    className={`inline-flex items-center gap-1.5 rounded-full bg-error px-3 py-1.5 text-xs font-semibold text-on-primary ring-2 ring-card shadow-sm cursor-pointer transition-all duration-150 hover:bg-error/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 ${className}`}
  >
    <ExclamationAlertIcon className="w-4 h-4 shrink-0" />
    <span>Ảnh bìa vi phạm</span>
    <ChevronRightMiniIcon className="w-3.5 h-3.5 shrink-0" />
  </button>
);

export interface PostViolationBadgeProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Nhãn "Vi phạm" tương tác bấm được trên bài viết để mở modal xem lý do chi tiết.
 */
export const PostViolationBadge: React.FC<PostViolationBadgeProps> = ({
  onClick,
  ariaLabel = 'Xem lý do bài viết bị đánh dấu vi phạm',
  className = '',
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }}
    aria-label={ariaLabel}
    title="Nhấn để xem lý do bài viết bị đánh dấu vi phạm"
    className={`inline-flex items-center gap-1 rounded-full border border-error/45 bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error shadow-sm cursor-pointer transition-all duration-150 hover:bg-error hover:text-on-primary hover:border-error active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 focus-visible:ring-offset-1 ${className}`}
  >
    <ExclamationAlertIcon className="w-3.5 h-3.5 shrink-0" />
    <span>Vi phạm</span>
    <ChevronRightMiniIcon className="w-3 h-3 shrink-0 opacity-85" />
  </button>
);

export interface ViolationDetailModalProps {
  target: ViolationModalTarget | null;
  onClose: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'outline' | 'danger';
    isLoading?: boolean;
  };
}

export const ViolationDetailModal: React.FC<ViolationDetailModalProps> = ({
  target,
  onClose,
  primaryAction,
}) => {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !primaryAction?.isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, primaryAction?.isLoading, onClose]);

  if (!target || typeof document === 'undefined') return null;

  const modalTitle =
    target.kind === 'AVATAR'
      ? 'Ảnh đại diện bị đánh dấu vi phạm'
      : target.kind === 'COVER'
        ? 'Ảnh bìa bị đánh dấu vi phạm'
        : 'Bài viết bị đánh dấu vi phạm';

  const evidenceLabel =
    target.kind === 'AVATAR'
      ? 'Bằng chứng vi phạm (ảnh đại diện)'
      : 'Bằng chứng vi phạm (ảnh bìa)';

  const evidenceUrl =
    target.kind === 'AVATAR' || target.kind === 'COVER'
      ? target.evidenceUrl?.trim() || null
      : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="violation-detail-modal-title"
      onClick={() => {
        if (!primaryAction?.isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl max-h-[90dvh] rounded-2xl border border-border bg-card shadow-md flex flex-col overflow-hidden"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-error/30 bg-error/10 text-error">
              <ExclamationAlertIcon className="w-5 h-5" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <h2
                id="violation-detail-modal-title"
                className="text-base sm:text-lg font-semibold text-foreground"
              >
                {modalTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                {target.subjectName && (
                  <span className="font-medium text-foreground truncate">
                    {target.subjectName}
                  </span>
                )}
                {target.flaggedAt && (
                  <span className="tabular-nums">
                    Đánh dấu lúc {formatDateTime(target.flaggedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={Boolean(primaryAction?.isLoading)}
            onClick={onClose}
            aria-label="Đóng hộp thoại chi tiết vi phạm"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          <section
            aria-label="Lý do đánh dấu vi phạm"
            className="rounded-xl border border-error/30 bg-error/10 p-4 space-y-1.5"
          >
            <p className="text-xs font-semibold text-error">
              Lý do vi phạm từ Quản trị viên
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line break-words">
              {target.reason}
            </p>
          </section>

          {target.kind === 'POST' && target.postExcerpt?.trim() && (
            <section
              aria-label="Trích đoạn bài viết"
              className="rounded-xl border border-border bg-background/70 p-3.5 space-y-1"
            >
              <p className="text-xs font-medium text-muted">
                Nội dung bài viết liên quan
              </p>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line line-clamp-4 break-words">
                {target.postExcerpt.trim()}
              </p>
            </section>
          )}

          {(target.kind === 'AVATAR' || target.kind === 'COVER') && (
            <section aria-label={evidenceLabel} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {evidenceLabel}
                </p>
                {evidenceUrl && (
                  <a
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
                  >
                    Mở ảnh kích thước gốc
                  </a>
                )}
              </div>

              {evidenceUrl ? (
                <div className="rounded-xl border border-border bg-background p-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={evidenceUrl}
                    alt={evidenceLabel}
                    className="block max-w-full max-h-[48dvh] w-auto h-auto object-contain rounded-lg"
                  />
                </div>
              ) : (
                <p className="rounded-xl border border-border bg-background p-4 text-xs text-muted">
                  Không có bản lưu hình ảnh bằng chứng đi kèm.
                </p>
              )}
            </section>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border bg-card px-5 py-3.5 sm:px-6 shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(primaryAction?.isLoading)}
            onClick={onClose}
          >
            Đóng
          </Button>
          {primaryAction && (
            <Button
              type="button"
              variant={primaryAction.variant ?? 'primary'}
              isLoading={Boolean(primaryAction.isLoading)}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
};
