# Model & Type Definition Layer (`lyora_web`)

Trong ứng dụng `lyora_web`, Model và Type được định nghĩa bên trong **Data Layer (`src/features/[feature]/`)** nhằm đảm bảo tính độc lập và phân vùng rõ ràng theo domain nghiệp vụ.

---

## 1. Cấu Trúc File Chuẩn

Mỗi feature trong `src/features/[feature]/` bao gồm 2 file cốt lõi:
- **`types/[feature].types.ts`:** Chứa toàn bộ interfaces, DTOs (Data Transfer Objects), Enums, và ApiResponse types.
- **`models/[feature].model.ts`:** Chứa Zod validation schemas và TypeScript types suy luận từ schema (`z.infer<typeof schema>`).

---

## 2. Mã Mẫu Chuẩn

### 2.1. Domain Types & DTOs (`src/features/auth/types/auth.types.ts`)

```typescript
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CLIENT';
  avatarUrl?: string;
  isActive?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

### 2.2. Zod Validation Model (`src/features/auth/models/auth.model.ts`)

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

---

## 3. Quy Tắc Bắt Buộc

1. **Đồng bộ hóa với Backend NestJS:** Kiểu dữ liệu Request DTO và Response DTO phải khớp 100% với DTO của Backend (`lyora_backend`).
2. **Không dùng `any`:** Định nghĩa kiểu rõ ràng cho mọi property và parameter. Sử dụng `unknown` nếu dữ liệu cần parse runtime.
3. **Phân biệt Types vs Models:**
   - `types/`: Thuần type definitions (TypeScript interfaces, types, enums).
   - `models/`: Chứa executable runtime logic như Zod validation schemas.
