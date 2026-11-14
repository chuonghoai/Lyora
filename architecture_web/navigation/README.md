# Routing & Navigation Architecture (`lyora_web/src/routes`)

Hệ thống định tuyến của `lyora_web` được quản lý tập trung bằng **React Router v7** (`createBrowserRouter`), hỗ trợ phân tách bundle theo màn hình (Code Splitting qua `React.lazy`), bảo vệ tuyến đường theo phân quyền (Route Guards), và gắn kết Layout điều hướng chuẩn mực.

---

## 1. Cấu Trúc File Định Tuyến

```text
src/routes/
├── paths.ts                    # Hằng số định danh URL (ROUTES)
└── AppRoutes.tsx               # Cấu hình Router, Guards & Lazy Loading
```

---

## 2. Hằng Số Đường Dẫn (`paths.ts`)

Mọi đường dẫn trong ứng dụng bắt buộc phải được khai báo trong `ROUTES` object, **tuyệt đối không hardcode chuỗi URL** trong UI hay Controller:

```typescript
export const ROUTES = {
  AUTH: {
    ROOT: '/auth',
    LOGIN: '/auth/login',
  },
  CLIENT: {
    ROOT: '/',
    HOME: '/',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
  },
} as const;
```

---

## 3. Cấu Trúc Router & Route Guards (`AppRoutes.tsx`)

```tsx
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ClientLayout } from '@/ui/client/ClientLayout';
import { AdminLayout } from '@/ui/admin/AdminLayout';
import { RoleRoute, GuestRoute, LoadingSpinner } from '@/core';
import { ROUTES } from './paths';

// Code Splitting qua React.lazy
const ClientHomeView = lazy(() => import('@/ui/client/home/HomeView'));
const AdminDashboardView = lazy(() => import('@/ui/admin/dashboard/DashboardView'));
const LoginView = lazy(() => import('@/ui/auth/login/LoginView'));

export const router = createBrowserRouter([
  // 1. Tuyến Guest (Chưa đăng nhập)
  {
    path: ROUTES.AUTH.LOGIN,
    element: <GuestRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LoginView />
          </Suspense>
        ),
      },
    ],
  },
  // 2. Tuyến Cổng Khách Hàng (Công khai / Khách hàng)
  {
    path: ROUTES.CLIENT.ROOT,
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ClientHomeView />
          </Suspense>
        ),
      },
    ],
  },
  // 3. Tuyến Cổng Quản Trị (Bảo vệ bởi RoleRoute)
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
              <Suspense fallback={<LoadingSpinner />}>
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
```

---

## 4. Các Loại Route Guards
1. **`GuestRoute` (`src/core/guards/GuestRoute.tsx`):**
   - Dành riêng cho màn hình đăng nhập.
   - Nếu người dùng đã đăng nhập thành công, tự động chuyển hướng về trang tương ứng theo vai trò (`/admin/dashboard` cho Admin hoặc `/` cho Client).
2. **`RoleRoute` (`src/core/guards/RoleRoute.tsx`):**
   - Bảo vệ các tuyến đường yêu cầu quyền hạn cao (`ADMIN`).
   - Nếu chưa đăng nhập: Tự động lưu `location.pathname` hiện tại vào `state.from` và redirect về `/auth/login`.
   - Nếu đã đăng nhập nhưng không đủ quyền: Redirect an toàn về `/` và phát toast cảnh báo.
