---
name: lya-analyzeTask
description: >-
  Phân tích một task trước khi bắt đầu implementation.
  Không thực hiện thay đổi code, chỉ trả về phân tích. 
  Đặc biệt chú ý phân tích scope (lyora_client, lyora_admin, lyora_backend, web_shared) và tái sử dụng tài nguyên.
---

# lya-analyzeTask

Mục đích: Phân tích một task trước khi bắt đầu implementation trong dự án Lyora Monorepo.

## Dependencies
- [Shared UI & Content Consistency Rules](../../rules/shared-ui-l10n-rules.md)
- [Design Taste Skill](../design-taste-frontend/SKILL.md) (Đối chiếu khi task có phạm vi liên quan đến UI/Frontend)

## Quy trình thực hiện (Workflow)

### Step 1 — Analyze
Đọc yêu cầu task, phân tích trong ngữ cảnh của codebase hiện tại.
Xác định:
- Requirement
- Scope: Xác định rõ task thuộc về `lyora_client` (Web khách hàng), `lyora_admin` (Web quản trị), `lyora_backend` (API backend), hay `web_shared` (Tài nguyên dùng chung).
- Tái sử dụng tài nguyên: Kiểm tra xem `@lyora/web-shared` đã có components, hooks, utils hoặc types liên quan chưa.
- Affected Files & Modules
- Dependencies
- Architecture Impact: Đối chiếu với `web_architecture/` và `backend_architecture/`.
- UI & Content Impact: Đánh giá xem task có tạo mới/chỉnh sửa UI không; đối chiếu quy chuẩn Design Tokens từ `DESIGN.md` (giao diện thống nhất), ngôn ngữ Tiếng Việt chuẩn mực (không dùng i18n), và các nguyên tắc thiết kế từ [design-taste-frontend](../design-taste-frontend/SKILL.md).
- Risk, Unknowns, Questions, Implementation Recommendation.

### Step 2 — Report
Trình bày kết quả phân tích theo các mục trên.
**Ràng buộc:** Skill này KHÔNG được phép tự viết code.
