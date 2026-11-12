# Core State Management & Infrastructure Providers (`lyora_web`)

Tài liệu này quy chuẩn việc quản lý trạng thái toàn cục và các Providers hạ tầng trong `lyora_web`.

---

## 1. Phân Định Các Loại Trạng Thái

1. **Server Cache State (TanStack Query):**
   - Quản lý việc truy vấn, lưu cache và đồng bộ dữ liệu từ Backend.
   - Toàn bộ hook nằm trong `src/features/[feature]/hooks/`.
2. **Global Client State (Zustand Stores):**
   - Quản lý phiên làm việc của người dùng (`authStore`).
   - Quản lý thông báo toast tức thời (`toastStore`).
   - Quản lý kết nối socket thời gian thực (`websocketStore`).
3. **Local UI State (React useState / useRef):**
   - Quản lý đóng mở modal, focus, form input tạm thời.
   - Nằm bên trong UI Controller (`*.controller.ts`).

---

## 2. Global Providers (`src/core/providers/AppProviders.tsx`)

Mọi Provider hạ tầng được bọc tập trung tại `AppProviders`:

```tsx
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@/core/toast';
import { ErrorBoundary } from './ErrorBoundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 phút mặc định
            gcTime: 15 * 60 * 1000,    // 15 phút giải phóng bộ nhớ
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
```

---

## 3. Zustand Auth Store (`src/core/store/authStore.ts`)

- Lưu trữ trạng thái xác thực (`user`, `tokens`, `isAuthenticated`).
- Đồng bộ với `TokenStorage` (LocalStorage / SessionStorage).
- Cung cấp selectors để tránh re-render thừa:
  ```typescript
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  ```

---

## 4. Toast System (`src/core/toast/`)

- Cung cấp API phát thông báo đơn giản, không phụ thuộc UI:
  ```typescript
  import { toast } from '@/core';

  toast.success('Đăng nhập thành công!');
  toast.error('Có lỗi xảy ra, vui lòng thử lại.');
  toast.info('Hệ thống đang bảo trì.');
  ```
- Component `ToastContainer` tự động render góc trên màn hình với animation mượt mà.
