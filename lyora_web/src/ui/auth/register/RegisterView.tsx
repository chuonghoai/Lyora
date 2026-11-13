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
          <Link to={ROUTES.AUTH.LOGIN} className="font-semibold text-[#2563eb] underline-offset-4 hover:underline">
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
