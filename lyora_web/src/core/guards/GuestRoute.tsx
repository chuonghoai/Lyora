import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/store/authStore';
import { ROUTES } from '@/routes/paths';

export const GuestRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    if (user?.role === 'ADMIN') {
      const target =
        from && from.startsWith(ROUTES.ADMIN.ROOT) ? from : ROUTES.ADMIN.DASHBOARD;
      return <Navigate to={target} replace />;
    }

    const defaultTarget = ROUTES.CLIENT.ROOT;
    const target =
      from && !from.startsWith(ROUTES.ADMIN.ROOT) && from !== ROUTES.AUTH.LOGIN
        ? from
        : defaultTarget;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

