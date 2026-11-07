# Danh Mục Các File Dự Án Cần Khởi Tạo & Quản Lý (Required Project Files)

**Thời gian cập nhật:** 2026-11-07  
**Dự án:** Lyora Monorepo (`lyora_backend`, `lyora_client`, `lyora_admin`, `lyora_web_shared`)  
**Tình trạng:** Khảo sát và chuẩn hóa sau Đợt 2 Refactor kiến trúc (loại bỏ i18n, Dark/Light mode, `testapi.ps1`, chuẩn hóa 3 dự án độc lập + 1 shared workspace).

---

## 1. Bảng tổng hợp trạng thái các file dự án trong Monorepo

| STT | Phân vùng | Đường dẫn file | Mục đích & Trách nhiệm | Trạng thái hiện tại | Phân loại |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | **Root** | `package.json` | Cấu hình Monorepo Workspaces (`lyora_backend`, `lyora_client`, `lyora_admin`, `lyora_web_shared`) và 14 scripts điều phối. | **Đã tạo & hoạt động** | Cấu hình Monorepo |
| 2 | **Root** | `.gitignore` | Bỏ qua các file build artifacts, dependencies, `.env` thực tế và file tạm. | **Đã tạo & hoạt động** | Cấu hình Git |
| 3 | **Root** | `DESIGN.md` | Hệ thống Design Tokens tập trung (Màu sắc thương hiệu, Typography, Spacing, Shadows, Border-radius) cho một theme duy nhất. | **Đã tạo & hoạt động** | Design System |
| 4 | **lyora_web_shared** | `lyora_web_shared/package.json` | Khai báo package name `@lyora/web-shared`, exports, scripts và peer dependencies. | **Đã tạo & hoạt động** | Cấu hình Workspace |
| 5 | **lyora_web_shared** | `lyora_web_shared/tsconfig.json` | Cấu hình TypeScript compiler cho thư viện chia sẻ frontend. | **Đã tạo & hoạt động** | Cấu hình TypeScript |
| 6 | **lyora_web_shared** | `lyora_web_shared/eslint.config.js` | Base ESLint Flat Config (`sharedEslintConfig`) dùng chung cho cả `lyora_client` và `lyora_admin`. | **Đã tạo & hoạt động** | Cấu hình Linting |
| 7 | **lyora_web_shared** | `lyora_web_shared/.env` | File biến môi trường cục bộ để Vite của cả hai frontend đọc trực tiếp qua `envDir: '../lyora_web_shared'`. | **Đã tạo & hoạt động** | Cấu hình Môi trường |
| 9 | **lyora_web_shared** | `lyora_web_shared/src/types/api.types.ts` | Khai báo các interface API contract chung (`ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `UserRole`). | **Đã tạo & hoạt động** | Core Types |
| 10 | **lyora_web_shared** | `lyora_web_shared/src/api/apiClient.ts` | Axios instance tập trung với Request/Response Interceptor chuẩn hóa lỗi và gắn Bearer token. | **Đã tạo & hoạt động** | Network Layer |
| 11 | **lyora_web_shared** | `lyora_web_shared/src/components/Button.tsx` | Component Button dùng chung với các biến thể (primary, secondary, danger, outline). | **Đã tạo & hoạt động** | Reusable UI |
| 12 | **lyora_web_shared** | `lyora_web_shared/src/components/Input.tsx` | Component Input dùng chung với nhãn label, placeholder và render thông báo lỗi. | **Đã tạo & hoạt động** | Reusable UI |
| 13 | **lyora_web_shared** | `lyora_web_shared/src/components/LoadingSpinner.tsx` | Spinner hiển thị trạng thái chờ tải dữ liệu đồng nhất. | **Đã tạo & hoạt động** | Reusable UI |
| 14 | **lyora_web_shared** | `lyora_web_shared/src/components/AppImage.tsx` | Component render hình ảnh an toàn có skeleton loading và fallback khi lỗi ảnh. | **Đã tạo & hoạt động** | Reusable UI |
| 15 | **lyora_web_shared** | `lyora_web_shared/src/hooks/useDebounce.ts` | Custom hook debounce giá trị nhập liệu (phục vụ tìm kiếm tức thì). | **Đã tạo & hoạt động** | Shared Hook |
| 16 | **lyora_web_shared** | `lyora_web_shared/src/hooks/useClickOutside.ts` | Custom hook phát hiện thao tác click ra ngoài component (phục vụ dropdown/modal). | **Đã tạo & hoạt động** | Shared Hook |
| 17 | **lyora_web_shared** | `lyora_web_shared/src/utils/formatDate.ts` | Hàm định dạng thời gian chuẩn tiếng Việt (`dd/MM/yyyy`). | **Đã tạo & hoạt động** | Shared Utility |
| 18 | **lyora_web_shared** | `lyora_web_shared/src/utils/formatCurrency.ts` | Hàm định dạng tiền tệ VNĐ chuẩn (`Intl.NumberFormat`). | **Đã tạo & hoạt động** | Shared Utility |
| 19 | **lyora_web_shared** | `lyora_web_shared/src/constants/index.ts` | Hằng số chung toàn hệ thống (quy định phân trang, khóa localStorage, API endpoints). | **Đã tạo & hoạt động** | Shared Constants |
| 20 | **lyora_web_shared** | `lyora_web_shared/src/index.ts` | Barrel export tập trung mọi thành phần public của `@lyora/web-shared`. | **Đã tạo & hoạt động** | Barrel Export |
| 21 | **lyora_client** | `lyora_client/package.json` | Metadata, scripts và dependencies cho Web Client (React 19, Vite, `@lyora/web-shared`, ESLint). | **Đã tạo & hoạt động** | Cấu hình Workspace |
| 22 | **lyora_client** | `lyora_client/vite.config.ts` | Cấu hình bundler Vite, trỏ `envDir: '../lyora_web_shared'` và alias `@/`. | **Đã tạo & hoạt động** | Cấu hình Build |
| 23 | **lyora_client** | `lyora_client/eslint.config.js` | Cấu hình ESLint kế thừa trực tiếp từ `sharedEslintConfig` của `lyora_web_shared`. | **Đã tạo & hoạt động** | Cấu hình Linting |
| 24 | **lyora_client** | `lyora_client/src/routes/paths.ts` | Định nghĩa các hằng số URL routing phía khách hàng (`HOME`, `LOGIN`, `REPORTS`, v.v.). | *Cần tạo khi phát triển routes* | Client Routing |
| 25 | **lyora_client** | `lyora_client/src/routes/AppRoutes.tsx` | Cấu hình cây định tuyến `createBrowserRouter` cho Web Client. | *Cần tạo khi phát triển routes* | Client Routing |
| 26 | **lyora_client** | `lyora_client/src/features/auth/` | Module tính năng đăng nhập/xác thực của khách hàng. | *Cần tạo khi phát triển tính năng* | Feature Module |
| 27 | **lyora_client** | `lyora_client/src/features/reports/` | Module tính năng gửi và theo dõi phản ánh của khách hàng. | *Cần tạo khi phát triển tính năng* | Feature Module |
| 28 | **lyora_admin** | `lyora_admin/package.json` | Metadata, scripts và dependencies cho Web Quản trị (React 19, Vite, `@lyora/web-shared`, ESLint). | **Đã tạo & hoạt động** | Cấu hình Workspace |
| 29 | **lyora_admin** | `lyora_admin/vite.config.ts` | Cấu hình bundler Vite, trỏ `envDir: '../lyora_web_shared'` và alias `@/`. | **Đã tạo & hoạt động** | Cấu hình Build |
| 30 | **lyora_admin** | `lyora_admin/eslint.config.js` | Cấu hình ESLint kế thừa trực tiếp từ `sharedEslintConfig` của `lyora_web_shared`. | **Đã tạo & hoạt động** | Cấu hình Linting |
| 31 | **lyora_admin** | `lyora_admin/src/routes/paths.ts` | Định nghĩa các hằng số URL routing phía quản trị viên (`DASHBOARD`, `USERS`, `MANAGE_REPORTS`, v.v.). | *Cần tạo khi phát triển routes* | Admin Routing |
| 32 | **lyora_admin** | `lyora_admin/src/routes/AppRoutes.tsx` | Cấu hình cây định tuyến `createBrowserRouter` cho Web Admin. | *Cần tạo khi phát triển routes* | Admin Routing |
| 33 | **lyora_admin** | `lyora_admin/src/features/dashboard/` | Module thống kê, biểu đồ và chỉ số vận hành tổng quan. | *Cần tạo khi phát triển tính năng* | Feature Module |
| 34 | **lyora_admin** | `lyora_admin/src/features/moderation/` | Module duyệt báo cáo, xử lý phản ánh và phân công tác vụ. | *Cần tạo khi phát triển tính năng* | Feature Module |
| 35 | **lyora_backend** | `lyora_backend/package.json` | Metadata, dependencies (@nestjs/core, common, config, platform-express, etc.) và build scripts cho NestJS. | **Đã tạo & hoạt động** | Cấu hình Workspace |
| 36 | **lyora_backend** | `lyora_backend/nest-cli.json` | Cấu hình NestJS CLI compiler options. | **Đã tạo & hoạt động** | Cấu hình CLI |
| 36 | **lyora_backend** | `lyora_backend/tsconfig.json` | Cấu hình TypeScript compiler hỗ trợ decorator metadata cho NestJS DI. | **Đã tạo & hoạt động** | Cấu hình TypeScript |
| 37 | **lyora_backend** | `lyora_backend/.env` | File cấu hình biến môi trường nội bộ Backend (`DATABASE_URL`, `JWT_SECRET`, v.v.). | **Đã tạo & hoạt động** | Cấu hình Môi trường |
| 39 | **lyora_backend** | `lyora_backend/src/common/guards/jwt-auth.guard.ts` | Guard kiểm tra xác thực JWT Bearer Token trên từng API endpoint. | *Cần tạo khi tích hợp auth* | Backend Core |
| 40 | **lyora_backend** | `lyora_backend/src/common/guards/roles.guard.ts` | Guard kiểm soát phân quyền vai trò (Admin / Staff / Client). | *Cần tạo khi tích hợp auth* | Backend Core |
| 41 | **lyora_backend** | `lyora_backend/src/common/filters/http-exception.filter.ts` | Exception Filter toàn cục chuẩn hóa response khi gặp lỗi. | *Cần tạo khi hoàn thiện common* | Backend Core |
| 42 | **lyora_backend** | `lyora_backend/src/common/interceptors/transform.interceptor.ts` | Response Interceptor tự động bọc dữ liệu trả về theo chuẩn `ApiResponse<T>`. | *Cần tạo khi hoàn thiện common* | Backend Core |
| 43 | **lyora_backend** | `lyora_backend/src/modules/notifications/notification.gateway.ts` | WebSocket Gateway xử lý kết nối realtime bằng Socket.IO cho Client và Admin. | *Cần tạo khi tích hợp realtime* | Backend Module |

---

## 2. Cấu trúc chuẩn của 4 thư mục chính trong Monorepo

### 2.1. Cấu trúc `lyora_web_shared/`

Thư mục dùng chung giữa hai frontend, độc lập hoàn toàn với backend:

```text
lyora_web_shared/
├── src/
│   ├── api/
│   │   └── apiClient.ts             # Axios instance tập trung & interceptors
│   ├── components/                  # UI Components dùng chung (Theme duy nhất)
│   │   ├── AppImage.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   ├── constants/
│   │   └── index.ts                 # Hằng số chung (API paths, storage keys)
│   ├── hooks/                       # Custom hooks tiện ích
│   │   ├── useClickOutside.ts
│   │   └── useDebounce.ts
│   ├── types/                       # TypeScript interfaces dùng chung
│   │   └── api.types.ts
│   ├── utils/                       # Hàm format thời gian, tiền tệ
│   │   ├── formatCurrency.ts
│   │   └── formatDate.ts
│   └── index.ts                     # Public API barrel export
├── .env                             # Cấu hình frontend cục bộ
├── eslint.config.js                 # Shared ESLint Flat Config
├── package.json                     # Package metadata: @lyora/web-shared
└── tsconfig.json                    # Cấu hình TypeScript
```

### 2.2. Cấu trúc `lyora_client/`

Dự án Web dành cho người dùng và khách hàng:

```text
lyora_client/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                      # Hình ảnh, tài nguyên tĩnh riêng của client
│   ├── components/                  # Components đặc thù của client
│   ├── features/                    # Tính năng theo miền nghiệp vụ
│   │   ├── auth/                    # Đăng nhập, đăng ký khách hàng
│   │   └── reports/                 # Tạo phản ánh, xem tiến độ xử lý
│   ├── layouts/                     # Layout wrapper (ClientHeader, Footer)
│   ├── pages/                       # Trang màn hình (HomePage, ReportPage, v.v.)
│   ├── routes/                      # paths.ts và AppRoutes.tsx
│   ├── App.tsx                      # Root component kết nối @lyora/web-shared
│   ├── index.css                    # CSS toàn cục kế thừa DESIGN.md tokens
│   └── main.tsx                     # Entry point khởi tạo React DOM
├── eslint.config.js                 # Kế thừa sharedEslintConfig
├── index.html                       # HTML template
├── package.json                     # Dependencies: @lyora/web-shared, react, etc.
├── tsconfig.app.json                # TypeScript cho app source
├── tsconfig.json                    # TypeScript reference config
├── tsconfig.node.json               # TypeScript cho Vite config
└── vite.config.ts                   # Bundler với envDir: '../lyora_web_shared'
```

### 2.3. Cấu trúc `lyora_admin/`

Dự án Web dành cho cán bộ, quản trị viên và điều phối viên:

```text
lyora_admin/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                      # Tài nguyên tĩnh riêng của admin
│   ├── components/                  # Components đặc thù cho bảng quản trị
│   ├── features/                    # Tính năng quản lý theo miền
│   │   ├── dashboard/               # Biểu đồ KPI, thống kê
│   │   ├── moderation/              # Phê duyệt, xử lý phản ánh
│   │   └── users/                   # Quản lý tài khoản và phân quyền
│   ├── layouts/                     # Layout wrapper (AdminSidebar, AdminHeader)
│   ├── pages/                       # Trang quản trị (DashboardPage, ModerationPage)
│   ├── routes/                      # paths.ts và AppRoutes.tsx (Protected Admin)
│   ├── App.tsx                      # Root component kết nối @lyora/web-shared
│   ├── index.css                    # CSS toàn cục kế thừa DESIGN.md tokens
│   └── main.tsx                     # Entry point khởi tạo React DOM
├── eslint.config.js                 # Kế thừa sharedEslintConfig
├── index.html                       # HTML template
├── package.json                     # Dependencies: @lyora/web-shared, react, etc.
├── tsconfig.app.json                # TypeScript cho app source
├── tsconfig.json                    # TypeScript reference config
├── tsconfig.node.json               # TypeScript cho Vite config
└── vite.config.ts                   # Bundler với envDir: '../lyora_web_shared'
```

### 2.4. Cấu trúc `lyora_backend/`

Dự án Backend API phát triển trên nền tảng NestJS:

```text
lyora_backend/
├── src/
│   ├── common/                      # Guards, Interceptors, Filters, Pipes
│   │   ├── decorators/
│   │   ├── filters/                 # http-exception.filter.ts
│   │   ├── guards/                  # jwt-auth.guard.ts, roles.guard.ts
│   │   └── interceptors/            # transform.interceptor.ts
│   ├── config/                      # Loaders cho Database, Redis, JWT
│   ├── modules/                     # Modules tính năng
│   │   ├── auth/                    # Module xác thực JWT & phân quyền
│   │   ├── reports/                 # CRUD phản ánh, xử lý nghiệp vụ
│   │   └── notifications/           # WebSocket Socket.IO Gateway
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts                      # Entry point khởi động NestJS server
├── test/
│   ├── app.e2e-spec.ts              # Kiểm thử E2E Jest
│   └── jest-e2e.json
├── .env                             # Biến môi trường backend
├── nest-cli.json                    # Cấu hình Nest CLI
├── package.json                     # Scripts & dependencies NestJS
└── tsconfig.json                    # Cấu hình TypeScript compiler
```

---

## 3. Các thành phần đã loại bỏ hoàn toàn (Không còn tồn tại)

1. **`testapi.ps1`**: Đã xóa khỏi thư mục gốc và loại bỏ toàn bộ tham chiếu trong các file tài liệu và skill `lya-newTesting`.
2. **Hệ thống Đa ngôn ngữ (i18n)**:
   - Đã xóa thư mục `web_architecture/localization/`.
   - Đã loại bỏ các file từ điển dịch thuật (`en.json`, `vi.json`, `backend/src/i18n/*`).
   - Đã gỡ bỏ toàn bộ quy định bắt buộc translation key và i18n hooks (`i18next`, `react-i18next`, `nestjs-i18n`). Giao diện thống nhất sử dụng tiếng Việt chuẩn.
3. **Chế độ Light Mode / Dark Mode**:
   - Loại bỏ theme switcher, theme context toggles, `themeStore.ts`.
   - Chuẩn hóa `DESIGN.md` thành một bộ design tokens duy nhất (màu sắc, độ tương phản cao, hiện đại và thanh lịch).
4. **Linter Oxlint**:
   - Loại bỏ cấu hình `.oxlintrc.json` và dependencies oxlint khỏi frontend.
   - Thống nhất áp dụng **ESLint Flat Config** trên cả `lyora_client` và `lyora_admin`.

---

## 4. Hướng dẫn phát triển tiếp theo dành cho Lập Trình Viên

Khi bắt đầu triển khai các tính năng mới trong Monorepo:

1. **Sử dụng `@lyora/web-shared`**:
   - Khi cần UI cơ bản (Button, Input, LoadingSpinner, AppImage), import trực tiếp từ `@lyora/web-shared`.
   - Khi cần gọi API, sử dụng `apiClient` từ `@lyora/web-shared`.
   - Khi có tiện ích hoặc component dùng chung mới giữa Client và Admin, thêm vào `lyora_web_shared/src/` và export qua `lyora_web_shared/src/index.ts`.
2. **Quản lý biến môi trường Frontend**:
   - Khai báo các biến môi trường frontend chung trong `lyora_web_shared/.env`.
   - Vite của cả `lyora_client` và `lyora_admin` sẽ tự động nạp từ thư mục này.
3. **Thực thi Scripts qua Root**:
   - `npm run dev`: Chạy đồng thời dev server của backend, client và admin.
   - `npm run build`: Build toàn bộ 4 workspaces.
   - `npm run lint`: Chạy ESLint kiểm tra code style trên cả client và admin.
   - `npm run test`: Chạy toàn bộ unit/integration test trong monorepo.

