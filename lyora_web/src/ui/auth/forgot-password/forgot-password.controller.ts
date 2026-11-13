import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  forgotPasswordEmailSchema,
  mapZodFieldErrors,
  otpSchema,
  resetPasswordSchema,
  useResetPasswordMutation,
  useSendForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
} from '@/features/auth';
import { isApiError, toast, type ApiError } from '@/core';
import { ROUTES } from '@/routes/paths';

export type ForgotPasswordStep = 'EMAIL' | 'OTP' | 'RESET';

export function useForgotPasswordController() {
  const navigate = useNavigate();

  const [step, setStep] = useState<ForgotPasswordStep>('EMAIL');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [resetToken, setResetToken] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtpMutation = useSendForgotPasswordOtpMutation({
    onSuccess: (res) => {
      setStep('OTP');
      setCooldown(res.cooldownSeconds || 60);
      toast.info(`Mã xác thực OTP đã được gửi đến ${res.email}`);
    },
    onError: (err: unknown) => {
      const message = isApiError(err)
        ? err.message
        : (err as Error)?.message || 'Gửi mã OTP không thành công';
      toast.error(message);
    },
  });

  const verifyOtpMutation = useVerifyForgotPasswordOtpMutation({
    onSuccess: (res) => {
      setResetToken(res.resetToken);
      setStep('RESET');
      toast.success('Mã xác thực chính xác! Vui lòng thiết lập mật khẩu mới.');
    },
    onError: (err: unknown) => {
      const message = isApiError(err)
        ? err.message
        : (err as Error)?.message || 'Xác thực mã OTP không thành công';
      toast.error(message);
    },
  });

  const resetPasswordMutation = useResetPasswordMutation({
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    },
    onError: (err: unknown) => {
      const message = isApiError(err)
        ? err.message
        : (err as Error)?.message || 'Đặt lại mật khẩu không thành công';
      toast.error(message);
    },
  });

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);

    setValidationErrors((prev) => {
      const errs = { ...prev };
      delete errs[name];

      const pwd = name === 'newPassword' ? value : next.newPassword;
      const confirm = name === 'confirmPassword' ? value : next.confirmPassword;
      if (confirm && pwd !== confirm) {
        errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
      } else {
        delete errs.confirmPassword;
      }

      return errs;
    });

    if (sendOtpMutation.error) sendOtpMutation.reset();
    if (verifyOtpMutation.error) verifyOtpMutation.reset();
    if (resetPasswordMutation.error) resetPasswordMutation.reset();
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (name === 'email') {
      const result = forgotPasswordEmailSchema.safeParse({ email: formData.email });
      if (!result.success) {
        const issue = result.error.issues.find((i) => String(i.path[0]) === name);
        if (issue) setValidationErrors((prev) => ({ ...prev, [name]: issue.message }));
      }
    } else if (name === 'newPassword' || name === 'confirmPassword') {
      const result = resetPasswordSchema.safeParse({
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      if (!result.success) {
        const issue = result.error.issues.find((i) => String(i.path[0]) === name);
        if (issue) setValidationErrors((prev) => ({ ...prev, [name]: issue.message }));
      }
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendOtpMutation.isPending) return;

    const result = forgotPasswordEmailSchema.safeParse({ email: formData.email });
    if (!result.success) {
      setValidationErrors(mapZodFieldErrors(result.error));
      return;
    }

    setValidationErrors({});
    try {
      await sendOtpMutation.mutateAsync({
        email: formData.email.trim(),
      });
    } catch {
      return;
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOtpMutation.isPending) return;

    const result = otpSchema.safeParse({ otp: formData.otp });
    if (!result.success) {
      setValidationErrors(mapZodFieldErrors(result.error));
      return;
    }

    setValidationErrors({});
    try {
      await verifyOtpMutation.mutateAsync({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
      });
    } catch {
      return;
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordMutation.isPending) return;

    const result = resetPasswordSchema.safeParse({
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      setValidationErrors(mapZodFieldErrors(result.error));
      return;
    }

    setValidationErrors({});
    try {
      await resetPasswordMutation.mutateAsync({
        email: formData.email.trim(),
        resetToken,
        newPassword: formData.newPassword,
      });
    } catch {
      return;
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || sendOtpMutation.isPending) return;
    try {
      await sendOtpMutation.mutateAsync({
        email: formData.email.trim(),
      });
    } catch {
      return;
    }
  };

  const handleBackToEmail = () => {
    setStep('EMAIL');
    setValidationErrors({});
    sendOtpMutation.reset();
    verifyOtpMutation.reset();
    resetPasswordMutation.reset();
  };

  const isLoading =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    resetPasswordMutation.isPending;

  const currentError = (sendOtpMutation.error ||
    verifyOtpMutation.error ||
    resetPasswordMutation.error) as ApiError | null;

  return {
    step,
    formData,
    resetToken,
    validationErrors,
    showPassword,
    cooldown,
    isLoading,
    apiError: currentError,
    handleFieldChange,
    handleFieldBlur,
    handleTogglePassword,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    handleResendOtp,
    handleBackToEmail,
  };
}

export type ForgotPasswordController = ReturnType<
  typeof useForgotPasswordController
>;
