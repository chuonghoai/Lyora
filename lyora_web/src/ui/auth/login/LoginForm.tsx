import React from 'react';
import { Button, Input } from '@/core';
import type { LoginController } from './login.controller';

export interface LoginFormProps {
  controller: LoginController;
}

export const LoginForm: React.FC<LoginFormProps> = ({ controller }) => {
  return (
    <form onSubmit={controller.handleSubmit} noValidate className="space-y-4 text-left">
      {controller.apiError && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in"
        >
          <svg
            className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{controller.apiError.message}</p>
          </div>
        </div>
      )}

      <Input
        label="Địa chỉ Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="vidu@lyora.com"
        value={controller.formData.email}
        onChange={controller.handleFieldChange}
        error={controller.validationErrors.email}
        required
      />

      <div className="relative">
        <Input
          label="Mật khẩu"
          name="password"
          type={controller.showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Nhập mật khẩu của bạn"
          value={controller.formData.password}
          onChange={controller.handleFieldChange}
          error={controller.validationErrors.password}
          required
        />
        <button
          type="button"
          onClick={controller.handleTogglePassword}
          className="absolute right-3 top-8.5 text-[#64748b] hover:text-[#0f172a] text-xs font-medium cursor-pointer transition-colors p-1"
          aria-label={controller.showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
        >
          {controller.showPassword ? 'Ẩn' : 'Hiện'}
        </button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="rememberMe"
            checked={controller.formData.rememberMe}
            onChange={controller.handleFieldChange}
            className="w-4 h-4 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
          />
          <span className="text-xs text-[#475569]">Ghi nhớ đăng nhập</span>
        </label>

        <span className="text-xs text-[#2563eb] hover:underline cursor-pointer">
          Quên mật khẩu?
        </span>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={controller.isLoading}
          className="w-full py-2.5 text-base shadow-md shadow-blue-500/25"
        >
          Đăng nhập
        </Button>
      </div>
    </form>
  );
};
