# Service, Repository & Data Layer Architecture (`lyora_web/src/features`)

Trong kiến trúc của `lyora_web`, toàn bộ việc giao tiếp với Backend NestJS và quản lý luồng dữ liệu được đóng gói trong **Data Layer (`src/features`)**.

---

## 1. Phân Tách Trách Nhiệm

```text
src/features/[feature]/
├── hooks/                      # TanStack Query hooks (*.query.ts) & Key Factory (*.keys.ts)
├── models/                     # Zod validation schemas (*.model.ts)
├── repositories/               # Trừu tượng hóa truy vấn HTTP (*.repository.ts)
├── services/                   # Nghiệp vụ dữ liệu & storage (*.service.ts)
├── types/                      # TypeScript DTOs & Interfaces (*.types.ts)
└── index.ts                    # Public Feature Export
```

### 1.1. Repository Layer (`*.repository.ts`)
- **Trách nhiệm:** Trừu tượng hóa việc giao tiếp mạng. Sử dụng `apiClient` từ `src/core/api` để gửi HTTP request lên Backend NestJS.
- **Quy tắc:**
  - Không chứa business logic.
  - Trả về Promise chứa `ApiResponse<T>`.
  - Luôn định nghĩa interface `I[Feature]Repository` để phục vụ mocking khi viết unit test.

```typescript
// src/features/auth/repositories/auth.repository.ts
import { apiClient, type ApiResponse } from '@/core';
import type { LoginCredentials, AuthResponseDto } from '../types/auth.types';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponseDto>>;
}

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponseDto>> {
    return apiClient.post('/auth/login', credentials);
  }
}

export const authRepository = new AuthRepository();
```

### 1.2. Service Layer (`*.service.ts`)
- **Trách nhiệm:**
  - Tiếp nhận dữ liệu từ Repository.
  - Xử lý business rules phía client (ví dụ: giải mã session, lưu trữ tokens vào `TokenStorage`).
  - Định nghĩa interface `I[Feature]Service`.
- **Quy tắc:**
  - Không chứa JSX/TSX.
  - Không import router hooks (`useNavigate`).
  - Là pure TypeScript module.

```typescript
// src/features/auth/services/auth.service.ts
import { TokenStorage } from '@/core';
import { authRepository, type IAuthRepository } from '../repositories/auth.repository';
import type { LoginCredentials, AuthSession } from '../types/auth.types';

export class AuthService {
  private repository: IAuthRepository;

  constructor(repository: IAuthRepository = authRepository) {
    this.repository = repository;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await this.repository.login(credentials);
    const { accessToken, refreshToken, user } = response.data;
    TokenStorage.saveAuthSession(accessToken, refreshToken, user);
    return { accessToken, refreshToken, user };
  }
}

export const authService = new AuthService();
```

### 1.3. Hooks Layer (`*.query.ts`)
- **Trách nhiệm:** Đóng gói `useQuery` và `useMutation` của TanStack Query.
- **Quy tắc:**
  - Gọi Service tương ứng.
  - Kích hoạt cache invalidation qua Query Key Factory.
  - Không đặt trong `ui/`.

---

## 2. Core API Client (`src/core/api/apiClient.ts`)

- **Base URL:** `/` (proxy chuyển tiếp tới `http://localhost:3000` qua cấu hình Vite `vite.config.ts`).
- **Request Interceptor:** Tự động lấy Access Token từ `TokenStorage.getAccessToken()` và gán vào header `Authorization: Bearer <token>`.
- **Response Interceptor:** Trích xuất `response.data`.
- **401 Refresh Token Queue:** Khi nhận HTTP 401, tự động giữ các request đồng thời vào hàng đợi, gọi API `/auth/refresh`, cập nhật token mới và replay lại các request đang chờ một cách mượt mà mà không làm gián đoạn phiên người dùng.
