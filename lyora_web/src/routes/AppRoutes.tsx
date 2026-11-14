import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ClientLayout } from '@/ui/client/ClientLayout';
import { AdminLayout } from '@/ui/admin/AdminLayout';
import { RoleRoute, GuestRoute, LoadingSpinner } from '@/core';
import { ROUTES } from './paths';

const ClientHomeView = lazy(
  () => import('@/ui/client/home/HomeView'),
);
const AdminDashboardView = lazy(
  () => import('@/ui/admin/dashboard/DashboardView'),
);
const LoginView = lazy(
  () => import('@/ui/auth/login/LoginView'),
);
const RegisterView = lazy(
  () => import('@/ui/auth/register/RegisterView'),
);
const ForgotPasswordView = lazy(
  () => import('@/ui/auth/forgot-password/ForgotPasswordView'),
);

const PageLoader: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: ROUTES.AUTH.LOGIN,
    element: <GuestRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginView />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: ROUTES.AUTH.REGISTER,
    element: <GuestRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterView />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: ROUTES.AUTH.FORGOT_PASSWORD,
    element: <GuestRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordView />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: ROUTES.CLIENT.ROOT,
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClientHomeView />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: ROUTES.ADMIN.ROOT,
    element: <RoleRoute allowedRoles={['ADMIN']} requireAuth={true} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboardView />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};
