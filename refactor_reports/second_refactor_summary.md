# Báo Cáo Tổng Hợp Đợt Refactor Thứ Hai (Second Refactor Summary)

**Dự án:** Lyora Monorepo  
**Thời gian hoàn thành:** 2026-11-07  
**Phạm vi:** Tinh giản kiến trúc, chuyển đổi mô hình 3 dự án độc lập, thiết lập thư viện dùng chung `web_shared`, chuẩn hóa ESLint, loại bỏ i18n, Dark/Light mode và `testapi.ps1`.

---

## 1. Danh sách các tính năng đã loại bỏ và lý do

Trong đợt refactor thứ hai, hệ thống đã được tinh giản triệt để nhằm tập trung vào giá trị cốt lõi, giảm tải độ phức tạp và loại bỏ các thành phần dư thừa:

| Tính năng loại bỏ | Lý do loại bỏ | Phạm vi tác động |
| :--- | :--- | :--- |
| **Đa ngôn ngữ (i18n)** | Dự án thống nhất phục vụ một ngôn ngữ chính thức (Tiếng Việt chuẩn). Việc duy trì hệ thống i18n phức tạp (`i18next`, `react-i18next`, `nestjs-i18n`, các file JSON translation `locales/*.json`) tạo ra gánh nặng boilerplate không cần thiết cho dự án. | Đã xóa thư mục `web_architecture/localization/`, xóa các file từ điển và bỏ dependency i18n. Cập nhật rules và skills. |
| **Chế độ Sáng / Tối (Light / Dark Mode)** | Dự án chuyển đổi sang **một giao diện thống nhất duy nhất**, tập trung vào tính thẩm mỹ cao, độ tương phản rõ ràng và các design tokens nhất quán. Loại bỏ hoàn toàn theme switchers, theme contexts, lưu theme vào LocalStorage. | Tinh giản `DESIGN.md` thành bộ tokens duy nhất. Cập nhật các component UI, loại bỏ logic toggle theme. |
| **Script `testapi.ps1`** | Script PowerShell cục bộ gây phụ thuộc vào hệ điều hành Windows và không tương thích tốt với quy trình CI/CD đa nền tảng. NestJS đã có sẵn runner kiểm thử tích hợp (Jest/ts-node runner) chạy thông qua npm scripts. | Đã xóa file `testapi.ps1` khỏi root. Cập nhật skill `lya-newTesting` và tài liệu liên quan. |
| **Linter Oxlint** | Thay thế bằng giải pháp tiêu chuẩn công nghiệp là **ESLint Flat Config** thống nhất giữa hai dự án frontend, giúp kiểm soát chặt chẽ React hooks và quy chuẩn TypeScript. | Đã xóa `.oxlintrc.json` và gỡ bỏ dependencies oxlint khỏi frontend. |

---

## 2. Danh sách các file & thư mục đã đổi tên, tạo mới và xóa bỏ

### 2.1. Đổi tên thư mục & Workspaces
- `backend/` → `lyora_backend/`: Đổi tên thư mục và cập nhật `"name": "lyora_backend"` trong `package.json`.
- `frontend/` → `lyora_client/`: Đổi tên thư mục và cập nhật `"name": "lyora_client"` trong `package.json`.

### 2.2. Thư mục và File tạo mới
- **`web_shared/`**:
  - `package.json`: Khai báo package name `@lyora/web-shared`.
  - `tsconfig.json`: Cấu hình TypeScript compiler với Vite client types.
  - `eslint.config.js`: Khởi tạo `sharedEslintConfig` dùng chung cho frontend.
  - `.env.example` & `.env`: Quản lý tập trung các biến môi trường frontend chung.
  - `src/types/api.types.ts`: Khai báo API contract types (`ApiResponse`, `PaginatedResponse`, `ApiError`, `UserRole`).
  - `src/api/apiClient.ts`: Axios client tập trung xử lý Bearer token và error handling.
  - `src/components/`: `Button.tsx`, `Input.tsx`, `LoadingSpinner.tsx`, `AppImage.tsx`.
  - `src/hooks/`: `useDebounce.ts`, `useClickOutside.ts`.
  - `src/utils/`: `formatDate.ts`, `formatCurrency.ts`.
  - `src/constants/index.ts`: Hằng số phân trang, khóa storage, endpoints.
  - `src/index.ts`: Barrel export toàn bộ tài nguyên dùng chung.
