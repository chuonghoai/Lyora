import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoadingSpinner } from '@shared';
import { ROUTES } from './paths';

const ClientHomePage = lazy(
  () => import('@/features/client/pages/ClientHomePage'),
);
const AdminDashboardPage = lazy(
  () => import('@/features/admin/pages/AdminDashboardPage'),
);

const PageLoader: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: ROUTES.CLIENT.ROOT,
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ClientHomePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: ROUTES.ADMIN.ROOT,
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboardPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};
