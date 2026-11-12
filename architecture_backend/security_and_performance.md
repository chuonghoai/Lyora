# Security & Performance Rules (NestJS)

## 1. Authentication & Authorization

- **JWT (JSON Web Token):**
  - Mọi request yêu cầu xác thực phải được kiểm tra qua `JwtAuthGuard` (hiện thực bằng `@nestjs/passport` và `passport-jwt`).
  - Hệ thống cung cấp cơ chế Dual-Token:
    - `AccessToken`: Thời gian sống ngắn (ví dụ: 15–30 phút) dùng để xác thực request thông thường.
    - `RefreshToken`: Thời gian sống dài (ví dụ: 7–30 ngày) dùng để cấp lại AccessToken mới.
- **Session Management trong Redis:**
  - Refresh Token và thông tin phiên đăng nhập đang hoạt động phải được lưu trong Redis (thông qua `ioredis` hoặc `cache-manager`).
  - Cho phép người dùng theo dõi và thu hồi phiên đăng nhập từ xa ("Đăng xuất khỏi thiết bị khác").
- **Token Blacklist:**
  - Khi người dùng đăng xuất, AccessToken hiện tại phải được đưa vào Redis Blacklist với thời gian sống (TTL) bằng chính thời gian còn lại trước khi token hết hạn.
  - `JwtAuthGuard` kiểm tra Redis blacklist trước khi cho phép request đi qua.
- **Role-based Access Control (RBAC):**
  - Sử dụng decorator `@Roles('ADMIN', 'STAFF')` và `RolesGuard` để kiểm soát phân quyền trên từng endpoint.

---

## 2. Quản lý Secrets & Mã hóa (Cryptography)

- **Tuyệt đối KHÔNG hard-code Secrets:**
  - Toàn bộ secret keys, JWT secret, database credentials, Redis URL, API keys bên thứ ba đều phải được tải thông qua `@nestjs/config` (`ConfigService`) từ file `.env`.
- **Hashing vs Encryption:**
  - **Mật khẩu (Hashing 1 chiều):** Bắt buộc sử dụng thuật toán băm an toàn như `bcrypt` (với salt rounds tối thiểu 10) hoặc `argon2`. Tuyệt đối không bao giờ lưu mật khẩu dạng cleartext hoặc dùng MD5/SHA đơn thuần.
  - **Mã hóa dữ liệu nhạy cảm (Encryption 2 chiều):** Nếu cần giải mã ngược (ví dụ token bên thứ 3), sử dụng module `crypto` của Node.js với thuật toán `AES-256-GCM`.

---

## 3. Redis, Caching & Chống lạm dụng (Abuse Prevention)

- **OTP & Cooldown Logic:**
  - Mã OTP gửi về email/SMS và giới hạn thời gian gửi lại (Cooldown) bắt buộc lưu trữ trong Redis với TTL cố định:
    - OTP Key: `otp:<action>:<identifier>` (TTL: 5 phút).
    - Cooldown Key: `cooldown:otp:<action>:<identifier>` (TTL: 60 giây).
- **Rate Limiting (Giới hạn tốc độ gọi API):**
  - Cấu hình `@nestjs/throttler` kết hợp Redis Throttler Storage để bảo vệ các endpoint nhạy cảm (Đăng nhập, Quên mật khẩu, Gửi OTP) chống tấn công brute-force.
- **Caching Layer:**
  - Caching các dữ liệu đọc nhiều nhưng ít thay đổi (Danh mục, Cấu hình hệ thống, Dữ liệu tĩnh) bằng Redis Cache với TTL hợp lý.
  - Thực hiện xóa cache tương ứng (Cache Invalidation) khi dữ liệu bị thay đổi qua các mutation (`create`, `update`, `delete`).

---

## 4. Tối ưu hóa Database & Hiệu năng hệ thống

- **Transaction Management:**
  - Sử dụng transaction (`DataSource.transaction()` hoặc `Prisma.$transaction()`) khi thực hiện các tác vụ ghi đa bước để đảm bảo tính toàn vẹn dữ liệu.
- **Tránh lỗi N+1 Query:**
  - Khi sử dụng TypeORM: Sử dụng `relations: [...]` hoặc QueryBuilder với `leftJoinAndSelect`.
  - Khi sử dụng Prisma: Sử dụng `include: { ... }` hoặc `select: { ... }`.
  - Tuyệt đối không query dữ liệu quan hệ trong vòng lặp `for`/`map`.
- **Phân trang bắt buộc (Pagination):**
  - Mọi API trả về danh sách dữ liệu có nguy cơ tăng trưởng đều bắt buộc hỗ trợ phân trang (Pagination DTO nhận `page`, `limit` hoặc cursor-based).
- **Indexing:**
  - Khai báo `@Index()` trên các cột thường xuyên dùng trong điều kiện tìm kiếm, sắp xếp hoặc khóa ngoại (`userId`, `status`, `createdAt`).
