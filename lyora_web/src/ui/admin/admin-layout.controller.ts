import { useLocation } from 'react-router-dom';
import { useAuthStore, toast } from '@/core';
import { useLogoutMutation } from '@/features/auth';

export function useAdminLayoutController() {
  const location = useLocation();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    if (logoutMutation.isPending) return;
    await logoutMutation.mutateAsync();
    toast.info('Bạn đã đăng xuất khỏi trung tâm quản trị.');
  };

  return {
    location,
    appTitle,
    user,
    isLoggingOut: logoutMutation.isPending,
    handleLogout,
  };
}

export type AdminLayoutController = ReturnType<typeof useAdminLayoutController>;

