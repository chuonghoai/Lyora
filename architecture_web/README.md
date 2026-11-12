# Kiến trúc Web Frontend Lyora (`lyora_web`)

Tài liệu này quy định toàn bộ tiêu chuẩn kiến trúc, quy tắc tổ chức mã nguồn và quy chuẩn kỹ thuật bắt buộc đối với ứng dụng Web Frontend hợp nhất (**`lyora_web`**) trong dự án Lyora Monorepo.

---

## 1. Tổng quan & Technology Stack

`lyora_web` là ứng dụng Web Frontend hợp nhất duy nhất của hệ thống Lyora, phục vụ đồng thời cho cả **Khách hàng (Client Portal)** và **Quản trị viên (Admin Portal)**.

- **Ngôn ngữ:** TypeScript 5.9+ (`strict: true`, `erasableSyntaxOnly: true`).
- **Core Framework:** React 19 + Vite 8.
- **Styling:** TailwindCSS v4 + Design Tokens chuẩn mực từ `DESIGN.md`.
- **Data Fetching & Cache:** TanStack React Query v5.
- **Client State Management:** Zustand v5 (Auth Store, Toast Store, WebSocket Store).
- **Validation:** Zod v4 (Schema & runtime validation).
- **Routing:** React Router v7 (`createBrowserRouter`, Lazy Loading, Route Guards).
- **HTTP Client:** Axios v1.13 với Interceptors tập trung (Auto Token Injection, 401 Refresh Queue).
- **Testing:** Vitest v5.
- **Linter:** ESLint v9 Flat Config.

---

## 2. Cấu trúc 4 Layer Phân Tách Tuyệt Đối

Cấu trúc mã nguồn trong `lyora_web/src` được phân chia thành 4 layer riêng biệt với ranh giới trách nhiệm rõ ràng:

```text
lyora_web/
├── src/
│   ├── core/                           # 1. CORE LAYER — Nền tảng hạ tầng dùng chung
│   │   ├── api/                        # Axios instance tập trung (apiClient), Interceptors, ApiError
│   │   ├── assets/                     # SVG icons & branding assets
│   │   ├── components/                 # UI primitives dùng chung (Button, Input, AppImage, LoadingSpinner)
│   │   ├── constants/                  # Hằng số toàn hệ thống (CORE_CONSTANTS, STORAGE_KEYS)
│   │   ├── guards/                     # Route Guards (RoleRoute, GuestRoute)
│   │   ├── hooks/                      # Custom hooks hạ tầng (useDebounce, useClickOutside)
│   │   ├── providers/                  # AppProviders (QueryClientProvider, ToastContainer, ErrorBoundary)
│   │   ├── storage/                    # StorageService & TokenStorage (Local/Session)
│   │   ├── store/                      # Zustand Stores (authStore)
│   │   ├── toast/                      # Toast notification system (toastStore, ToastContainer)
│   │   ├── types/                      # Common API types & interfaces (ApiResponse, ApiError)
│   │   ├── utils/                      # Logger, formatters (formatDate, formatCurrency)
│   │   ├── websocket/                  # WebSocketService & websocketStore
│   │   └── index.ts                    # Public barrel export (@core / @/core)
│   │
│   ├── features/                       # 2. DATA LAYER — Xử lý dữ liệu & giao tiếp Backend (Pure TS)
│   │   ├── auth/                       # Feature xác thực
│   │   │   ├── hooks/                  # TanStack Query hooks (*.query.ts) & Key Factory (*.keys.ts)
│   │   │   ├── models/                 # Zod validation schemas (loginSchema)
│   │   │   ├── repositories/           # Giao tiếp Backend qua Core apiClient
│   │   │   ├── services/               # Nghiệp vụ dữ liệu & TokenStorage
│   │   │   ├── types/                  # TypeScript types/DTOs
│   │   │   └── index.ts
│   │   ├── system/                     # Feature hệ thống & Health check
│   │   │   ├── hooks/                  # useSystemHealthQuery & systemKeys
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── user/                       # Feature thông tin người dùng
│   │   │   ├── hooks/                  # useUserProfileQuery & userKeys
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts                    # Public barrel export (@features / @/features)
│   │
│   ├── ui/                             # 3. UI VIEW LAYER — Giao diện & Điều khiển (View-Controller)
│   │   ├── admin/                      # Cổng Quản Trị
│   │   │   ├── AdminLayout.tsx         # Layout khung điều hướng Admin
│   │   │   ├── admin-layout.controller.ts # Controller cho AdminLayout
│   │   │   ├── dashboard/              # Flat submodule Dashboard
│   │   │   │   ├── DashboardView.tsx   # View trình diễn
│   │   │   │   └── dashboard.controller.ts # Controller điều phối
│   │   │   └── index.ts
│   │   ├── auth/                       # Phân hệ Xác Thực
│   │   │   ├── login/                  # Flat submodule Login
│   │   │   │   ├── LoginView.tsx       # View chính
│   │   │   │   ├── login.controller.ts # Controller điều phối form & mutation
│   │   │   │   └── LoginForm.tsx       # Subcomponent nhận controller trực tiếp
│   │   │   └── index.ts
│   │   ├── client/                     # Cổng Khách Hàng
│   │   │   ├── ClientLayout.tsx        # Layout khung điều hướng Client
│   │   │   ├── client-layout.controller.ts # Controller cho ClientLayout
│   │   │   ├── home/                   # Flat submodule Home
│   │   │   │   ├── HomeView.tsx        # View trình diễn
│   │   │   │   └── home.controller.ts  # Controller điều phối
│   │   │   └── index.ts
│   │   └── index.ts                    # Public barrel export (@ui / @/ui)
│   │
│   ├── routes/                         # 4. ROUTER LAYER — Định tuyến tập trung
│   │   ├── paths.ts                    # Hằng số đường dẫn (ROUTES)
│   │   └── AppRoutes.tsx               # createBrowserRouter, Lazy Loading, Role Guarding
│   │
│   ├── tests/                          # 5. TEST SUITES — Vitest Unit & Integration Tests
│   ├── App.tsx                         # Root Application Component
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Tailwind CSS & Global Typography
├── package.json
├── vite.config.ts                      # Aliases: @, @core, @features, @ui
└── tsconfig.app.json
```

