# Lyora Monorepo

Dự án Web Platform ứng dụng kiến trúc npm Monorepo với 2 workspaces cốt lõi:
- **Backend API:** NestJS + TypeScript + TypeORM + PostgreSQL + Redis (`lyora_backend/`)
- **Unified Web App:** ReactJS + TypeScript + Vite (`lyora_web/`) — hợp nhất Client Portal (`/*`), Admin Portal (`/admin/*`) và thư viện dùng chung (`src/shared/`)
- **Linter chuẩn:** ESLint cho toàn bộ các workspace frontend và backend
- **Giao diện & Nội dung:** Giao diện trực quan thống nhất (`DESIGN.md`) và tiếng Việt chuẩn mực (không dùng i18n, không dùng Dark/Light mode)

---

## 1. Khởi động nhanh khi Clone từ GitHub

### 1.1. Yêu cầu môi trường (Prerequisites)
- **Node.js:** Phiên bản `18.x` trở lên (Khuyến nghị LTS `20.x` hoặc `22.x`).
- **npm:** Phiên bản `9.x` hoặc `10.x` trở lên (Tích hợp sẵn hỗ trợ npm workspaces).

### 1.2. Các bước cài đặt & Khởi chạy

```bash
# 1. Clone repository về máy
git clone <repository-url>
cd Lyora

# 2. Cài đặt toàn bộ dependencies tập trung cho cả 2 workspaces
npm install

# 3. Khởi chạy đồng thời toàn bộ hệ thống (Backend :3000, Web :5173)
npm run dev
```

---

## 2. Cấu trúc Monorepo

```text
lyora/
├── .agents/                        # Hệ thống AI Skills và Rules chuẩn hóa
├── architecture_web/               # Kiến trúc ứng dụng Web Frontend (Unified)
├── architecture_backend/           # Kiến trúc ứng dụng Backend NestJS
│
├── lyora_backend/                  # Workspace Backend API (NestJS :3000)
│   ├── src/
│   │   ├── common/                 # Decorators, Guards, Interceptors, Filters, DTOs, BaseEntity
│   │   ├── config/                 # Cấu hình App, Database, JWT, Redis
│   │   ├── database/               # TypeORM PostgreSQL connection
│   │   ├── redis/                  # Global Redis & Fallback Session/Blacklist/OTP Service
│   │   └── modules/                # Feature modules (auth, users, health...)
│   ├── test/
│   ├── .env.example
│   └── package.json
│
├── lyora_web/                      # Workspace Web Hợp nhất (ReactJS + Vite :5173)
│   ├── src/
│   │   ├── shared/                 # Components, hooks, utils, types, constants, apiClient
│   │   ├── core/                   # Zustand stores, Providers, Route Guards
│   │   ├── layouts/                # ClientLayout & AdminLayout
│   │   ├── features/               # Feature modules (auth, client, admin)
│   │   └── routes/                 # Cấu hình React Router (/* và /admin/*)
│   ├── eslint.config.js            # Cấu hình ESLint chuẩn
│   ├── vite.config.ts
│   ├── .env.example
│   └── package.json
│
├── .gitignore                      # File cấu hình Git ignore
├── DESIGN.md                       # Design System Tokens chuẩn (Giao diện thống nhất)
├── package.json                    # Root npm workspace manifest & monorepo scripts
└── README.md                       # Tài liệu hướng dẫn dự án
```

---

## 3. Danh mục Scripts Monorepo (`package.json`)

| Script | Mô tả chức năng | Workspace tác động |
| :--- | :--- | :--- |
| `npm run backend:dev` | Khởi chạy NestJS Dev Server (`start:dev`, port 3000) | `lyora_backend` |
| `npm run backend:build` | Build production bundle cho Backend NestJS | `lyora_backend` |
| `npm run backend:test` | Chạy bộ test Jest cho Backend | `lyora_backend` |
| `npm run backend:lint` | Chạy ESLint kiểm tra mã nguồn Backend | `lyora_backend` |
| `npm run web:dev` | Khởi chạy Vite Dev Server cho Unified Web (port 5173) | `lyora_web` |
| `npm run web:build` | Build bundle production cho Unified Web | `lyora_web` |
| `npm run web:test` | Chạy test cho Unified Web | `lyora_web` |
| `npm run web:lint` | Chạy ESLint kiểm tra mã nguồn Unified Web | `lyora_web` |
| `npm run dev` | Chạy song song cả Backend và Web | Tất cả |
| `npm run build` | Build tất cả các workspaces | Tất cả |
| `npm run test` | Chạy test trên tất cả các workspaces | Tất cả |
| `npm run lint` | Chạy ESLint song song trên cả Backend và Web | Tất cả |

---

## 4. Nguồn chân lý kiến trúc (Architecture Sources of Truth)

- **Web Frontend (`lyora_web`):** Đọc kỹ hướng dẫn tại [architecture_web/](architecture_web/README.md).
- **Backend API (`lyora_backend`):** Đọc kỹ hướng dẫn tại [architecture_backend/](architecture_backend/README.md).
- **Design Tokens & Theme:** Đọc kỹ hướng dẫn tại [DESIGN.md](DESIGN.md).
- **AI Skills & Rules:** Đọc kỹ hướng dẫn tại [.agents/](.agents/README.md).