- **`lyora_admin/`**:
  - Khởi tạo hoàn chỉnh dự án React 19 + TypeScript + Vite + ESLint độc lập dành cho quản trị viên.
  - Cấu hình kết nối package `@lyora/web-shared` và nạp biến môi trường từ `web_shared`.
- **Báo cáo trong `refactor_reports/`**:
  - `second_audit.md`: Báo cáo khảo sát chi tiết trước khi thực hiện refactor.
  - `shared_resources_report.md`: Báo cáo chi tiết về thiết kế và sử dụng tài nguyên của `web_shared`.
  - `required_project_files.md`: Báo cáo danh mục các file cần thiết và trạng thái của từng file.
  - `second_refactor_summary.md`: Báo cáo tổng hợp toàn bộ kết quả của đợt refactor thứ hai.

### 2.3. File và Thư mục đã xóa bỏ
- `testapi.ps1` (ở root).
- `web_architecture/localization/` (toàn bộ thư mục).
- `lyora_client/.oxlintrc.json`.

---

## 3. Chi tiết cấu trúc 3 dự án độc lập và vai trò từng dự án

Monorepo Lyora hiện tại được cấu trúc thành 3 dự án ứng dụng độc lập và 1 workspace chia sẻ tài nguyên:

```text
Lyora/
├── web_shared/          # [@lyora/web-shared] Thư viện chia sẻ cho 2 frontend
├── lyora_backend/       # [lyora_backend] Backend API & Realtime Gateway (NestJS)
├── lyora_client/        # [lyora_client] Web Ứng dụng Khách hàng (ReactJS + Vite)
├── lyora_admin/         # [lyora_admin] Web Quản trị & Điều hành (ReactJS + Vite)
├── refactor_reports/    # Các báo cáo audit & refactor
├── .agents/             # Hệ thống AI Agent Rules & Skills
├── web_architecture/    # Tài liệu kiến trúc Web Frontend
├── backend_architecture/# Tài liệu kiến trúc Backend
├── DESIGN.md            # Hệ thống Design Tokens thống nhất
├── .gitignore           # Cấu hình Git bỏ qua file rác và artifacts
└── package.json         # Root Monorepo configuration
```

| Tên dự án / Workspace | Công nghệ cốt lõi | Vai trò & Trách nhiệm | Cổng mặc định |
| :--- | :--- | :--- | :---: |
| **`lyora_backend`** | NestJS, TypeScript, Express, TypeORM/Prisma | Xử lý logic nghiệp vụ, quản lý cơ sở dữ liệu, cấp phát JWT, WebSocket Realtime Gateway. | `3000` |
| **`lyora_client`** | React 19, TypeScript, Vite, `@lyora/web-shared` | Giao diện công cộng phục vụ khách hàng gửi phản ánh, tra cứu kết quả xử lý và tương tác. | `5173` |
| **`lyora_admin`** | React 19, TypeScript, Vite, `@lyora/web-shared` | Giao diện nội bộ dành cho Quản trị viên và Cán bộ duyệt hồ sơ, xem báo cáo thống kê, cấu hình hệ thống. | `5174` |
| **`web_shared`** | TypeScript, React 19 Primitives | Cung cấp UI components, custom hooks, utilities, API client và types dùng chung giữa hai frontend. | N/A (Package) |

> **Nguyên tắc bảo vệ:** Tên 4 thư mục trên là cố định. Tuyệt đối không dùng các tên chung chung như `frontend`, `backend`, `client`, `admin` làm tên workspace.

---

## 4. Chi tiết về `web_shared` và Tài nguyên được chia sẻ

`web_shared` đóng vai trò là single source of truth cho các tài nguyên frontend dùng chung, ngăn chặn sự trùng lặp mã nguồn giữa `lyora_client` và `lyora_admin`:

1. **Giao diện người dùng (UI Components):**
   - `Button`: Hỗ trợ 4 variants (`primary`, `secondary`, `outline`, `danger`), xử lý trạng thái `isLoading` với spinner tích hợp.
   - `Input`: Field nhập liệu có label, helper text, error message và trạng thái disabled.
   - `LoadingSpinner`: Component spinner đồng nhất với 3 kích thước (`sm`, `md`, `lg`).
   - `AppImage`: Render hình ảnh an toàn với skeleton shimmer khi đang tải và ảnh fallback SVG thanh lịch khi link hỏng.
2. **Custom Hooks:**
   - `useDebounce`: Debounce giá trị nhập liệu sau khoảng delay xác định (mặc định 300ms).
   - `useClickOutside`: Bắt sự kiện click ra ngoài element để đóng modal, dropdown, drawer.
