---
name: lya-fixbug
description: >-
  Phân tích bug và tạo Implementation Plan để sửa bug.
  Truy vết root cause và đưa ra phương án sửa lỗi an toàn.
---

# lya-fixbug

Mục đích: Phân tích bug và tạo Implementation Plan để sửa bug trong dự án Lyora Monorepo (`lyora_backend`, `lyora_client`, `lyora_admin`, `web_shared`).

## Dependencies
- [Shared Workflow](../../rules/shared-workflow.md)
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared UI & Content Consistency Rules](../../rules/shared-ui-l10n-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Understand bug
Đọc kỹ bug description. Xác định:
- Expected behavior vs Actual behavior
- Reproduction condition
- Affected workspace: `lyora_client`, `lyora_admin`, `lyora_backend`, hay `web_shared`
- Severity

### Step 2 — Trace
Tìm tất cả code liên quan. KHÔNG chỉ tìm file có tên giống bug.
Phải trace toàn bộ flow: `UI Component (Client/Admin) -> Custom Hook -> Shared Component/apiClient (@lyora/web-shared) -> NestJS Controller -> NestJS Service -> Repository / Database` (khi phù hợp).

### Step 3 — Inspect Git history
Kiểm tra commit gần nhất, commit thay đổi behavior, commit liên quan feature, commit fix bug tương tự.

### Step 4 — Determine Root Cause
Xác định nguyên nhân cốt lõi. Phân biệt rõ ràng giữa "Symptom" (triệu chứng) và "Root Cause" (nguyên nhân gốc rễ).

### Step 5 — Create Implementation Plan
Plan phải bao gồm:
- Root cause
- Affected files & Affected flow
- Proposed fix
- Nếu fix có thay đổi UI/Text: MUST đảm bảo tuân thủ tokens thống nhất từ `DESIGN.md` và tiếng Việt chuẩn mực theo `shared-ui-l10n-rules.md`. Áp dụng các nguyên tắc từ [design-taste-frontend](../design-taste-frontend/SKILL.md) trong phạm vi cục bộ của bug; **TUYỆT ĐỐI KHÔNG** tự ý redesign toàn bộ màn hình hoặc mở rộng phạm vi ngoài yêu cầu sửa lỗi.
- Nếu fix liên quan đến Shared Resources: Kiểm tra xem thay đổi trong `web_shared` có gây ảnh hưởng (side effects) đến dự án frontend còn lại hay không.
- Side effects & Regression risks
- Test cases cần kiểm tra

**STOP CONDITION:** KHÔNG được sửa code ngay nếu user chỉ yêu cầu tạo plan.
