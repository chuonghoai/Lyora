import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input, type UserRole } from '@/core';
import {
  ADMIN_USER_ROLE_OPTIONS,
  createAdminUserFormSchema,
  type CreateAdminUserPayload,
} from '@/features/user';
import { CloseIcon, EyeIcon, EyeOffIcon, UserPlusIcon } from '../components/AdminIcons';

export interface CreateUserModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  apiError: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateAdminUserPayload) => Promise<void>;
}

interface CreateUserFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const INITIAL_FORM_STATE: CreateUserFormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'CLIENT',
};

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  isSubmitting,
  apiError,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateUserFormState>(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setFieldErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
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

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const updateField = <K extends keyof CreateUserFormState>(
    field: K,
    value: CreateUserFormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createAdminUserFormSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    await onSubmit({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 backdrop-blur-[1px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-md flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-secondary-strong/60">
              <UserPlusIcon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="create-user-modal-title"
                className="text-lg font-bold text-foreground"
              >
                Tạo tài khoản mới
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Khởi tạo tài khoản trực tiếp không cần xác thực OTP. Mật khẩu được mã hóa an toàn trước khi lưu.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Đóng cửa sổ tạo tài khoản"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Body */}
        <form onSubmit={(e) => void handleFormSubmit(e)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {apiError && (
              <div
                role="alert"
                className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs sm:text-sm font-medium text-error"
              >
                {apiError}
              </div>
            )}

            <Input
              id="admin-create-fullname"
              label="Họ và tên"
              type="text"
              placeholder="Ví dụ: Nguyễn Minh Anh"
              value={formData.fullName}
              error={fieldErrors.fullName}
              disabled={isSubmitting}
              onChange={(e) => updateField('fullName', e.target.value)}
            />

            <Input
              id="admin-create-email"
              label="Email đăng nhập"
              type="email"
              placeholder="nguoidung@lyora.vn"
              value={formData.email}
              error={fieldErrors.email}
              disabled={isSubmitting}
              onChange={(e) => updateField('email', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="admin-create-password"
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                error={fieldErrors.password}
                disabled={isSubmitting}
                onChange={(e) => updateField('password', e.target.value)}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="inline-flex h-full px-3 items-center justify-center text-muted hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <Input
                id="admin-create-confirm-password"
                label="Xác nhận mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                error={fieldErrors.confirmPassword}
                disabled={isSubmitting}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'
                    }
                    className="inline-flex h-full px-3 items-center justify-center text-muted hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Role Selector */}
            <fieldset className="space-y-2 pt-1">
              <legend className="text-sm font-medium text-foreground">
                Vai trò tài khoản
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADMIN_USER_ROLE_OPTIONS.map((option) => {
                  const selected = formData.role === option.value;
                  return (
                    <label
                      key={option.value}
                      className={[
                        'flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors',
                        selected
                          ? 'border-primary bg-secondary/40'
                          : 'border-border bg-card hover:bg-background/70',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="createUserRole"
                        value={option.value}
                        checked={selected}
                        disabled={isSubmitting}
                        onChange={() => updateField('role', option.value)}
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

              {fieldErrors.role && (
                <p role="alert" className="text-xs text-error">
                  {fieldErrors.role}
                </p>
              )}

              {formData.role === 'ADMIN' && (
                <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning leading-relaxed">
                  Lưu ý: Tài khoản Quản trị có toàn quyền quản lý người dùng và truy cập Trung Tâm Quản Trị.
                </p>
              )}
            </fieldset>
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
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Tạo tài khoản
            </Button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
};
