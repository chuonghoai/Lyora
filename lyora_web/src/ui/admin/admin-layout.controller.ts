import { useLocation } from 'react-router-dom';
import { useAuthStore, toast } from '@/core';

export function useAdminLayoutController() {
  const location = useLocation();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.info('Bạn đã đăng xuất khỏi trung tâm quản trị.');
  };

  return {
    location,
    appTitle,
    user,
    handleLogout,
  };
}

export type AdminLayoutController = ReturnType<typeof useAdminLayoutController>;

