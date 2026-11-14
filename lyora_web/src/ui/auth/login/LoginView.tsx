import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { useLoginController } from './login.controller';
import { AuthShell } from '@/ui/auth/AuthShell';
import { ROUTES } from '@/routes/paths';

export default function LoginView(): React.ReactElement {
  const controller = useLoginController();

  return (
    <AuthShell
      title="Đăng nhập"
      description="Chào mừng trở lại. Nhập thông tin tài khoản của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link
            to={ROUTES.AUTH.REGISTER}
            className="rounded font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <LoginForm controller={controller} />
    </AuthShell>
  );
}

export { LoginView };
