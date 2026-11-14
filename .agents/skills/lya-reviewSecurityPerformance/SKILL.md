---
name: lya-reviewSecurityPerformance
description: >-
  Review security, safety, performance và quality của branch được chỉ định so với dev trong Lyora Monorepo.
---

# lya-reviewSecurityPerformance

Mục đích: Review security, safety, performance và quality của branch được chỉ định so với `dev` trong dự án Lyora Monorepo (`lyora_backend` và `lyora_web`).

## Dependencies
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Compare
So sánh target branch vs `dev`. Xác định toàn bộ code thay đổi giữa các workspace.

### Step 2 — Security Review
Kiểm tra các khía cạnh:
- **Secrets Isolation (Ranh giới bảo mật secrets):** **TUYỆT ĐỐI KHÔNG** để lọt database password, JWT secret, private API keys vào bundle của `lyora_web`. Toàn bộ secrets phải nằm trong `.env` của `lyora_backend`.
- **Authentication:** JWT access/refresh token lifecycle, Redis session management, token storage an toàn.
- **Authorization:** Phân quyền theo vai trò giữa Client và Admin (`RoleRoute`, `RolesGuard`, `@Roles`), kiểm soát leo thang đặc quyền (Privilege Escalation).
- **API Security:** Rate limiting (`@nestjs/throttler`), DTO validation (`class-validator` với `whitelist: true`), CORS, Helmet headers.
- **Cryptography:** Mật khẩu bắt buộc hash bằng bcrypt; mã hóa đối xứng cho dữ liệu nhạy cảm.
- **Web Client Security:** Chống XSS (không dùng `dangerouslySetInnerHTML`), không lưu thông tin nhạy cảm (mật khẩu) trong `localStorage`.

### Step 3 — Performance Review
- **Web Frontend (`lyora_web`):** Bundle size, Code splitting (`React.lazy`), tối ưu TanStack Query `staleTime` (10 phút mặc định) và `gcTime` (15 phút), tải ảnh tối ưu qua `AppImage`.
- **Core Primitives (`@core`):** Kiểm tra các utilities và components dùng chung có bị phình to (bloated) hoặc tạo re-render không đáng có không.
- **API & Network:** N+1 Query (TypeORM), pagination bắt buộc trên danh sách lớn, Redis caching cho dữ liệu đọc nhiều.
- **Backend (`lyora_backend`):** Database indexing, hiệu quả câu lệnh SQL/QueryBuilder, auto-synchronize chỉ cho môi trường development.

### Output
Tạo báo cáo chi tiết về Security & Performance, phân loại theo Reporting Rules (`BLOCKER`, `HIGH`, `MEDIUM`, `LOW`, `INFO`).
