---
name: lya-reviewSecurityPerformance
description: >-
  Review security, safety, performance và quality của branch được chỉ định so với dev trong Lyora Monorepo.
---

# lya-reviewSecurityPerformance

Mục đích: Review security, safety, performance và quality của branch được chỉ định so với `dev` trong dự án Lyora Monorepo (`lyora_backend`, `lyora_client`, `lyora_admin`, `web_shared`).

## Dependencies
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Compare
So sánh target branch vs `dev`. Xác định toàn bộ code thay đổi giữa các workspace.

### Step 2 — Security Review
Kiểm tra các khía cạnh:
- **Secrets Isolation (Ranh giới bảo mật secrets):** **TUYỆT ĐỐI KHÔNG** để lọt database password, JWT secret, private API keys vào `web_shared` hoặc các bundle frontend (`lyora_client`, `lyora_admin`). Toàn bộ secrets phải nằm trong `.env` của `lyora_backend`.
- **Authentication:** JWT access/refresh token lifecycle, Redis session management, token blacklist khi logout.
- **Authorization:** Phân quyền theo vai trò giữa Client và Admin (RolesGuard, `@Roles`), kiểm soát leo thang đặc quyền (Privilege Escalation).
- **API Security:** Rate limiting (`@nestjs/throttler`), DTO validation (`class-validator` với `whitelist: true`), CORS, Helmet headers.
- **Cryptography:** Mật khẩu bắt buộc hash bằng bcrypt/argon2; mã hóa đối xứng AES-256-GCM cho dữ liệu nhạy cảm cần giải mã.
- **Web Client Security:** Chống XSS (không dùng `dangerouslySetInnerHTML`), không lưu thông tin nhạy cảm (mật khẩu) trong `localStorage`.

### Step 3 — Performance Review
- **Web Client & Admin (ReactJS):** Bundle size, Code splitting (React.lazy), tối ưu TanStack Query staleTime, tải ảnh tối ưu qua `AppImage`.
- **Shared Resources (`web_shared`):** Kiểm tra các utilities và components dùng chung có bị phình to (bloated) hoặc tạo re-render không đáng có không.
- **API & Network:** N+1 Query (TypeORM/Prisma), pagination bắt buộc trên danh sách lớn, Redis caching cho dữ liệu đọc nhiều.
- **Backend (`lyora_backend`):** Database indexing, hiệu quả câu lệnh SQL/QueryBuilder.

### Output
Tạo báo cáo chi tiết về Security & Performance, phân loại theo Reporting Rules (`BLOCKER`, `HIGH`, `MEDIUM`, `LOW`, `INFO`).