---

## 3. Luồng Dữ Liệu Chuẩn Một Chiều (Data Flow)

```text
[UI View] (*View.tsx)
    │  Gọi controller 1 lần: `const controller = use...Controller()`
    ▼
[UI Controller] (*.controller.ts)
    │  Kích hoạt Query/Mutation hook
    ▼
[Data Layer Hook] (*.query.ts) ── (Query Key Factory *.keys.ts)
    │  Gọi Service tương ứng
    ▼
[Feature Service] (*.service.ts)
    │  Xử lý logic dữ liệu, gọi Repository
    ▼
[Feature Repository] (*.repository.ts)
    │  Gọi Core apiClient
    ▼
[Core API Client] (apiClient.ts)
    │  Gửi HTTP Request kèm Bearer Token
    ▼
[NestJS Backend API] (:3000/api)
```

---

## 4. Các Nguyên Tắc Kiến Trúc Bắt Buộc

1. **View-Controller Contract Thống Nhất:**
   - Mỗi View khởi tạo Controller đúng 1 lần: `const controller = use[ModuleName]Controller();`.
   - View truy cập state và gọi handlers trực tiếp qua object `controller.`: `controller.handleSubmit`, `controller.formData`, `controller.isLoading`.
   - View **KHÔNG destructure**, **KHÔNG định nghĩa lại handler**.
   - Subcomponent (như `LoginForm`) nhận trực tiếp `{ controller: LoginController }`.
2. **TanStack Query Thuộc Độc Quyền Về Data Layer (`features`):**
   - Mọi `useQuery`, `useMutation`, `useQueryClient` phải nằm trong `features/[module]/hooks/`.
   - File hook có hậu tố `*.query.ts`.
   - Query Key Factory có hậu tố `*.keys.ts`.
   - Cấu hình cache mặc định tại `AppProviders`: `staleTime: 10 phút` (600,000 ms), `gcTime: 15 phút` (900,000 ms).
3. **Cấu Trúc Flat Bên Trong Từng Submodule UI:**
   - Trong `src/ui/`, chỉ có đúng 3 module gốc: `admin`, `auth`, `client`.
   - Bên trong mỗi submodule, `*View.tsx`, `*.controller.ts` và subcomponents nằm phẳng cùng thư mục.
   - **Tuyệt đối KHÔNG** tạo các thư mục con `views/`, `controllers/`, `components/`.
4. **Data Layer Không Chứa UI:**
   - Thư mục `src/features/` là thuần TypeScript (`.ts`), **không chứa file `.tsx`**, không chứa JSX, không chứa component UI, không phụ thuộc vào `ui`.
5. **Giao Diện Thống Nhất & Tiếng Việt Chuẩn Mực:**
   - 100% văn bản hiển thị là Tiếng Việt trực tiếp, không sử dụng thư viện đa ngôn ngữ rườm rà.
   - Tuân thủ bảng màu và tokens trong `DESIGN.md` (Primary Blue `#2563eb`, Neutral slate). Không hỗ trợ chuyển đổi Light/Dark mode.

---

## 5. Danh Mục Tài Liệu Chi Tiết

- [View-Controller Architecture](architecture/controller.md)
- [Data Flow & TanStack Query](architecture/data_flow.md)
- [UI View Layer Rules](architecture/ui.md)
- [Service & Repository Pattern](architecture/service_repository.md)
- [Core State & Providers](architecture/provider.md)
- [Model & Type Definition](architecture/model.md)
- [Navigation & Route Guards](navigation/README.md)
- [Feature Development Workflow & DoD](feature-development/README.md)
