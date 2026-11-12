import { useLocation } from 'react-router-dom';
import { useAuthStore, toast } from '@/core';

export function useClientLayoutController() {
  const location = useLocation();
  const appTitle = import.meta.env.VITE_APP_TITLE || 'Lyora Platform';

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.info('Bạn đã đăng xuất khỏi hệ thống.');
  };

  return {
    location,
    appTitle,
    user,
    isAuthenticated,
    handleLogout,
  };
}

export type ClientLayoutController = ReturnType<typeof useClientLayoutController>;

