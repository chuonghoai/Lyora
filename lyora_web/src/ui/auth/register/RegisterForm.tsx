import React from 'react';
import { Button, Input } from '@/core';
import { FormAlert, PasswordField } from '@/ui/auth/AuthPrimitives';
import type { RegisterController } from './register.controller';

export interface RegisterFormProps {
  controller: RegisterController;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ controller }) => {
  if (controller.step === 'OTP') {
    return (
      <form onSubmit={controller.handleVerifyOtp} noValidate className="space-y-5">
        {controller.apiError && <FormAlert message={controller.apiError.message} />}

        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-[#5b08d9]">
          <p className="font-semibold">Xác thực địa chỉ email</p>
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
          className="text-center tracking-[0.4em] text-xl font-bold"
          required
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={controller.handleResendOtp}
            disabled={controller.cooldown > 0 || controller.isLoading}
            className="font-medium text-[#863bff] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:no-underline"
          >
            {controller.cooldown > 0 ? `Gửi lại sau ${controller.cooldown}s` : 'Gửi lại mã OTP'}
          </button>
          <button type="button" onClick={controller.handleBackToForm} className="text-[#625a7b] underline-offset-4 hover:text-[#2d0d64] hover:underline">
            Thay đổi thông tin
          </button>
        </div>

        <Button type="submit" variant="primary" isLoading={controller.isLoading} className="w-full py-3 text-base">
          Xác nhận &amp; Tạo tài khoản
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={controller.handleSubmitStep1} noValidate className="space-y-5">
      {controller.apiError && <FormAlert message={controller.apiError.message} />}

      <Input
        label="Họ và tên"
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder="Nguyễn Văn A"
        enterKeyHint="next"
        value={controller.formData.fullName}
        onChange={controller.handleFieldChange}
        onBlur={controller.handleFieldBlur}
        error={controller.validationErrors.fullName}
        required
      />

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="ban@lyora.com"
        spellCheck={false}
        enterKeyHint="next"
        value={controller.formData.email}
        onChange={controller.handleFieldChange}
        onBlur={controller.handleFieldBlur}
        error={controller.validationErrors.email}
        required
      />

      <PasswordField
        label="Mật khẩu"
        name="password"
        autoComplete="new-password"
        placeholder="Tối thiểu 6 ký tự"
        helperText="Tối thiểu 6 ký tự"
        enterKeyHint="next"
        value={controller.formData.password}
        onChange={controller.handleFieldChange}
        onBlur={controller.handleFieldBlur}
        error={controller.validationErrors.password}
        isVisible={controller.showPassword}
        onToggleVisibility={controller.handleTogglePassword}
        required
      />

      <PasswordField
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Nhập lại mật khẩu"
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
        Tiếp tục nhận mã OTP
      </Button>
    </form>
  );
};
