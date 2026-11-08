# Kiến trúc Web Frontend Lyora (`lyora_web`)

Tài liệu này quy định toàn bộ tiêu chuẩn kiến trúc, quy tắc tổ chức mã nguồn và quy chuẩn kỹ thuật bắt buộc đối với ứng dụng Web Frontend hợp nhất (`lyora_web`) trong dự án Lyora Monorepo.

---

## 1. Cấu trúc Workspace Frontend Hợp Nhất (`lyora_web`)

Toàn bộ giao diện **Client Portal (Khách hàng)**, **Admin Portal (Quản trị viên)** và **Shared Resources (Tài nguyên dùng chung)** được hợp nhất trong 1 workspace duy nhất `lyora_web/`:

```text
lyora/
├── lyora_backend/                  # Backend API (NestJS :3000)
└── lyora_web/                      # Unified Web Frontend (React + Vite :5173)
    ├── src/
    │   ├── shared/                 # Tài nguyên dùng chung (@shared / @/shared)
    │   │   ├── api/                # Axios instance tập trung & interceptors (apiClient)
    │   │   ├── components/         # Reusable UI primitives (Button, Input, AppImage, LoadingSpinner)
    │   │   ├── hooks/              # Custom hooks dùng chung (useDebounce, useClickOutside)
    │   │   ├── utils/              # Formatters & utilities (formatDate, formatCurrency)
    │   │   ├── types/              # Shared API & Domain types (ApiResponse, PaginatedResponse, UserRole)
    │   │   └── constants/          # Hằng số hệ thống dùng chung (SHARED_CONSTANTS)
    │   ├── core/                   # Core infrastructure (Zustand authStore, AppProviders, RoleRoute)
    │   ├── layouts/                # Layouts (ClientLayout cho /*, AdminLayout cho /admin/*)
    │   ├── features/               # Feature modules phân tách rõ ràng
    │   │   ├── auth/               # Xác thực người dùng
    │   │   ├── client/             # Pages, Components, Hooks, Services của Cổng Khách Hàng
    │   │   └── admin/              # Pages, Dashboards, Hooks, Services của Trung Tâm Quản Trị
    │   └── routes/                 # Cấu hình React Router tập trung (paths.ts, AppRoutes.tsx)
    ├── eslint.config.js            # Cấu hình ESLint Flat Configuration
    ├── vite.config.ts              # Cấu hình Vite (port 5173, alias '@' và '@shared')
    ├── .env.example                # File mẫu biến môi trường cho Frontend
    └── package.json
```

---

## 2. Quy tắc cốt lõi của Kiến trúc Web

1. **Bắt buộc tái sử dụng `src/shared` (`@shared`):**
   - Mọi thành phần (components, hooks, utilities, types, API client) dùng chung giữa phân hệ Client và Admin **BẮT BUỘC** đặt tại `lyora_web/src/shared/` và import qua alias `@shared`.
   - Tuyệt đối không tạo duplicate component cục bộ nếu `@shared` đã cung cấp.

2. **Ranh giới rõ ràng giữa Client (`src/features/client`) và Admin (`src/features/admin`):**
   - Các trang và nghiệp vụ của Khách hàng nằm tại `src/features/client/` và sử dụng `ClientLayout` (`/*`).
   - Các trang và nghiệp vụ của Quản trị viên nằm tại `src/features/admin/` và sử dụng `AdminLayout` (`/admin/*`).
   - Sử dụng `React.lazy()` trong `AppRoutes.tsx` để tách bundle (code-splitting) giữa Client và Admin.

3. **Bắt buộc sử dụng ESLint:**
   - Cung cấp script `npm run lint` (`eslint .`) và `npm run lint:fix` (`eslint . --fix`).

4. **Loại bỏ Đa ngôn ngữ (i18n) & Light/Dark Mode:**
   - Toàn bộ giao diện sử dụng **một ngôn ngữ thống nhất (Tiếng Việt)** rõ ràng, mạch lạc.
   - Áp dụng **một giao diện trực quan thống nhất (Light Mode)** tuân thủ bảng mã màu và tokens quy định trong `DESIGN.md` (Primary Blue `#2563eb`).

5. **Quản lý Biến môi trường (`.env`):**
   - Các biến môi trường của Frontend được quản lý tại `lyora_web/.env`.
   - **BẢO MẬT TUYỆT ĐỐI:** Không bao giờ đưa thông tin bí mật của Backend (Database password, JWT secrets, private keys) vào `lyora_web`.
