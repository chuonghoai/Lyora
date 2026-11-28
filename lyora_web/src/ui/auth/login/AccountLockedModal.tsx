import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, formatDateTime } from '@/core';

export interface AccountLockedModalProps {
  isOpen: boolean;
  lockReason: string;
  lockedAt?: string | null;
  onClose: () => void;
}

export const AccountLockedModal: React.FC<AccountLockedModalProps> = ({
  isOpen,
  lockReason,
  lockedAt,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-locked-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md space-y-6"
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error border border-error/25"
            aria-hidden="true"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <h2
              id="account-locked-modal-title"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              Tài khoản đã bị khóa
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Tài khoản của bạn hiện không thể đăng nhập vào hệ thống Lyora do đang ở trạng thái tạm khóa.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-error/30 bg-error/10 p-4 sm:p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-error">
            Lý do khóa tài khoản
          </p>
          <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
            {lockReason}
          </p>
          {lockedAt && (
            <p className="text-xs text-muted pt-1 tabular-nums">
              Thời điểm khóa: {formatDateTime(lockedAt)}
            </p>
          )}
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên nền tảng để được xem xét và hỗ trợ mở khóa tài khoản.
        </p>

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="button" variant="primary" onClick={onClose} className="px-6">
            Đã hiểu
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
