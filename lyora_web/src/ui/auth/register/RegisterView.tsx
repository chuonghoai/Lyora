import React from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';
import { useRegisterController } from './register.controller';
import { AuthShell } from '@/ui/auth/AuthShell';
import { ROUTES } from '@/routes/paths';

export default function RegisterView(): React.ReactElement {
  const controller = useRegisterController();

  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Điền thông tin bên dưới để bắt đầu hành trình cùng Lyora."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="rounded font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm controller={controller} />
    </AuthShell>
  );
}

export { RegisterView };
