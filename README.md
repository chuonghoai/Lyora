# Lyora — Cyber Keys & Licensed Software Platform

Lyora is an enterprise-grade e-commerce and management platform for software licenses and digital keys. The project is architected as an **npm Monorepo** comprising a NestJS backend API and a unified ReactJS web application.

---

## 1. Project Overview

The Lyora platform consists of two integrated workspaces:

- **`lyora_backend`**: RESTful API and WebSocket services built with NestJS, TypeScript, TypeORM, PostgreSQL, and Redis.
- **`lyora_web`**: Unified Web Frontend built with React 19, TypeScript, Vite, TailwindCSS, and TanStack Query. It serves both the **Client Portal** (public e-commerce & customer portal) and the **Admin Portal** (management dashboard).

Key Highlights:
- **Strict Layered Architecture:** Decoupled Core, Data, UI, and Routing layers.
- **Unified Visual Identity:** Implements the Cyber Precision design system (`DESIGN.md`) with a consistent single-theme appearance.
- **Unified Language:** 100% standard Vietnamese user-facing interface without complex i18n overhead.
- **Zero-Tolerance Quality:** Complete TypeScript strict typing and ESLint compliance across all workspaces.

---

## 2. Project Structure

```text
Lyora/
├── .agents/                        # AI Agent rules, skills, and standardized workflows
├── architecture_backend/           # Comprehensive NestJS Backend Architecture documentation
├── architecture_web/               # Comprehensive ReactJS Web Frontend Architecture documentation
├── DESIGN.md                       # Design System Tokens & Brand Visual Guidelines
│
├── lyora_backend/                  # Backend API Workspace (NestJS :3000)
│   ├── src/
│   │   ├── common/                 # Interceptors, Filters, Guards, Decorators, DTOs, BaseEntity
│   │   ├── config/                 # App, Database, JWT, and Redis configurations
│   │   ├── database/               # TypeORM PostgreSQL database module (auto-sync in dev)
│   │   ├── redis/                  # Redis caching service with local in-memory fallback
│   │   ├── modules/
│   │   │   ├── auth/               # Authentication, JWT dual-token lifecycle, bcrypt hashing
│   │   │   ├── users/              # User entity and profile management
│   │   │   └── health/             # System health check endpoints
│   │   └── main.ts                 # Application bootstrap (CORS, Helmet, ValidationPipe)
│   ├── test/                       # E2E & integration test suites
│   └── package.json
│
├── lyora_web/                      # Unified Web Frontend Workspace (React 19 + Vite :5173)
│   ├── src/
│   │   ├── core/                   # Shared technical infrastructure (apiClient, storage, toast, stores, UI primitives)
│   │   ├── features/               # Pure TypeScript Data Layer (Repositories, Services, Query Hooks, Models)
│   │   │   ├── auth/               # Auth feature (useLoginMutation, authService, authRepository, authKeys)
│   │   │   ├── system/             # System health feature (useSystemHealthQuery, systemKeys)
│   │   │   └── user/               # User profile feature (useUserProfileQuery, userKeys)
│   │   ├── ui/                     # UI View Layer (Strictly 3 root modules: admin, auth, client)
│   │   │   ├── admin/              # Admin Portal (AdminLayout, DashboardView, dashboard.controller)
│   │   │   ├── auth/               # Authentication Views (LoginView, login.controller, LoginForm)
│   │   │   └── client/             # Customer Portal (ClientLayout, HomeView, home.controller)
│   │   ├── routes/                 # Centralized routing (AppRoutes.tsx, paths.ts, RoleRoute, GuestRoute)
│   │   └── tests/                  # Vitest unit & integration test suites
│   ├── vite.config.ts              # Vite configuration with path aliases (@, @core, @features, @ui)
│   └── package.json
│
├── package.json                    # Root workspace orchestrator scripts
└── README.md                       # Master project documentation
```

---

## 3. Technology Stack

| Layer | Backend (`lyora_backend`) | Frontend (`lyora_web`) |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js (>=18), TypeScript 5.9 | Browser, TypeScript 5.9 |
| **Framework & Build** | NestJS 11, `@nestjs/cli` | React 19, Vite 8 |
| **Database & Cache** | PostgreSQL, TypeORM 0.3, Redis 7 (`ioredis`) | StorageService, TokenStorage |
| **Server State & Data**| - | TanStack React Query 5 (10-min default cache) |
| **Client State** | - | Zustand 5 (`authStore`, `toastStore`, `websocketStore`) |
| **Validation** | `class-validator`, `class-transformer` | Zod 4 runtime schemas |
| **Styling** | - | TailwindCSS 4, Custom Design Tokens |
| **Routing & Guards** | NestJS Guards (`JwtAuthGuard`, `RolesGuard`) | React Router 7 (`RoleRoute`, `GuestRoute`) |
| **HTTP Transport** | Express, Helmet, CORS | Axios 1.13 with 401 refresh token queue |
| **Testing Engine** | Jest 30 | Vitest 5 |
| **Code Linter** | ESLint 9 (Flat Config) | ESLint 9 (Flat Config) |

---

## 4. Architecture Overview

### 4.1. Unidirectional Data Flow

Lyora Web enforces a strict, single-direction data flow with decoupled boundaries:

