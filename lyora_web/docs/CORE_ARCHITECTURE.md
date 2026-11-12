# Tài liệu Kiến trúc Web Frontend Lyora (`lyora_web`)

Tài liệu này cung cấp tiêu chuẩn kiến trúc, phân tách trách nhiệm 4 tầng (Layer Separation) và hướng dẫn phát triển của ứng dụng Web Frontend hợp nhất `lyora_web`.

---

## 1. Mô hình Phân tách Kiến trúc 4 Tầng (Layered Architecture)

Mã nguồn tại `lyora_web/src` được phân chia thành 4 khối với ranh giới trách nhiệm và chiều phụ thuộc (Dependency Direction) nghiêm ngặt:

```text
┌────────────────────────────────────────────────────────┐
│                   ROUTES LAYER                         │
│   (Khai báo Router, Route Guards, Code Splitting)      │
└───────────────────────────┬────────────────────────────┘
                            │ imports
┌───────────────────────────▼────────────────────────────┐
│                  UI VIEW LAYER (ui/)                   │
│   (Views, Components, Controllers, UI State, Layouts)   │
└───────────────┬────────────────────────┬───────────────┘
                │ calls                  │ uses primitives
┌───────────────▼──────────────┐ ┌───────▼───────────────┐
│     DATA LAYER (features/)   │ │                       │
│  (Repositories, Services,    │ │     CORE LAYER        │
│   Domain Models, Schemas)    │ │      (core/)          │
└───────────────┬──────────────┘ │                       │
                │ uses           │ (API Client, Storage, │
                │ API Client     │  WebSocket, Toast,    │
                └────────────────►  Types, Constants)    │
                                 └───────────────────────┘
```

### Chiều Phụ thuộc (Dependency Direction):
- `routes`: Phụ thuộc vào `ui` và `core`.
- `ui`: Phụ thuộc vào `features` (Data Layer) và `core` (UI primitives). **Tuyệt đối không gọi API trực tiếp, không import `apiClient`**.
- `features`: Phụ thuộc vào `core` (API Client, Storage, Types). **Tuyệt đối không phụ thuộc vào `ui`, không chứa JSX/TSX**.
- `core`: Độc lập hoàn toàn, **tuyệt đối không phụ thuộc vào `features` hoặc `ui`**.

---

## 2. Cấu trúc Thư mục

