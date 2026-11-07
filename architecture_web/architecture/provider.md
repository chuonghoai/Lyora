# State Management & Store Layer (Zustand)

Trong kiến trúc ReactJS Web Client (`lyora_client` và `lyora_admin`), State Layer chịu trách nhiệm quản lý phiên làm việc của người dùng (Authentication) và đồng bộ dữ liệu với Backend.

## Phân định các loại State trong ứng dụng

1. **Local UI State:** Thuộc sở hữu của từng Component hoặc Custom Hook (quản lý bằng `useState`, `useReducer`, React Hook Form).
2. **Global Client State (Zustand):** Quản lý trạng thái phiên làm việc (Auth token, thông tin người dùng đăng nhập, quyền hạn).
3. **Server Cache State (TanStack Query):** Quản lý việc fetch, cache và revalidate dữ liệu từ backend API.

> **Lưu ý:** Dự án sử dụng một giao diện trực quan thống nhất và một ngôn ngữ Tiếng Việt duy nhất, không triển khai theme switcher (Light/Dark mode) hoặc language switcher trong Store.

## Trách nhiệm của Auth Store (Zustand Store)

- Lưu trữ trạng thái phiên xác thực (Token, Refresh Token, Thông tin User).
- Quản lý số lượng thông báo chưa đọc (Unread Count) cập nhật từ WebSocket.
- Đóng gói các hàm mutation/action toàn cục (ví dụ: `login`, `logout`).

## Cấu trúc mẫu chuẩn của Zustand Store

```typescript
// src/core/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'CLIENT';
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem('lyora_token', token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('lyora_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'lyora-auth-storage',
    }
  )
);
```

## Quy tắc DO / DON'T

**DO:**
- Tách các store theo domain rõ ràng: `useAuthStore`, `useNotificationStore`.
- Sử dụng selectors khi lấy dữ liệu từ Zustand để tránh re-render thừa (ví dụ: `const user = useAuthStore((s) => s.user)`).
- Đồng bộ lưu trữ token vào `localStorage` dưới key `lyora_token` để `apiClient` từ `@lyora/web-shared` tự động đính kèm vào Authorization header.

**DON'T:**
- **KHÔNG** đưa toàn bộ danh sách dữ liệu từ API vào Zustand. Hãy dùng TanStack Query.
- **KHÔNG** xây dựng theme switcher hoặc lưu trữ theme preference vì dự án áp dụng giao diện thống nhất.
- **KHÔNG** nhúng các logic i18n vào state store.
