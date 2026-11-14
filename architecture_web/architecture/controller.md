# View-Controller Architecture & Integration Contract

Tài liệu này quy chuẩn cơ chế kết nối giữa **View** và **Controller** trong ứng dụng `lyora_web`.

---

## 1. Trách nhiệm phân định

### 1.1. Controller (`*.controller.ts`)
- **Vị trí:** Đặt cùng cấp thư mục với View trong từng submodule (ví dụ `src/ui/auth/login/login.controller.ts`).
- **Trách nhiệm:**
  - Quản lý toàn bộ UI state của màn hình (`formData`, `validationErrors`, `showPassword`, `isLoading`,...).
  - Điều phối các hành động của người dùng (submit, change, click, toggle).
  - Tích hợp các Query / Mutation Hooks từ Data Layer (`@features/[module]/hooks`).
  - Xử lý điều hướng trang (`useNavigate`, `useLocation`).
  - Tích hợp Toast notification và cập nhật Zustand store khi cần.
  - Expose một object thống nhất chứa states và handlers (tuân thủ tiền tố `handle...`).
- **Điều cấm (DON'T):**
  - **KHÔNG** chứa JSX/TSX.
  - **KHÔNG** gọi trực tiếp API client (`apiClient`) hoặc `axios`.
  - **KHÔNG** tự định nghĩa `useQuery`/`useMutation` (phải dùng hook từ Data Layer).
  - **KHÔNG** dùng `any`.

### 1.2. View (`*View.tsx`)
- **Vị trí:** Đặt cùng cấp thư mục với Controller (ví dụ `src/ui/auth/login/LoginView.tsx`).
- **Trách nhiệm:**
  - Khởi tạo Controller **đúng 1 lần**: `const controller = use[ModuleName]Controller();`.
  - Truy cập thuộc tính và phương thức trực tiếp qua object `controller.`:
    - `controller.formData`
    - `controller.isLoading`
    - `controller.handleSubmit`
    - `controller.handleFieldChange`
  - Render bố cục, typography, token styling từ `DESIGN.md`.
  - Truyền trực tiếp `controller` xuống component con (ví dụ: `<LoginForm controller={controller} />`).
- **Điều cấm (DON'T):**
  - **KHÔNG destructure** các hàm và state của controller ra nhiều biến rời rạc.
  - **KHÔNG định nghĩa lại handler** trong View (ví dụ: `const onSubmit = () => controller.handleSubmit()`).
  - **KHÔNG** gọi API, không gọi Service/Repository, không gọi TanStack Query hooks.

---

## 2. Chuẩn mực Code Mẫu

### 2.1. Controller mẫu (`login.controller.ts`)

```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation, loginSchema } from '@/features/auth';
import { useAuthStore, toast, isApiError, type ApiError } from '@/core';
import { ROUTES } from '@/routes/paths';

export function useLoginController() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Gọi Hook từ Data Layer
  const loginMutation = useLoginMutation({
    onSuccess: (session) => {
      const { accessToken, refreshToken, user } = session;
      setAuth({ accessToken, refreshToken }, user);
      toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName}.`);
      navigate(user.role === 'ADMIN' ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.ROOT, { replace: true });
    },
    onError: (err: unknown) => {
      const message = isApiError(err) ? err.message : 'Đăng nhập không thành công.';
      toast.error(message);
    },
  });

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      // mapping errors
      return;
    }
    await loginMutation.mutateAsync({ email: formData.email.trim(), password: formData.password });
  };

  return {
    // States
    formData,
    validationErrors,
    showPassword,
    isLoading: loginMutation.isPending,
    apiError: loginMutation.error as ApiError | null,

    // Handlers
    handleFieldChange,
    handleTogglePassword,
    handleSubmit,
  };
}

export type LoginController = ReturnType<typeof useLoginController>;
```

### 2.2. View mẫu (`LoginView.tsx`)

```tsx
import React from 'react';
import { LoginForm } from './LoginForm';
import { useLoginController } from './login.controller';

export default function LoginView(): React.ReactElement {
  const controller = useLoginController();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#0f172a]">Đăng nhập vào Lyora</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-8 rounded-2xl border border-[#cbd5e1]">
          {/* Truyền trực tiếp controller xuống subcomponent */}
          <LoginForm controller={controller} />
        </div>
      </div>
    </div>
  );
}
```

### 2.3. Subcomponent mẫu (`LoginForm.tsx`)

```tsx
import React from 'react';
import { Button, Input } from '@/core';
import type { LoginController } from './login.controller';

export interface LoginFormProps {
  controller: LoginController;
}

export const LoginForm: React.FC<LoginFormProps> = ({ controller }) => {
  return (
    <form onSubmit={controller.handleSubmit} noValidate className="space-y-4">
      {controller.apiError && (
        <div role="alert" className="p-3 text-red-700 bg-red-50 rounded-lg">
          {controller.apiError.message}
        </div>
      )}

      <Input
        label="Địa chỉ Email"
        name="email"
        type="email"
        value={controller.formData.email}
        onChange={controller.handleFieldChange}
        error={controller.validationErrors.email}
        required
      />

      <Input
        label="Mật khẩu"
        name="password"
        type={controller.showPassword ? 'text' : 'password'}
        value={controller.formData.password}
        onChange={controller.handleFieldChange}
        error={controller.validationErrors.password}
        required
      />

      <Button
        type="submit"
        variant="primary"
        isLoading={controller.isLoading}
        className="w-full"
      >
        Đăng nhập
      </Button>
    </form>
  );
};
```

---

## 3. Lợi ích kiến trúc
1. **IntelliSense 100%:** Khi gõ `controller.`, IDE tự động gợi ý toàn bộ danh sách states và handlers.
2. **Không phân mảnh handler:** Tránh việc phải destructure 10-15 biến riêng rẽ ở đầu View.
3. **Loại bỏ mapping trung gian:** Component con nhận trực tiếp kiểu `ReturnType<typeof use...Controller>`.
