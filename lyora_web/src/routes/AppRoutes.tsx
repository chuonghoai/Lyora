import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom';
import { ClientLayout } from '@/ui/client/ClientLayout';
import { AdminLayout } from '@/ui/admin/AdminLayout';
import { RoleRoute, GuestRoute, LoadingSpinner, useAuthStore } from '@/core';
import { getClientProfilePath, ROUTES } from './paths';

const ClientHomeView = lazy(
  () => import('@/ui/client/home/HomeView'),
);
const ProfileView = lazy(
  () => import('@/ui/client/profile/ProfileView'),
);
const MessagesPage = lazy(
  () => import('@/ui/client/messages/MessagesPage'),
);
const FriendsView = lazy(
  () => import('@/ui/client/friends/FriendsView'),
);
const SearchResultsView = lazy(
  () => import('@/ui/client/search/SearchResultsView'),
);
const AdminDashboardView = lazy(
  () => import('@/ui/admin/dashboard/DashboardView'),
);
const AdminPostsView = lazy(
  () => import('@/ui/admin/posts/AdminPostsView'),
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

const LegacyProfileRedirect: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const currentUser = useAuthStore((s) => s.user);
  return <Navigate to={getClientProfilePath(userId, currentUser?.id)} replace />;
};

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
    element: <RoleRoute allowedRoles={['CLIENT']} requireAuth={true} />,
    children: [
      {
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
          {
            path: 'messages',
            element: (
              <Suspense fallback={<PageLoader />}>
                <MessagesPage />
              </Suspense>
            ),
          },
          {
            path: 'friends',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FriendsView />
              </Suspense>
            ),
          },
          {
            path: 'search',
            element: <Suspense fallback={<PageLoader />}><SearchResultsView /></Suspense>,
          },
          {
            path: 'profile',
            element: <LegacyProfileRedirect />,
          },
          {
            path: 'profile/:userId',
            element: <LegacyProfileRedirect />,
          },
          {
            path: ':userId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProfileView />
              </Suspense>
            ),
          },
        ],
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
          {
            path: 'posts',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminPostsView />
              </Suspense>
            ),
          },
          {
            path: '*',
            element: <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.CLIENT.ROOT} replace />,
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
