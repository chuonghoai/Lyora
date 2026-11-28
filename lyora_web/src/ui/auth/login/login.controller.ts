import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation, loginSchema, mapZodFieldErrors } from '@/features/auth';
import { isApiError, useAuthStore, toast, type ApiError } from '@/core';
import { ROUTES } from '@/routes/paths';

export interface LockedAccountNotice {
  lockReason: string;
  lockedAt: string | null;
}

export function extractLockedAccountNotice(error: unknown): LockedAccountNotice | null {
  if (!isApiError(error)) return null;
  if (error.code !== 'ACCOUNT_LOCKED') return null;

  const rawReason = error.details?.lockReason;
  const rawLockedAt = error.details?.lockedAt;

  return {
    lockReason:
      typeof rawReason === 'string' && rawReason.trim().length > 0
        ? rawReason.trim()
        : error.message || 'Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng.',
    lockedAt: typeof rawLockedAt === 'string' && rawLockedAt.trim() ? rawLockedAt : null,
  };
}

export function useLoginController() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [lockedAccountNotice, setLockedAccountNotice] = useState<LockedAccountNotice | null>(
    null,
  );

  const loginMutation = useLoginMutation({
    onSuccess: (session) => {
      setLockedAccountNotice(null);
      const { accessToken, refreshToken, user } = session;
      setAuth({ accessToken, refreshToken }, user, { rememberMe: formData.rememberMe });
      toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName}.`);

      const locationState = location.state as { from?: { pathname?: string } } | null;
      const targetFrom = locationState?.from?.pathname;

      if (user.role === 'ADMIN') {
        const adminTarget =
          targetFrom && targetFrom.startsWith(ROUTES.ADMIN.ROOT)
            ? targetFrom
            : ROUTES.ADMIN.DASHBOARD;
        navigate(adminTarget, { replace: true });
      } else {
        const clientTarget =
          targetFrom &&
          !targetFrom.startsWith(ROUTES.ADMIN.ROOT) &&
          targetFrom !== ROUTES.AUTH.LOGIN
            ? targetFrom
            : ROUTES.CLIENT.ROOT;
        navigate(clientTarget, { replace: true });
      }
    },
    onError: (err) => {
      const notice = extractLockedAccountNotice(err);
      if (notice) {
        setLockedAccountNotice(notice);
      }
    },
  });

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (loginMutation.error) {
      loginMutation.reset();
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setValidationErrors(mapZodFieldErrors(result.error));
      return;
    }

    setValidationErrors({});
    try {
      await loginMutation.mutateAsync({
        email: formData.email.trim(),
        password: formData.password,
      });
    } catch {
      return;
    }
  };

  const handleCloseLockedModal = () => {
    setLockedAccountNotice(null);
  };

  return {
    formData,
    validationErrors,
    showPassword,
    isLoading: loginMutation.isPending,
    apiError: loginMutation.error as ApiError | null,
    lockedAccountNotice,
    handleFieldChange,
    handleTogglePassword,
    handleSubmit,
    handleCloseLockedModal,
  };
}

export type LoginController = ReturnType<typeof useLoginController>;
