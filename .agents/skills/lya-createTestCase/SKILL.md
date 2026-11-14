---
name: lya-createTestCase
description: >-
  Đọc implementation thực tế và tạo test cases cho feature.
---

# lya-createTestCase

Mục đích: Đọc implementation thực tế và tạo test cases cho feature trong dự án Lyora Monorepo (`lyora_backend` và `lyora_web`).

## Quy trình thực hiện (Workflow)

### Step 1 — Gather context
Đọc Requirement + Existing Code + Business Logic + Architecture (`architecture_web/`, `architecture_backend/`) + Error Handling.
**Ràng buộc:** KHÔNG được chỉ dựa vào requirement. Phải dựa trên code thực tế đã viết trong workspace tương ứng.

### Step 2 — Determine test coverage
Tạo Test Case bao phủ các trường hợp sau (chọn lọc cho phù hợp với feature):
- Happy Path
- Negative Case
- Boundary / Edge Conditions
- Validation (Form Zod validation / NestJS DTO class-validator)
- Core Infrastructure & Utilities (`@core`)
- Data Layer TanStack Query Hooks & Services (`@features`)
- View-Controller Integration (`@ui`)
- Permission & Role-based Access Control (Client vs Admin roles)
- Authentication (JWT token lifecycle)
- Network Error / API Error (4xx, 5xx, timeout handling)
- Empty State / Loading State / Error State
- Concurrency & Race Conditions
- Regression

### Step 3 — Generate Test Cases
Trình bày các test cases rõ ràng với input, expected output, và setup conditions (tương ứng với Vitest cho Frontend hoặc Jest cho Backend).
