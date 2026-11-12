---
name: lya-newFeature
description: >-
  Tiếp nhận mô tả của user về một chức năng mới và xây dựng Implementation Plan trước khi triển khai.
  Skill này sẽ phân tích requirement, inspect codebase và tạo plan.
---

# lya-newFeature

Mục đích: Tiếp nhận mô tả chức năng mới và xây dựng Implementation Plan trước khi triển khai trong dự án Lyora Monorepo (`lyora_backend` và `lyora_web`).

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Workflow](../../rules/shared-workflow.md)
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared UI & Content Consistency Rules](../../rules/shared-ui-l10n-rules.md)
- [Design Taste Skill](../design-taste-frontend/SKILL.md) (Bắt buộc đọc và áp dụng nếu tính năng có giao diện Web UI)

## Quy trình thực hiện (Workflow)

### Step 1 — Understand requirement
Đọc và phân tích toàn bộ mô tả chức năng user cung cấp.
Xác định:
- Mục tiêu, Actor (Khách hàng trên Cổng Client hay Quản trị viên trên Cổng Admin)
- User flow, Business flow
- Input / Output, Data schemas (Zod trong Frontend, class-validator DTO trong Backend)
- API cần sử dụng/tạo mới trong `lyora_backend` (REST Endpoints / WebSocket events)
- Database (TypeORM Entity, Schema), Web UI (theo `DESIGN.md`), State management (TanStack Query trong Data Layer / Zustand trong Core).
- Tái sử dụng: Kiểm tra `lyora_web/src/core` (`@core`) xem đã có components, hooks hoặc API utils liên quan chưa.
- Validation, Error handling, Permission (Guards), Edge cases.

### Step 2 — Inspect existing code & core resources
Tìm các feature/module có liên quan trong `lyora_backend/src/` và `lyora_web/src/` (`core`, `features`, `ui`).
**Ràng buộc:** Không được tạo component trùng lặp nếu `@core` đã cung cấp.

### Step 3 — Inspect architecture
Đọc các architecture document liên quan: `architecture_web/` và `architecture_backend/`.

### Step 4 — Inspect Git history
Kiểm tra các commit gần đây liên quan đến module/feature tương tự.

### Step 5 — Create Implementation Plan
Tạo Implementation Plan chỉ rõ:
- File cần tạo, file cần sửa (phân chia rõ `lyora_backend` và các layer của `lyora_web`: `core`, `features`, `ui`, `routes`).
- Component, Custom Hook, API Service, Model/DTO/Entity cần thêm/sửa.
- Flow dữ liệu, Architecture layer bị ảnh hưởng (View -> Controller -> Query Hook -> Service -> Repository -> Core API Client -> Backend).
- **Phân tích Routing (Frontend):** Khi tạo màn hình mới, tuân thủ React Router trong `src/routes/paths.ts` và `AppRoutes.tsx`.
- **Phân tích Web UI:** MUST tuân thủ tokens thống nhất từ `DESIGN.md`. Nếu tính năng có tạo mới UI, MUST áp dụng [design-taste-frontend](../design-taste-frontend/SKILL.md): đưa ra 1 dòng "Design Read", xác lập The Three Dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`), và tuân thủ Anti-Default Discipline.
- **Văn bản hiển thị:** Sử dụng tiếng Việt rõ ràng, mạch lạc, trực tiếp (không sử dụng i18n).
- **ESLint & Testing:** Đảm bảo code mới vượt qua ESLint (`npm run lint`), build (`npm run build`) và test.

**STOP CONDITION:** KHÔNG được viết code ngay nếu user chưa yêu cầu thực thi. Chỉ đưa ra plan và đợi XÁC NHẬN (Approval).
