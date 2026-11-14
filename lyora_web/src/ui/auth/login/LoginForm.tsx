import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/core';
import { FormAlert, PasswordField } from '@/ui/auth/AuthPrimitives';
import { ROUTES } from '@/routes/paths';
import type { LoginController } from './login.controller';

export interface LoginFormProps {
  controller: LoginController;
}

export const LoginForm: React.FC<LoginFormProps> = ({ controller }) => {
  return (
    <form onSubmit={controller.handleSubmit} noValidate className="space-y-5">
      {controller.apiError && <FormAlert message={controller.apiError.message} />}

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
        error={controller.validationErrors.email}
        required
      />

      <PasswordField
        label="Mật khẩu"
        name="password"
        autoComplete="current-password"
        placeholder="Mật khẩu của bạn"
        enterKeyHint="done"
        value={controller.formData.password}
        onChange={controller.handleFieldChange}
        error={controller.validationErrors.password}
        isVisible={controller.showPassword}
        onToggleVisibility={controller.handleTogglePassword}
        required
      />

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            name="rememberMe"
            checked={controller.formData.rememberMe}
            onChange={controller.handleFieldChange}
            className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
          />
          <span className="text-sm text-muted">Ghi nhớ đăng nhập</span>
        </label>
        <Link
          to={ROUTES.AUTH.FORGOT_PASSWORD}
          className="rounded text-sm font-medium text-primary underline-offset-4 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button type="submit" variant="primary" isLoading={controller.isLoading} className="w-full py-3 text-base">
        Đăng nhập
      </Button>
    </form>
  );
};
