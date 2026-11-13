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
          <Link to={ROUTES.AUTH.REGISTER} className="font-semibold text-[#863bff] underline-offset-4 hover:underline">
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
