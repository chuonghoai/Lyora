import React from 'react';
import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useForgotPasswordController } from './forgot-password.controller';
import { AuthShell } from '@/ui/auth/AuthShell';
import { AuthProgress } from '@/ui/auth/AuthPrimitives';
import { ROUTES } from '@/routes/paths';

const STEPS = ['Email', 'Mã OTP', 'Mật khẩu mới'];

export default function ForgotPasswordView(): React.ReactElement {
  const controller = useForgotPasswordController();
  const stepNumber =
    controller.step === 'EMAIL' ? 1 : controller.step === 'OTP' ? 2 : 3;

  return (
    <AuthShell
      title="Khôi phục mật khẩu"
      description="Làm theo các bước để đặt lại mật khẩu tài khoản Lyora của bạn."
      progress={<AuthProgress steps={STEPS} currentStep={stepNumber} />}
      footer={
        <>
          Nhớ lại mật khẩu?{' '}
          <Link to={ROUTES.AUTH.LOGIN} className="font-semibold text-[#863bff] underline-offset-4 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <ForgotPasswordForm controller={controller} />
    </AuthShell>
  );
}

export { ForgotPasswordView };
