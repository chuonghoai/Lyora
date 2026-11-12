import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/store/authStore';
import type { UserRole } from '@/core';
import { ROUTES } from '@/routes/paths';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  requireAuth?: boolean;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  requireAuth = false,
}) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.CLIENT.ROOT} replace />;
  }

  return <Outlet />;
};
