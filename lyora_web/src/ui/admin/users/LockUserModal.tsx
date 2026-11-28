import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppImage, Button } from '@/core';
import {
  buildFinalLockReason,
  LOCK_ACCOUNT_REASONS,
  lockUserFormSchema,
  type AdminUserDetail,
  type LockAccountReasonKey,
} from '@/features/user';
import { CloseIcon, LockIcon } from '../components/AdminIcons';

export interface LockUserModalProps {
  isOpen: boolean;
  user: AdminUserDetail | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmLock: (finalReason: string) => Promise<void>;
}

export const LockUserModal: React.FC<LockUserModalProps> = ({
  isOpen,
  user,
  isSubmitting,
  onClose,
  onConfirmLock,
}) => {
  const [reasonKey, setReasonKey] = useState<LockAccountReasonKey>(
    LOCK_ACCOUNT_REASONS[0].key,
  );
  const [detail, setDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReasonKey(LOCK_ACCOUNT_REASONS[0].key);
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
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user || typeof document === 'undefined') return null;

  const displayName = user.fullName?.trim() || 'Thành viên Lyora';
  const initial = displayName.charAt(0).toUpperCase();
  const isOtherReason = reasonKey === 'OTHER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = lockUserFormSchema.safeParse({
      reasonKey,
      detail: isOtherReason ? detail : '',
    });
    if (!parsed.success) {
      setErrorMsg(
        parsed.error.issues[0]?.message ??
          'Vui lòng chọn lý do và nhập mô tả rõ ràng.',
      );
      return;
    }

    setErrorMsg(null);
    const finalReason = buildFinalLockReason(
      parsed.data.reasonKey,
      parsed.data.detail,
    );
    await onConfirmLock(finalReason);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-user-modal-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-md flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error border border-error/25">
              <LockIcon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="lock-user-modal-title"
                className="text-lg font-bold text-foreground"
              >
                Khóa tài khoản người dùng
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Tài khoản bị khóa sẽ bị thu hồi toàn bộ phiên đăng nhập và hiển thị rõ lý do này khi đăng nhập lại.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng cửa sổ khóa tài khoản"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Body */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Target user summary */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3.5">
              {user.avatarUrl ? (
                <AppImage
                  src={user.avatarUrl}
                  alt={displayName}
                  rounded
                  className="h-11 w-11 shrink-0 border border-border"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold text-primary">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
                {user.role === 'ADMIN' ? 'Quản trị' : 'Người dùng'}
              </span>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs sm:text-sm font-medium text-error"
              >
                {errorMsg}
              </div>
            )}

            {/* Reason list */}
            <fieldset className="space-y-2.5">
              <legend className="text-sm font-semibold text-foreground">
                Chọn nhóm lý do khóa tài khoản <span className="text-error">*</span>
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {LOCK_ACCOUNT_REASONS.map((option) => {
                  const selected = reasonKey === option.key;
                  return (
                    <label
                      key={option.key}
                      className={[
                        'flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors',
                        selected
                          ? 'border-primary bg-secondary/40'
                          : 'border-border bg-card hover:bg-background/70',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="lockReasonOption"
                        value={option.key}
                        checked={selected}
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

            {/* Detailed explanation - only required when "Khác" is selected */}
            {isOtherReason && (
              <div className="space-y-1.5">
                <label
                  htmlFor="lock-reason-detail"
                  className="block text-sm font-semibold text-foreground"
                >
                  Mô tả rõ lý do khóa <span className="text-error">*</span>
                </label>
                <textarea
                  id="lock-reason-detail"
                  rows={4}
                  maxLength={400}
                  value={detail}
                  onChange={(e) => {
                    setDetail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ghi rõ hành vi vi phạm, thời điểm hoặc bằng chứng liên quan để người dùng nắm được lý do khi đăng nhập..."
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y"
                />
                <div className="flex items-center justify-between text-xs text-muted tabular-nums">
                  <span>Tối thiểu 10 ký tự · Thông tin này sẽ hiển thị trực tiếp cho người dùng</span>
                  <span>{detail.trim().length} / 400</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
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
              variant="danger"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Xác nhận khóa tài khoản
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
};