```text
lyora_web/
├── docs/
│   └── CORE_ARCHITECTURE.md       # Tài liệu kiến trúc và hướng dẫn phát triển
├── public/
├── src/
│   ├── core/                      # 1. CORE LAYER (@core)
│   │   ├── api/                   # apiClient & createApiClient
│   │   ├── assets/                # Logo SVG & biểu tượng thương hiệu
│   │   ├── components/            # UI Primitives (Button, Input, LoadingSpinner, AppImage)
│   │   ├── constants/             # CORE_CONSTANTS (Endpoints, Keys, Phone)
│   │   ├── guards/                # RoleRoute, GuestRoute
│   │   ├── hooks/                 # useDebounce, useClickOutside
│   │   ├── providers/             # AppProviders, ErrorBoundary
│   │   ├── storage/               # storageService, tokenStorage
│   │   ├── store/                 # authStore
│   │   ├── toast/                 # toast, toastStore, ToastContainer
│   │   ├── types/                 # ApiResponse, ApiError, UserProfile, UserRole
│   │   ├── utils/                 # logger, formatters (formatDate, formatCurrency)
│   │   ├── websocket/             # WebSocketService, websocketStore
│   │   └── index.ts               # Master Core Export
│   │
│   ├── features/                  # 2. DATA LAYER (@features) - 100% Pure TypeScript
│   │   ├── auth/                  # Nghiệp vụ dữ liệu xác thực
│   │   │   ├── models/            # auth.model.ts (loginSchema, LoginFormData)
│   │   │   ├── repositories/      # auth.repository.ts (gọi apiClient)
│   │   │   ├── services/          # auth.service.ts (business logic & token storage)
│   │   │   ├── types/             # auth.types.ts (LoginCredentials, AuthSession)
│   │   │   └── index.ts
│   │   ├── system/                # Nghiệp vụ dữ liệu trạng thái hệ thống
│   │   │   ├── repositories/      # system.repository.ts (checkHealth)
│   │   │   ├── services/          # system.service.ts
│   │   │   ├── types/             # system.types.ts (HealthStatus)
│   │   │   └── index.ts
│   │   ├── user/                  # Nghiệp vụ dữ liệu người dùng
│   │   │   ├── repositories/      # user.repository.ts
│   │   │   ├── services/          # user.service.ts
│   │   │   ├── types/             # user.types.ts
│   │   │   └── index.ts
│   │   └── index.ts               # Master Features Export
│   │
│   ├── ui/                        # 3. UI VIEW LAYER (@ui) - React Presentation
│   │   ├── admin/                 # Giao diện Trung tâm Quản trị
│   │   │   ├── controllers/       # useAdminDashboardController.ts
│   │   │   ├── views/             # AdminDashboardView.tsx
│   │   │   └── index.ts
│   │   ├── auth/                  # Giao diện Xác thực
│   │   │   ├── components/        # LoginForm.tsx
│   │   │   ├── controllers/       # useLoginController.ts
│   │   │   ├── views/             # LoginView.tsx
│   │   │   └── index.ts
│   │   ├── client/                # Giao diện Cổng Khách hàng
│   │   │   ├── controllers/       # useClientHomeController.ts
│   │   │   ├── views/             # ClientHomeView.tsx
│   │   │   └── index.ts
│   │   ├── layouts/               # Layouts
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── ClientLayout.tsx
│   │   │   └── index.ts
│   │   └── index.ts               # Master UI Export
│   │
│   ├── routes/                    # 4. ROUTING LAYER
│   │   ├── AppRoutes.tsx          # React Router tập trung kết nối Views
│   │   └── paths.ts               # Danh mục định tuyến (ROUTES)
│   │
│   ├── tests/                     # 5. TEST SUITE (Vitest)
│   │   ├── apiClient.test.ts
│   │   ├── authService.test.ts
│   │   ├── liveApi.test.ts
│   │   ├── loginSchema.test.ts
│   │   ├── storage.test.ts
│   │   ├── toast.test.ts
│   │   ├── tokenStorage.test.ts
│   │   └── websocket.test.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── eslint.config.js
├── package.json
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Quy định Phân tách và Luồng Dữ liệu Chuẩn

```text
User Interaction (Click submit / input)
       │
       ▼
   UI Component (LoginForm.tsx)
       │
       ▼
  UI Controller (useLoginController.ts)
       │ (calls authService.login(credentials))
       ▼
  Feature Service (auth.service.ts)
       │ (calls authRepository.login(credentials))
       ▼
  Feature Repository (auth.repository.ts)
       │ (calls apiClient.post('/auth/login', credentials))
       ▼
   Core API Client (apiClient.ts)
       │ (handles Bearer token, interceptors, refresh storm guard)
       ▼
     Backend NestJS API (:3000/api)
```

---

## 4. Hướng dẫn Phát triển Feature Mới

Khi triển khai một tính năng mới (ví dụ: `products`):

1. **Bước 1: Xây dựng Data Layer tại `src/features/products/`**:
   - `types/product.types.ts`: Định nghĩa interface `Product`, `CreateProductDto`.
   - `repositories/product.repository.ts`: Viết class gọi `apiClient.get('/products')`, `apiClient.post(...)`.
   - `services/product.service.ts`: Xử lý business rules, mapping dữ liệu.
   - `index.ts`: Export service và types.

2. **Bước 2: Xây dựng UI Layer tại `src/ui/products/`**:
   - `controllers/useProductListController.ts`: Quản lý query state (page, search), gọi `productService.getProducts()`.
   - `components/ProductCard.tsx`: Trình bày thẻ sản phẩm, dùng `AppImage`, `Button` từ `@core`.
   - `views/ProductListView.tsx`: Ghép nối các component.
   - `index.ts`: Export view.

3. **Bước 3: Khai báo Routing tại `src/routes/`**:
   - Thêm đường dẫn vào `paths.ts`.
   - Khai báo lazy route trong `AppRoutes.tsx`.

---

## 5. Các Lệnh Thực thi Dự án

```powershell
# Chạy ứng dụng phát triển
npm run web:dev

# Chạy kiểm thử tự động
npm run web:test

# Chạy kiểm tra quy chuẩn mã nguồn ESLint
npm run web:lint

# Chạy kiểm tra TypeScript và Build Production
npm run web:build
```
