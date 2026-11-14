---
name: lya-review-code
description: >-
  Review branch hiện tại so với branch main. 
  Đánh giá functional, architecture, code quality, và design trong Lyora Monorepo.
---

# lya-review-code

Mục đích: Review branch hiện tại so với `main` trong dự án Lyora Monorepo (`lyora_backend` và `lyora_web`).

## Dependencies
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)
- [Shared UI & Content Consistency Rules](../../rules/shared-ui-l10n-rules.md)
- UI/Design rules: `DESIGN.md`

## Quy trình thực hiện (Workflow)

### Step 1 — Xác định branch
- Current branch
- Target branch = `main` (hoặc `origin/main`)

### Step 2 — Compare
So sánh branch hiện tại với `main` (hoặc `origin/main`). Xác định chính xác files added, modified, deleted giữa các workspace (`lyora_backend`, `lyora_web`).

### Step 3 — Understand implementation
Đọc implementation của branch hiện tại để hiểu: chức năng, business flow, data flow, architecture, dependency chéo.

### Step 4 — Check Architecture rules
Đọc kỹ các tài liệu kiến trúc tương ứng:
- Frontend: `architecture_web/` (`lyora_web`: `core`, `features`, `ui`, `routes`).
- Backend: `architecture_backend/` (`lyora_backend`).

### Step 5 — Review
Đánh giá trên 4 khía cạnh:
1. **Functional:** Requirement, happy path, edge case, error handling, permission/auth guards (Client vs Admin).
2. **Architecture & Shared Discipline:** Đúng kiến trúc không? Thành phần dùng chung đã đặt tại `@core` chưa? Data Layer (`features`) và UI Layer (`ui`) có bị trộn lẫn không? TanStack Query có bị rò rỉ vào UI không? Có bị lộ backend secrets không?
3. **Code Quality:** Readability, maintainability, naming, type safety (tránh `any`), ESLint compliance (`npm run lint`).
4. **Design & Content:** Bố cục, tương tác, consistency so với `DESIGN.md` (giao diện thống nhất). Văn bản sử dụng Tiếng Việt chuẩn mực, không dùng i18n placeholders. Tuân thủ tiêu chí chống AI-slop từ [design-taste-frontend](../design-taste-frontend/SKILL.md).

### Output
Tạo review report với cấu trúc:
- Summary
- Changed Scope (Workspace breakdown)
- Functional Review
- Architecture Review
- Code Quality Review
- Design Review
- Issues (Gắn nhãn BLOCKER, HIGH, MEDIUM, LOW, INFO)
- Risk & Recommendation