```text
[UI View] (*View.tsx)
    │  Initializes controller once: `const controller = use...Controller()`
    ▼
[UI Controller] (*.controller.ts)
    │  Dispatches mutation/query from Data Layer
    ▼
[Query Hook] (*.query.ts) ── [Query Key Factory] (*.keys.ts)
    │  Calls domain service
    ▼
[Feature Service] (*.service.ts)
    │  Executes client business logic, updates storage
    ▼
[Feature Repository] (*.repository.ts)
    │  Abstracts HTTP calls
    ▼
[Core API Client] (apiClient.ts)
    │  Injects Bearer token & handles 401 token refresh queue
    ▼
[NestJS Backend API] (:3000/api)
```

### 4.2. View-Controller Contract

- Every View initializes its controller **exactly once**: `const controller = use[ModuleName]Controller();`.
- The View directly accesses state and handlers via the `controller` object (e.g., `controller.handleSubmit`, `controller.formData`, `controller.isLoading`).
- Zero destructuring or handler re-declaration in Views.
- Subcomponents directly receive `{ controller: [ModuleName]Controller }`.

### 4.3. Cache Configuration

- Default system-wide `staleTime`: **10 minutes** (`600,000 ms`).
- Default system-wide `gcTime`: **15 minutes** (`900,000 ms`).
- Cache invalidation is centralized via hierarchical Query Key Factories (`authKeys`, `systemKeys`, `userKeys`).

---

## 5. Installation & Setup

### 5.1. Prerequisites

- **Node.js:** Version `20.x` or `22.x` (LTS recommended).
- **npm:** Version `10.x` or higher.
- **PostgreSQL:** Version `15+` running on `localhost:5432` with database `lyora_db`.
  - Alternatively, run via Docker:
    ```bash
    docker run --name lyora-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lyora_db -p 5432:5432 -d postgres:16-alpine
    ```

### 5.2. Install Dependencies

Install all dependencies across both workspaces from the monorepo root:

```bash
npm install
```

### 5.3. Environment Configuration

Create or verify the `.env` file inside `lyora_backend/.env`:

```env
PORT=3000
NODE_ENV=dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lyora_db
JWT_SECRET=lyora_development_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=lyora_development_refresh_secret_key_2026
JWT_REFRESH_EXPIRES_IN=30d
```

*(Note: In `NODE_ENV=dev`, TypeORM automatically synchronizes the database schema and creates necessary tables on startup).*

### 5.4. Running the Development Environment

Start both Backend and Frontend concurrently:

```bash
npm run dev
```

Or run workspaces individually:

```bash
# Start Backend only (:3000)
npm run backend:dev

# Start Frontend only (:5173)
npm run web:dev
```

---

## 6. Monorepo Scripts Reference

All primary operations can be executed from the monorepo root:

| Command | Action | Workspace Target |
| :--- | :--- | :--- |
| `npm run dev` | Run Backend and Frontend concurrently | Both |
| `npm run build` | Build all workspaces for production | Both |
| `npm run test` | Execute test suites across all workspaces | Both |
| `npm run lint` | Run ESLint checks concurrently | Both |
| `npm run backend:dev` | Start NestJS in watch mode (`:3000`) | `lyora_backend` |
| `npm run backend:build`| Compile NestJS production bundle | `lyora_backend` |
| `npm run backend:test` | Run Jest unit & e2e tests | `lyora_backend` |
| `npm run backend:lint` | Run ESLint with auto-fix | `lyora_backend` |
| `npm run web:dev` | Start Vite dev server (`:5173`) | `lyora_web` |
| `npm run web:build` | Run TypeScript check & Vite build | `lyora_web` |
| `npm run web:test` | Run Vitest unit & integration test suites | `lyora_web` |
| `npm run web:lint` | Run ESLint checks | `lyora_web` |

---

## 7. Testing & Quality Verification

To verify full project health:

```bash
# 1. Run all linters (must return 0 errors)
npm run lint

# 2. Run all builds (TypeScript & bundler compilation)
npm run build

# 3. Run all test suites
npm run test
```

Current test coverage:
- `lyora_backend`: Jest unit and health tests pass (100%).
- `lyora_web`: Vitest test suites (46 tests across 10 test files) pass (100%).

---

## 8. Official Documentation Links

- **Backend Architecture:** [architecture_backend/README.md](architecture_backend/README.md)
  - [API Rules & Conventions](architecture_backend/api_rules.md)
  - [Security & Performance Guidelines](architecture_backend/security_and_performance.md)
  - [Development Workflow & Lifecycle](architecture_backend/workflow.md)
- **Frontend Architecture:** [architecture_web/README.md](architecture_web/README.md)
  - [View-Controller Architecture](architecture_web/architecture/controller.md)
  - [Data Flow & TanStack Query](architecture_web/architecture/data_flow.md)
  - [UI View Layer Rules](architecture_web/architecture/ui.md)
  - [Service & Repository Pattern](architecture_web/architecture/service_repository.md)
  - [Core State & Providers](architecture_web/architecture/provider.md)
  - [Routing & Navigation](architecture_web/navigation/README.md)
  - [Feature Development & Definition of Done](architecture_web/feature-development/README.md)
- **Design System & Tokens:** [DESIGN.md](DESIGN.md)
- **AI Agent Guidelines & Skills:** [.agents/README.md](.agents/README.md)
