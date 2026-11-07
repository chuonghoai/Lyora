# Lyora Monorepo

Dự án Web Platform ứng dụng kiến trúc npm Monorepo với:
- **Backend API:** NestJS + TypeScript (`lyora_backend/`)
- **Web Client:** ReactJS + TypeScript + Vite (`lyora_client/`)
- **Web Admin:** ReactJS + TypeScript + Vite (`lyora_admin/`)
- **Web Shared:** Thư viện dùng chung (`lyora_web_shared/`, package `@lyora/web-shared`)
- **Linter chuẩn:** ESLint cho toàn bộ các workspace frontend và backend
- **Giao diện & Nội dung:** Giao diện trực quan thống nhất (`DESIGN.md`) và tiếng Việt chuẩn mực (không dùng i18n, không dùng Dark/Light mode)

---

## 1. Khởi động nhanh khi Clone từ GitHub

Khi clone repository về máy mới, bạn chỉ cần thực hiện 2 bước đơn giản tại thư mục gốc (root):

```bash
# 1. Clone repository
git clone <repository-url>
cd Lyora

# 2. Cài đặt toàn bộ dependencies cho 4 workspaces
npm install

# 3. Khởi chạy toàn bộ hệ thống
npm run dev
```

> **Cơ chế npm Workspaces:** Lệnh `npm install` tại root sẽ tự động cài đặt và liên kết toàn bộ dependencies cho cả 4 workspaces (`lyora_backend`, `lyora_client`, `lyora_admin`, `lyora_web_shared`), đồng thời symlink package `@lyora/web-shared` vào `node_modules/@lyora/web-shared` để Client và Admin import trực tiếp.

---

## 2. Cấu trúc Monorepo

```text
lyora/
├── .agents/                        # Hệ thống AI Skills và Rules chuẩn hóa
├── architecture_web/               # Kiến trúc ứng dụng Web Frontend
├── architecture_backend/           # Kiến trúc ứng dụng Backend NestJS
├── refactor_reports/               # Báo cáo kỹ thuật và danh mục tài nguyên
│
├── lyora_web_shared/               # Gói tài nguyên dùng chung (@lyora/web-shared)
│   ├── src/                        # Components, hooks, utils, types, apiClient
│   ├── eslint.config.js            # Cấu hình ESLint dùng chung
│   ├── .env                        # Cấu hình môi trường dùng chung cho Frontend
│   └── package.json
│
├── lyora_backend/                  # Workspace Backend API (NestJS)
│   ├── src/
│   ├── test/
│   ├── .env                        # Cấu hình môi trường Backend cục bộ
│   └── package.json
│
├── lyora_client/                   # Workspace Web Khách hàng (ReactJS + Vite)
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
│
├── lyora_admin/                    # Workspace Web Quản trị (ReactJS + Vite)
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
│
├── .gitignore                      # File cấu hình Git ignore
├── DESIGN.md                       # Design System Tokens chuẩn (Giao diện thống nhất)
├── package.json                    # Root npm workspace manifest & monorepo scripts (14 scripts)
└── README.md                       # Tài liệu hướng dẫn dự án
```

---

## 3. Danh mục Scripts Monorepo (`package.json`)

Toàn bộ 14 scripts chuẩn hóa được điều phối từ root:

| Script | Mô tả chức năng | Workspace tác động |
| :--- | :--- | :--- |
| `npm run backend:dev` | Khởi chạy NestJS Dev Server (`start:dev`) | `lyora_backend` |
| `npm run backend:build` | Build production bundle cho Backend NestJS | `lyora_backend` |
| `npm run backend:test` | Chạy bộ test Jest cho Backend | `lyora_backend` |
| `npm run client:dev` | Khởi chạy Vite Dev Server cho Web Client (port 5173) | `lyora_client` |
| `npm run client:build` | Build bundle production cho Web Client | `lyora_client` |
| `npm run client:test` | Chạy test cho Web Client | `lyora_client` |
| `npm run client:lint` | Chạy ESLint kiểm tra mã nguồn Web Client | `lyora_client` |
| `npm run admin:dev` | Khởi chạy Vite Dev Server cho Web Admin (port 5174) | `lyora_admin` |
| `npm run admin:build` | Build bundle production cho Web Admin | `lyora_admin` |
| `npm run admin:test` | Chạy test cho Web Admin | `lyora_admin` |
| `npm run admin:lint` | Chạy ESLint kiểm tra mã nguồn Web Admin | `lyora_admin` |
| `npm run dev` | Chạy song song cả 3 dự án (Backend, Client, Admin) | Tất cả |
| `npm run build` | Build tất cả các workspaces | Tất cả |
| `npm run test` | Chạy test trên tất cả các workspaces | Tất cả |
| `npm run lint` | Chạy ESLint song song trên cả Client và Admin | Frontend |

---

## 4. Nguồn chân lý kiến trúc (Architecture Sources of Truth)

- **Web Frontend (`lyora_client`, `lyora_admin`, `lyora_web_shared`):** Đọc kỹ hướng dẫn tại [architecture_web/](architecture_web/README.md).
- **Backend API (`lyora_backend`):** Đọc kỹ hướng dẫn tại [architecture_backend/](architecture_backend/README.md).
- **Design Tokens & Theme:** Đọc kỹ hướng dẫn tại [DESIGN.md](DESIGN.md).
- **AI Skills & Rules:** Đọc kỹ hướng dẫn tại [.agents/](.agents/README.md).
