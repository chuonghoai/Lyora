# Data Flow & State Management (`lyora_web`)

Ứng dụng `lyora_web` tuân thủ mô hình **Luồng dữ liệu một chiều (Unidirectional Data Flow)** kết hợp phân tầng nghiêm ngặt giữa View Layer, Data Layer, Core Hạ tầng và Backend NestJS.

---

## 1. Sơ đồ tuần tự hoàn chỉnh (Sequence Diagram)

```mermaid
sequenceDiagram
    participant V as UI View (*View.tsx)
    participant C as UI Controller (*.controller.ts)
    participant Q as Data Layer Hook (*.query.ts)
    participant S as Feature Service (*.service.ts)
    participant R as Feature Repository (*.repository.ts)
    participant A as Core API Client (apiClient.ts)
    participant B as NestJS Backend API (:3000)

    V->>C: Kích hoạt Controller: `const controller = use...Controller()`
    V->>C: Hành động người dùng: `controller.handleSubmit(e)`
    C->>C: Validate form dữ liệu (Zod Schema)
    C->>Q: Gọi Query/Mutation Hook (`useLoginMutation`)
    Q->>S: Gọi Service (`authService.login(credentials)`)
    S->>R: Gọi Repository (`authRepository.login(credentials)`)
    R->>A: Gửi HTTP Request qua Core Client (`apiClient.post('/auth/login', ...)`)
    A->>B: Gửi HTTP Request kèm Bearer Token (nếu có)
    B-->>A: Trả về HTTP Response (ApiResponse<T>)
    A-->>R: Interceptor bóc tách payload / chuẩn hóa ApiError
    R-->>S: Trả về Domain DTO
    S->>S: Lưu token & session vào TokenStorage
    S-->>Q: Trả về Session Data
    Q->>Q: Tự động Invalidate Cache theo Query Key Factory (`authKeys.session()`)
    Q-->>C: Hook thông báo thành công (onSuccess)
    C->>C: Cập nhật Zustand Store (`useAuthStore`)
    C->>C: Hiển thị Toast thông báo (`toast.success`)
    C->>V: Điều hướng router (`navigate('/...')`)
    V-->>V: Render giao diện mới
```

---

## 2. Chiến lược Cache & Invalidation (TanStack Query)

### 2.1. Cấu hình Cache Mặc định (AppProviders)
Tất cả các truy vấn dữ liệu được cấu hình tập trung trong [AppProviders.tsx](file:///d:/study/ute/4%20-%20HK1/CongNghePhanMemMoi/Project/Lyora/lyora_web/src/core/providers/AppProviders.tsx):

- **`staleTime: 10 phút` (600,000 ms):** Dữ liệu được coi là mới (fresh) trong 10 phút. Trong thời gian này, các component truy cập lại query sẽ nhận ngay dữ liệu từ memory mà không phát sinh thêm HTTP request lên backend.
- **`gcTime: 15 phút` (900,000 ms):** Thời gian lưu giữ dữ liệu không sử dụng trong bộ nhớ trước khi giải phóng (Garbage Collection).
- **`retry: 1`:** Tự động thử lại 1 lần nếu gặp sự cố mạng gián đoạn.
- **`refetchOnWindowFocus: false`:** Không tự động refetch khi người dùng chuyển qua lại giữa các tab trình duyệt.

### 2.2. Query Key Factories (`*.keys.ts`)
Tuyệt đối không hardcode chuỗi query key trong codebase. Mỗi feature trong Data Layer phải có một Query Key Factory phân cấp:

```typescript
// src/features/auth/hooks/auth.keys.ts
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// src/features/system/hooks/system.keys.ts
export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
};
```

### 2.3. Cache Invalidation
Khi mutation làm thay đổi dữ liệu, sử dụng Query Key Factory để làm mới cache chính xác:
```typescript
queryClient.invalidateQueries({ queryKey: authKeys.session() });
```
