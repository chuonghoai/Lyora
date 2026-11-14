import React from 'react';
import { Button, Input } from '@/core';
import { FormAlert, PasswordField } from '@/ui/auth/AuthPrimitives';
import type { ForgotPasswordController } from './forgot-password.controller';

export interface ForgotPasswordFormProps {
  controller: ForgotPasswordController;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ controller }) => {
  return (
    <div className="space-y-5">
      {controller.apiError && <FormAlert message={controller.apiError.message} />}

      {controller.step === 'EMAIL' && (
        <form onSubmit={controller.handleSendOtp} noValidate className="space-y-5">
          <Input
            label="Email tài khoản"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="ban@lyora.com"
            spellCheck={false}
            enterKeyHint="done"
            value={controller.formData.email}
            onChange={controller.handleFieldChange}
            onBlur={controller.handleFieldBlur}
            error={controller.validationErrors.email}
            required
          />
          <Button type="submit" variant="primary" isLoading={controller.isLoading} className="w-full py-3 text-base">
            Nhận mã xác thực OTP
          </Button>
        </form>
      )}

      {controller.step === 'OTP' && (
        <form onSubmit={controller.handleVerifyOtp} noValidate className="space-y-5">
          <div className="rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-foreground">
            <p className="font-semibold text-info">Xác thực mã OTP</p>
            <p className="mt-1">Mã 6 chữ số đã được gửi tới <strong>{controller.formData.email}</strong>.</p>
          </div>

          <Input
            label="Mã OTP"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            spellCheck={false}
            enterKeyHint="done"
            value={controller.formData.otp}
            onChange={controller.handleFieldChange}
            error={controller.validationErrors.otp}
            className="text-center tracking-[0.4em] text-xl font-bold tabular-nums"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={controller.handleResendOtp}
              disabled={controller.cooldown > 0 || controller.isLoading}
              className="font-medium text-primary underline-offset-4 hover:text-primary-hover hover:underline disabled:cursor-not-allowed disabled:text-muted/60 disabled:no-underline cursor-pointer"
            >
              {controller.cooldown > 0 ? `Gửi lại sau ${controller.cooldown}s` : 'Gửi lại mã OTP'}
            </button>
            <button type="button" onClick={controller.handleBackToEmail} className="text-muted underline-offset-4 hover:text-foreground hover:underline cursor-pointer">
              Thay đổi email
            </button>
          </div>

          <Button type="submit" variant="primary" isLoading={controller.isLoading} className="w-full py-3 text-base">
            Xác nhận mã OTP
          </Button>
        </form>
      )}

      {controller.step === 'RESET' && (
        <form onSubmit={controller.handleResetPassword} noValidate className="space-y-5">
          <div className="rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-foreground">
            <p className="font-semibold text-info">Thiết lập mật khẩu mới</p>
            <p className="mt-1">Đặt lại mật khẩu cho <strong>{controller.formData.email}</strong>.</p>
          </div>

          <PasswordField
            label="Mật khẩu mới"
            name="newPassword"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            helperText="Tối thiểu 6 ký tự"
            enterKeyHint="next"
            value={controller.formData.newPassword}
            onChange={controller.handleFieldChange}
            onBlur={controller.handleFieldBlur}
            error={controller.validationErrors.newPassword}
            isVisible={controller.showPassword}
            onToggleVisibility={controller.handleTogglePassword}
            required
          />

          <PasswordField
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            enterKeyHint="done"
            value={controller.formData.confirmPassword}
            onChange={controller.handleFieldChange}
            onBlur={controller.handleFieldBlur}
            error={controller.validationErrors.confirmPassword}
            isVisible={controller.showPassword}
            onToggleVisibility={controller.handleTogglePassword}
            required
          />

          <Button type="submit" variant="primary" isLoading={controller.isLoading} className="w-full py-3 text-base">
            Lưu mật khẩu mới &amp; Đăng nhập
          </Button>
        </form>
      )}
    </div>
  );
};
