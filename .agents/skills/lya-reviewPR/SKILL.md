---
name: lya-reviewPR
description: >-
  Workflow tổng hợp để review PR. Thực hiện functional, architecture, design, security và performance review. Chờ user approve trước khi merge và dọn dẹp.
---

# lya-reviewPR

Mục đích: Workflow tổng hợp và là Skill quan trọng nhất để quản lý vòng đời Pull Request (PR) trong dự án Lyora Monorepo (`lyora_backend` và `lyora_web`).

## Dependencies
- [lya-review-code](../lya-review-code/SKILL.md)
- [lya-reviewSecurityPerformance](../lya-reviewSecurityPerformance/SKILL.md)
- [Shared Git Rules](../../rules/shared-git-rules.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)
- [Shared UI & Content Consistency Rules](../../rules/shared-ui-l10n-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Branch comparison
So sánh branch được chỉ định với `main` (hoặc `origin/main`). Xác định commits, files, additions, modifications, deletions theo từng workspace (`lyora_backend`, `lyora_web`).

### Step 2 — Understand implementation
Đọc code của branch để hiểu toàn bộ chức năng và luồng dữ liệu.

### Step 3 — Thực hiện `lya-review-code`
Đánh giá Functional, Architecture, Code Quality, Design, việc sử dụng `@core` và ESLint.

### Step 4 — Thực hiện `lya-reviewSecurityPerformance`
Đánh giá Security và Performance. Đảm bảo tuyệt đối không rò rỉ secrets backend vào frontend.

### Step 5 — Audit Report
Tạo PR Audit Report với format sau:
```markdown
# PR Audit Report
## 1. Branch Information
## 2. Scope of Changes (lyora_backend, lyora_web: core, features, ui, routes)
## 3. Functional Assessment
## 4. Architecture Assessment (Layer separation, Core usage, View-Controller)
## 5. Design Assessment (DESIGN.md tokens, unified theme)
## 6. Security Assessment (Backend secrets protection)
## 7. Performance Assessment (Cache staleTime/gcTime, query invalidation)
## 8. Code Quality Assessment (ESLint compliance)
## 9. Issues (Severity, File, Location, Problem, Why it matters, Recommendation)
## 10. Risk Assessment
## 11. Merge Recommendation
## 12. Required Fixes
```

### Step 6 — STOP (WAIT FOR USER ACCEPTANCE)
**Ràng buộc nghiêm ngặt:** Sau khi report hoàn thành, KHÔNG được merge.
Phải dừng và chờ user xác nhận. Chỉ khi user explicitly accept/approve mới được đi tiếp.

### Step 7 — Merge và Cleanup
Sau khi user xác nhận merge:
1. Merge branch vào `main`.
2. Kiểm tra merge thành công.
3. Xác nhận working tree.
4. Xóa branch local và remote (nếu là feature branch riêng).
5. Checkout và pull `main` (`git checkout main && git pull origin main`).
6. Clean workspace.