3. **Tiện ích (Utilities):**
   - `formatDate`: Định dạng ngày giờ thân thiện theo chuẩn Việt Nam (`dd/MM/yyyy`, `dd/MM/yyyy HH:mm`, `relative`).
   - `formatCurrency`: Định dạng số tiền VNĐ chuẩn (`100.000 ₫`).
4. **Hợp đồng Dữ liệu (API Types):**
   - `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `UserRole` (`ADMIN`, `STAFF`, `CITIZEN`).
5. **Hạ tầng Mạng (API Client):**
   - Axios instance cấu hình sẵn `baseURL`, tự động đính kèm `Authorization: Bearer <token>` từ localStorage, bắt lỗi 401 để xử lý đăng xuất an toàn.

---

## 5. Cơ chế quản lý biến môi trường qua `web_shared`

Nhằm tập trung cấu hình frontend và loại bỏ tình trạng trùng lặp `.env`:
- Các biến môi trường frontend được định nghĩa tập trung tại `web_shared/.env.example` và `web_shared/.env`.
- Cả hai dự án `lyora_client` và `lyora_admin` khai báo trong `vite.config.ts`:
  ```typescript
  export default defineConfig({
    envDir: '../web_shared',
    // ...
  });
  ```
- **Ưu điểm vượt trội:**
  - Vite tự động đọc trực tiếp các biến có tiền tố `VITE_*` từ `web_shared` khi chạy `dev` hoặc `build`.
  - Không cần cài thêm script loader thủ công phức tạp.
  - Mỗi frontend vẫn có thể ghi đè biến riêng nếu cần thiết bằng cách tạo file `.env` cục bộ trong thư mục của mình.
- **Quy tắc bảo mật tuyệt đối:** Tuyệt đối không đưa các biến nhạy cảm của backend (`DATABASE_URL`, `JWT_SECRET`, `REDIS_PASSWORD`) vào `web_shared`. Các biến này được quản lý riêng biệt tại `lyora_backend/.env`.

---

## 6. Cấu hình ESLint cho hai Frontend

Hệ thống đã loại bỏ Oxlint và thiết lập quy chuẩn kiểm tra mã nguồn bằng ESLint Flat Config hiện đại:
- **Cấu hình gốc:** `web_shared/eslint.config.js` xuất `sharedEslintConfig`, tích hợp quy chuẩn JavaScript (`@eslint/js`), TypeScript (`typescript-eslint`), và React Hooks (`eslint-plugin-react-hooks`).
- **Kế thừa tại các Frontend:**
  - `lyora_client/eslint.config.js`:
    ```javascript
    import sharedEslintConfig from '../web_shared/eslint.config.js';
    export default [...sharedEslintConfig];
    ```
  - `lyora_admin/eslint.config.js`:
    ```javascript
    import sharedEslintConfig from '../web_shared/eslint.config.js';
    export default [...sharedEslintConfig];
    ```
- **Scripts kiểm tra:** Cả hai frontend đều sở hữu lệnh `npm run lint` và `npm run lint:fix`.

---

## 7. Tóm tắt thay đổi trong `.agents`, `web_architecture` và `backend_architecture`

| Thư mục | Các thay đổi trọng tâm đã thực hiện |
| :--- | :--- |
| **`.agents/rules/`** | - `shared-ui-l10n-rules.md`: Bỏ yêu cầu i18n và theme switcher; quy định một theme duy nhất kế thừa `DESIGN.md`; thống nhất text hiển thị bằng tiếng Việt chuẩn.<br>- `shared-architecture-rules.md`: Cập nhật cấu trúc 3 dự án + `web_shared`; cấm leak secrets backend; quy định dùng `apiClient` từ `@lyora/web-shared`.<br>- `shared-workflow.md`: Cập nhật các lệnh build/lint/test theo 3 dự án. |
| **`.agents/skills/lya-*`** | - Cập nhật toàn bộ 11 skills nhóm A: `lya-analyzeTask`, `lya-cleanup`, `lya-createPR`, `lya-createTestCase`, `lya-fixbug`, `lya-newFeature`, `lya-newTesting`, `lya-newWeeklyReport`, `lya-review-code`, `lya-reviewPR`, `lya-reviewSecurityPerformance`.<br>- Loại bỏ mọi tham chiếu tới `testapi.ps1`, Dark/Light mode switchers và đa ngôn ngữ i18n. |
| **`.agents/skills/` (Nhóm B)** | - **108 files** thuộc `design-taste-frontend`, `find-skills`, `impeccable` được bảo vệ toàn vẹn tuyệt đối (0 thay đổi, 0 chỉnh sửa). |
| **`web_architecture/`** | - Đã xóa toàn bộ thư mục `localization/`.<br>- Cập nhật toàn bộ tài liệu để mô tả kiến trúc song hành Client + Admin sử dụng `web_shared`.<br>- Loại bỏ các hook và thư viện i18n/theme switcher khỏi tài liệu kiến trúc. |
| **`backend_architecture/`** | - Đồng bộ tên workspace `lyora_backend`.<br>- Loại bỏ hướng dẫn liên quan đến `testapi.ps1` và module `nestjs-i18n`.<br>- Cập nhật workflow kiểm thử backend qua Jest/ts-node. |

---

## 8. Danh sách Script npm Hoàn Chỉnh & Kết Quả Kiểm Tra

Root `package.json` đã được cấu hình với đầy đủ 14 scripts tiêu chuẩn:

| Script | Lệnh thực thi chi tiết | Kết quả kiểm tra | Ghi chú |
| :--- | :--- | :---: | :--- |
| `npm run backend:dev` | `npm run start:dev --workspace=lyora_backend` | **Sẵn sàng** | Chạy NestJS ở chế độ watch mode |
| `npm run backend:build` | `npm run build --workspace=lyora_backend` | **PASS (100%)** | Biên dịch TypeScript backend ra `dist/` |
| `npm run backend:test` | `npm run test --workspace=lyora_backend` | **PASS (100%)** | Chạy kiểm thử Jest backend |
| `npm run client:dev` | `npm run dev --workspace=lyora_client` | **Sẵn sàng** | Khởi chạy Vite dev server cho Client |
| `npm run client:build` | `npm run build --workspace=lyora_client` | **PASS (100%)** | Build bundle React client ra `dist/` |
| `npm run client:test` | `npm run test --workspace=lyora_client` | **PASS (100%)** | Chạy kiểm thử cho Client |
| `npm run client:lint` | `npm run lint --workspace=lyora_client` | **PASS (100%)** | ESLint kiểm tra code style Client (0 errors) |
| `npm run admin:dev` | `npm run dev --workspace=lyora_admin` | **Sẵn sàng** | Khởi chạy Vite dev server cho Admin |
| `npm run admin:build` | `npm run build --workspace=lyora_admin` | **PASS (100%)** | Build bundle React admin ra `dist/` |
| `npm run admin:test` | `npm run test --workspace=lyora_admin` | **PASS (100%)** | Chạy kiểm thử cho Admin |
| `npm run admin:lint` | `npm run lint --workspace=lyora_admin` | **PASS (100%)** | ESLint kiểm tra code style Admin (0 errors) |
| `npm run dev` | `npm run dev --workspaces --if-present` | **Sẵn sàng** | Điều phối chạy đồng thời các dev servers |
| `npm run build` | `npm run build --workspaces` | **PASS (100%)** | Build toàn bộ 4 workspaces thành công |
| `npm run test` | `npm run test --workspaces` | **PASS (100%)** | Chạy test toàn bộ workspaces thành công |
| `npm run lint` | `npm run client:lint && npm run admin:lint` | **PASS (100%)** | Kiểm tra ESLint cho cả 2 frontend (0 errors) |

---

## 9. Hướng dẫn tiếp theo dành cho Lập Trình Viên

1. **Khởi động môi trường phát triển:**
   - Cài đặt dependencies toàn bộ monorepo: `npm install`.
   - Chạy riêng từng service hoặc chạy toàn bộ bằng các scripts tương ứng ở root.
2. **Tận dụng tối đa `web_shared`:**
   - Luôn kiểm tra xem UI component hoặc utility cần dùng đã có trong `@lyora/web-shared` hay chưa trước khi viết mới.
   - Khi tạo API service mới ở frontend, kế thừa `apiClient` từ `@lyora/web-shared` để tự động có Bearer token và error handling.
3. **Tuân thủ quy chuẩn mã nguồn:**
   - Chạy `npm run lint` trước khi commit mã nguồn để đảm bảo không vi phạm quy tắc ESLint.
   - Không tự ý thêm tính năng i18n hoặc theme switcher nếu không có yêu cầu đặc thù.
   - Thống nhất các hằng số màu sắc và spacing dựa trên `DESIGN.md`.

