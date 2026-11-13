import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  mapZodFieldErrors,
  otpSchema,
  registerStep1Schema,
  useRegisterMutation,
  useSendRegisterOtpMutation,
} from '@/features/auth';
import { isApiError, toast, useAuthStore, type ApiError } from '@/core';
import { ROUTES } from '@/routes/paths';

export type RegisterStep = 'FORM' | 'OTP';

export function useRegisterController() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<RegisterStep>('FORM');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

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

  const sendOtpMutation = useSendRegisterOtpMutation({
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

  const registerMutation = useRegisterMutation({
    onSuccess: (session) => {
      const { accessToken, refreshToken, user } = session;
      setAuth({ accessToken, refreshToken }, user);
      toast.success(`Đăng ký tài khoản thành công! Chào mừng ${user.fullName}.`);
      navigate(ROUTES.CLIENT.ROOT, { replace: true });
    },
    onError: (err: unknown) => {
      const message = isApiError(err)
        ? err.message
        : (err as Error)?.message || 'Đăng ký không thành công';
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

      const pwd = name === 'password' ? value : next.password;
      const confirm = name === 'confirmPassword' ? value : next.confirmPassword;
      if (confirm && pwd !== confirm) {
        errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
      } else {
        delete errs.confirmPassword;
      }

      return errs;
    });

    if (sendOtpMutation.error) sendOtpMutation.reset();
    if (registerMutation.error) registerMutation.reset();
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const result = registerStep1Schema.safeParse(formData);
    if (!result.success) {
      const issue = result.error.issues.find((i) => String(i.path[0]) === name);
      if (issue) {
        setValidationErrors((prev) => ({ ...prev, [name]: issue.message }));
      }
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendOtpMutation.isPending) return;

    const result = registerStep1Schema.safeParse(formData);
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
    if (registerMutation.isPending) return;

    const result = otpSchema.safeParse({ otp: formData.otp });
    if (!result.success) {
      setValidationErrors(mapZodFieldErrors(result.error));
      return;
    }

    setValidationErrors({});
    try {
      await registerMutation.mutateAsync({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        otp: formData.otp.trim(),
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

  const handleBackToForm = () => {
    setStep('FORM');
    setValidationErrors({});
    sendOtpMutation.reset();
    registerMutation.reset();
  };

  const isLoading = sendOtpMutation.isPending || registerMutation.isPending;
  const currentError = (sendOtpMutation.error || registerMutation.error) as ApiError | null;

  return {
    step,
    formData,
    validationErrors,
    showPassword,
    cooldown,
    isLoading,
    apiError: currentError,
    handleFieldChange,
    handleFieldBlur,
    handleTogglePassword,
    handleSubmitStep1,
    handleVerifyOtp,
    handleResendOtp,
    handleBackToForm,
  };
}

export type RegisterController = ReturnType<typeof useRegisterController>;
