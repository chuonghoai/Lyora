import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation, loginSchema, mapZodFieldErrors } from '@/features/auth';
import { useAuthStore, toast, isApiError, type ApiError } from '@/core';
import { ROUTES } from '@/routes/paths';

export function useLoginController() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLoginMutation({
    onSuccess: (session) => {
      const { accessToken, refreshToken, user } = session;
      setAuth({ accessToken, refreshToken }, user);
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
    onError: (err: unknown) => {
      const message = isApiError(err)
        ? err.message
        : (err as Error)?.message || 'Đăng nhập không thành công. Vui lòng thử lại!';
      toast.error(message);
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

  return {
    formData,
    validationErrors,
    showPassword,
    isLoading: loginMutation.isPending,
    apiError: loginMutation.error as ApiError | null,
    handleFieldChange,
    handleTogglePassword,
    handleSubmit,
  };
}

export type LoginController = ReturnType<typeof useLoginController>;
