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
    if (from && from !== ROUTES.AUTH.LOGIN) {
      return <Navigate to={from} replace />;
    }
    const defaultTarget = user?.role === 'ADMIN' ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.ROOT;
    return <Navigate to={defaultTarget} replace />;
  }

  return <Outlet />;
};

