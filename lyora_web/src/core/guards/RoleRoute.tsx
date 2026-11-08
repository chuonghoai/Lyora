import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/authStore';
import type { UserRole } from '@shared';
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

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={ROUTES.CLIENT.ROOT} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.CLIENT.ROOT} replace />;
  }

  return <Outlet />;
};
