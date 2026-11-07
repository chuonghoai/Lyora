# Second Audit Report: Architecture Refinement & Multi-Project Assessment

**Thời gian thực hiện:** 2026-11-07  
**Dự án:** Lyora Monorepo  
**Mục tiêu:** Rà soát hiện trạng phục vụ việc chuyển đổi sang 3 dự án độc lập (`lyora_backend`, `lyora_client`, `lyora_admin`), thiết lập `web_shared`, loại bỏ i18n, loại bỏ Dark/Light Mode và xóa bỏ `testapi.ps1`.

---

## 1. Hiện trạng Repository trước đợt Refactor thứ hai

### 1.1. Cấu trúc thư mục hiện tại
- **Thư mục gốc:**
  - `backend/`: Đã được khởi tạo bằng `@nestjs/cli`, NestJS v11.0.1, TypeScript v5.7.3, ESLint (`eslint.config.mjs`), Jest.
  - `frontend/`: Đã được khởi tạo bằng `create-vite`, React v19.3.1, Vite v8.3.6, TypeScript, đang sử dụng `oxlint` làm linter tạm thời.
  - `web_architecture/`: 12 files tài liệu kiến trúc Web ReactJS.
  - `backend_architecture/`: 4 files tài liệu kiến trúc Backend NestJS.
  - `.agents/`: Hệ thống AI Skills (`lya-*` và 3 skill Group B được bảo vệ tuyệt đối) cùng các rules.
  - `refactor_reports/`: Báo cáo từ đợt refactor thứ nhất.
  - File tại root: `package.json`, `package-lock.json`, `README.md`, `DESIGN.md`, `.gitignore`, `testapi.ps1`.

---

## 2. Đánh giá hiện trạng chi tiết theo từng hạng mục

### 2.1. Đánh giá Backend hiện tại (`backend/`)
- **Tình trạng:** Khởi tạo hoàn chỉnh từ official NestJS CLI (`@nestjs/cli` v11.0.16).
- **Dependencies:** `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`.
- **Linting & Code Quality:** Đã có ESLint Flat Config (`eslint.config.mjs`) và Prettier.
- **Testing:** Đã cấu hình Jest cho unit test và e2e test, test chạy thành công (`AppController root` PASS).
- **Khả năng tái sử dụng:** **100% tái sử dụng được**.
  - **Hành động đề xuất:** Đổi tên thư mục `backend/` -> `lyora_backend/`, cập nhật `"name": "lyora_backend"` trong `package.json`. Không cần khởi tạo lại bằng CLI.

### 2.2. Đánh giá Frontend hiện tại (`frontend/`)
- **Tình trạng:** Khởi tạo từ `create-vite` v9.3.4 (template `react-ts`).
- **Dependencies:** React v19.3.1, ReactDOM v19.3.1, Vite v8.3.6, TypeScript.
- **Vấn đề Linting phát hiện:** Đang có dependency `"oxlint": "^1.90.0"`, file cấu hình `.oxlintrc.json`, và script `"lint": "oxlint"`. Vi phạm yêu cầu bắt buộc sử dụng ESLint (Mục 4).
- **Khả năng tái sử dụng:** **100% tái sử dụng được**.
  - **Hành động đề xuất:**
    1. Đổi tên thư mục `frontend/` -> `lyora_client/`, cập nhật `"name": "lyora_client"`.
    2. Gỡ bỏ `oxlint` và xóa file `.oxlintrc.json`.
    3. Cài đặt và cấu hình ESLint chuẩn React Hooks + TypeScript (`eslint.config.js`).

### 2.3. Đánh giá việc tạo mới `lyora_admin`
- Dự án `lyora_admin` là Web Client dành riêng cho quản trị viên (Admin Portal).
- Cần có cùng nền tảng công nghệ với `lyora_client`: ReactJS 19 + TypeScript + Vite + ESLint.
- **Phương án tối ưu:** Thiết lập `lyora_admin` chia sẻ cấu hình build và linting chuẩn từ `web_shared` và kế thừa nền tảng của `lyora_client`, đảm bảo cả hai frontend có cấu trúc đồng nhất, không gây mâu thuẫn phiên bản React hoặc Vite.

### 2.4. Đánh giá việc thiết lập `web_shared/`
- Chưa tồn tại thư mục `web_shared/`.
- Cần tạo mới `web_shared` như một npm workspace package với tên `@lyora/web-shared`.
- Chứa các tài nguyên dùng chung: components dùng chung, hooks, utils, api client (Axios instance), shared types, constants, và cơ chế nạp biến môi trường dùng chung (`.env`).
- Không chứa code nghiệp vụ riêng của admin/client hoặc secrets của backend.

---

## 3. Danh mục các tính năng & file cần loại bỏ

| STT | Hạng mục cần loại bỏ | Vị trí xuất hiện | Lý do loại bỏ & Hành động cụ thể |
| :---: | :--- | :--- | :--- |
| 1 | **File `testapi.ps1`** | Root repository (`testapi.ps1`) | Theo Mục 2.3: Xóa hoàn toàn file này và mọi tham chiếu trong docs/skills (`lya-newTesting`). |
| 2 | **Oxlint config & deps** | `frontend/.oxlintrc.json`, `frontend/package.json` | Theo Mục 4: Bắt buộc dùng ESLint, loại bỏ triệt để Oxlint. |
| 3 | **Đa ngôn ngữ (i18n)** | `web_architecture/localization/`, các skill `lya-*`, `DESIGN.md`, `backend_architecture/api_rules.md` | Theo Mục 2.1: Loại bỏ hướng dẫn i18n, `locales/en.json`, `locales/vi.json`, `nestjs-i18n`, `user.language`. Thống nhất một ngôn ngữ giao diện duy nhất. |
| 4 | **Dark Mode / Light Mode** | `DESIGN.md`, `web_architecture/architecture/provider.md` (`ThemeContext`), `shared-ui-l10n-rules.md`, các skill `lya-*` | Theo Mục 2.2: Loại bỏ theme switcher, local storage theme, quy tắc bắt buộc 2 mode. Giữ lại hệ thống design tokens tập trung cho giao diện đơn nhất. |

---

## 4. Đánh giá về việc sử dụng CLI & Bảo toàn mã nguồn (Section 3.2 & 3.3)

Theo quy định nghiêm ngặt tại Section 3.3:
- Hai dự án backend và frontend hiện có đã được khởi tạo bằng CLI chính thức trong đợt trước và build/test thành công.
- Không có bất kỳ lý do kỹ thuật nào cần phải xóa hay chạy lại CLI hủy hoại mã nguồn hiện có.
- Phương án giữ lại `backend` đổi tên thành `lyora_backend`, `frontend` đổi tên thành `lyora_client`, và tạo `lyora_admin` với cấu hình React 19 + TypeScript + Vite + ESLint đồng bộ là phương án tối ưu, an toàn tuyệt đối và bảo toàn 100% source code.
- **Không có thao tác phá hủy (destructive action) cần xin ý kiến CLI từ người dùng.**

