import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/store/authStore';
import { toast } from '@/core/toast';
import type { UserRole } from '@/core/types';
import { ROUTES } from '@/routes/paths';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  requireAuth?: boolean;
}

export type RoleAccessDecision =
  | { allowed: true }
  | { allowed: false; redirectTo: string; reason: 'UNAUTHENTICATED' | 'FORBIDDEN'; warningMessage?: string };

export function resolveRoleAccess(params: {
  isAuthenticated: boolean;
  userRole?: UserRole | null;
  allowedRoles: UserRole[];
  requireAuth: boolean;
}): RoleAccessDecision {
  const { isAuthenticated, userRole, allowedRoles, requireAuth } = params;

  if (requireAuth && (!isAuthenticated || !userRole)) {
    return {
      allowed: false,
      redirectTo: ROUTES.AUTH.LOGIN,
      reason: 'UNAUTHENTICATED',
    };
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    if (userRole === 'ADMIN') {
      return {
        allowed: false,
        redirectTo: ROUTES.ADMIN.DASHBOARD,
        reason: 'FORBIDDEN',
      };
    }

    return {
      allowed: false,
      redirectTo: ROUTES.CLIENT.ROOT,
      reason: 'FORBIDDEN',
      warningMessage: 'Bạn không có quyền truy cập trang quản trị.',
    };
  }

  return { allowed: true };
}

const ForbiddenRedirect: React.FC<{ to: string; warningMessage?: string }> = ({
  to,
  warningMessage,
}) => {
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (warningMessage && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.warning(warningMessage);
    }
  }, [warningMessage]);

  return <Navigate to={to} replace />;
};

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  requireAuth = false,
}) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  const decision = resolveRoleAccess({
    isAuthenticated,
    userRole: user?.role,
    allowedRoles,
    requireAuth,
  });

  if (!decision.allowed) {
    if (decision.reason === 'UNAUTHENTICATED') {
      return <Navigate to={decision.redirectTo} state={{ from: location }} replace />;
    }
    return <ForbiddenRedirect to={decision.redirectTo} warningMessage={decision.warningMessage} />;
  }

  return <Outlet />;
};
