# Kiến trúc Web Frontend Lyora (`lyora_client`, `lyora_admin`, `lyora_web_shared`)

Tài liệu này quy định toàn bộ tiêu chuẩn kiến trúc, quy tắc tổ chức mã nguồn và quy chuẩn kỹ thuật bắt buộc đối với các ứng dụng Web Frontend trong dự án Lyora.

---

## 1. Cấu trúc 3 Workspace Frontend trong Monorepo

Hệ thống Web Frontend được phân tách rõ ràng thành 2 ứng dụng độc lập và 1 thư viện dùng chung:

```text
lyora/
├── lyora_web_shared/               # Thư viện dùng chung (@lyora/web-shared)
│   ├── src/
│   │   ├── api/                    # Axios instance tập trung & interceptors
│   │   ├── components/             # Reusable UI primitives (Button, Input, AppImage...)
│   │   ├── hooks/                  # Custom hooks dùng chung (useDebounce, useClickOutside...)
│   │   ├── utils/                  # Formatters & utilities (formatDate, formatCurrency...)
│   │   ├── types/                  # Shared API & Domain types (ApiResponse, PaginatedResponse...)
│   │   └── constants/              # Hằng số hệ thống dùng chung
│   ├── eslint.config.js            # Shared ESLint Flat Configuration
│   ├── .env                        # File biến môi trường dùng chung cho Frontend
│   └── package.json
│
├── lyora_client/                   # Ứng dụng Web dành cho Khách hàng / Cư dân
│   ├── src/                        # Pages, Features, Layouts, Routing riêng của Client
│   ├── vite.config.ts              # Cấu hình Vite (port 5173, envDir: '../lyora_web_shared')
│   ├── eslint.config.js            # ESLint kế thừa từ lyora_web_shared
│   └── package.json
│
└── lyora_admin/                    # Ứng dụng Web dành cho Ban Quản trị / Điều phối
    ├── src/                        # Pages, Dashboards, Layouts, Routing riêng của Admin
    ├── vite.config.ts              # Cấu hình Vite (port 5174, envDir: '../lyora_web_shared')
    ├── eslint.config.js            # ESLint kế thừa từ lyora_web_shared
    └── package.json
```

---

## 2. Quy tắc cốt lõi của Kiến trúc Web

1. **Bắt buộc sử dụng `lyora_web_shared`:**
   - Mọi thành phần (components, hooks, utilities, types, API client) được xác định là dùng chung giữa `lyora_client` và `lyora_admin` **BẮT BUỘC** phải đặt tại `lyora_web_shared`.
   - Hai ứng dụng frontend import tài nguyên từ package `@lyora/web-shared`, tuyệt đối không dùng đường dẫn tương đối xuyên qua thư mục của nhau (ví dụ: `import { Button } from '@lyora/web-shared';`).
   - Tuyệt đối không sao chép (duplicate) cùng một file dùng chung vào cả 2 dự án.

2. **Ranh giới độc lập giữa Client và Admin:**
   - Code nghiệp vụ riêng (pages, custom layouts, specific routing, feature hooks riêng) của Client nằm hoàn toàn trong `lyora_client`.
   - Code nghiệp vụ riêng của Admin nằm hoàn toàn trong `lyora_admin`.
   - Không đưa code nghiệp vụ đặc thù của một bên vào `lyora_web_shared`.

3. **Bắt buộc sử dụng ESLint (Loại bỏ Oxlint):**
   - Cả `lyora_client` và `lyora_admin` bắt buộc sử dụng ESLint Flat Config kế thừa từ `lyora_web_shared/eslint.config.js`.
   - Cả hai dự án phải cung cấp script `npm run lint` (`eslint .`) và `npm run lint:fix` (`eslint . --fix`).
   - Không sử dụng Oxlint làm công cụ linting chính.

4. **Loại bỏ Đa ngôn ngữ (i18n):**
   - Không triển khai các thư viện i18n (`react-i18next`, `i18next`).
   - Toàn bộ giao diện sử dụng **một ngôn ngữ thống nhất (Tiếng Việt)** rõ ràng, mạch lạc. Không tạo các file từ điển dịch thuật (`en.json`, `vi.json`).

5. **Loại bỏ Chế độ Sáng/Tối (Light/Dark Mode):**
   - Áp dụng **một giao diện trực quan thống nhất** tuân thủ bảng mã màu và tokens quy định trong `DESIGN.md`.
   - Không xây dựng theme switcher, không lưu trữ theme trong LocalStorage, không sử dụng class `dark:` rải rác.

6. **Quản lý Biến môi trường (`.env`):**
   - Các biến môi trường dùng chung cho Frontend được quản lý tập trung tại `lyora_web_shared/.env`.
   - `lyora_client` và `lyora_admin` cấu hình `envDir: '../lyora_web_shared'` trong `vite.config.ts` để Vite tự động nạp cấu hình chung.
   - **BẢO MẬT TUYỆT ĐỐI:** Không bao giờ đưa thông tin bí mật của Backend (Database password, JWT secrets, private keys) vào `lyora_web_shared` hoặc bất kỳ ứng dụng Frontend nào.

---

## 3. Cấu trúc tài liệu chi tiết:
- `architecture/`:
  - `README.md`: Tổng quan kiến trúc hệ thống và phân tầng trách nhiệm.
  - `controller.md`: Quản lý UI State qua Custom Hooks (`use*Controller.ts`).
  - `ui.md`: Tổ chức Components, Layouts, Forms và tái sử dụng component từ `lyora_web_shared`.
  - `model.md`: Định nghĩa Types, Interfaces và Schema Validation (Zod).
  - `service_repository.md`: Tầng kết nối API Backend qua Axios & TanStack Query.
  - `data_flow.md`: Luồng dữ liệu một chiều (Unidirectional Data Flow).
  - `push_notification_rules.md`: Xử lý thông báo đẩy và điều hướng sự kiện.
- `navigation/`: Quy chuẩn routing với React Router.
- `feature-development/`: Quy trình 7 bước phát triển tính năng mới.
