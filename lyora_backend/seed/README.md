# Lyora Backend — Seed Data Documentation

Tài liệu hướng dẫn và quản lý dữ liệu mẫu (Seed Data) cho hệ thống Backend API (`lyora_backend`) thuộc dự án Lyora Monorepo.

---

## A. Tổng quan (Overview)

- **Mục đích của thư mục `seed/`**: Cung cấp cấu trúc mã nguồn TypeScript chuẩn hóa để khởi tạo, nạp và quản lý dữ liệu mẫu ban đầu cho toàn bộ các bảng trong cơ sở dữ liệu PostgreSQL (`lyora_db`).
- **Vai trò trong Phát triển & Kiểm thử**:
  - Đảm bảo môi trường phát triển cục bộ (Local Development) và kiểm thử tích hợp (Integration/E2E Testing) luôn có sẵn dữ liệu chuẩn mực, phản ánh đúng các ràng buộc CSDL (Constraints, Foreign Keys, Enums, Unique Indexes).
  - Giúp các nhà phát triển Frontend (`lyora_web`) và Backend (`lyora_backend`) có ngay các tài khoản đăng nhập, danh sách bạn bè, cuộc hội thoại (1-1 và nhóm), bài viết, bình luận và cảm xúc để kiểm thử đầy đủ các luồng nghiệp vụ trên Cổng Người Dùng (`/`) và Trung Tâm Quản Trị (`/admin`).
- **File Entry Point**: `seed/createSeedDB.ts` — Thực thi kiểm tra an toàn môi trường, kết nối TypeORM `DataSource`, điều phối nạp dữ liệu tuần tự theo cây quan hệ và kiểm chứng số lượng bản ghi thực tế trong tất cả các bảng sau khi chèn.
- **Phạm vi áp dụng**: Dữ liệu seed được thiết kế **chỉ dành riêng cho môi trường Development và Testing**.

---

## B. Tài khoản đăng nhập mặc định (Default Login Accounts)

Hệ thống được thiết lập sẵn hai tài khoản đăng nhập bắt buộc phục vụ quá trình phát triển và kiểm thử:

| Vai trò (Role) | Email | Mật khẩu mẫu | Phân quyền Backend thực tế | Trạng thái | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Admin** | `admin@gmail.com` | `123456` | `UserRole.ADMIN` (`ADMIN`) | Hoạt động (`isActive: true`) | Đăng nhập Trung Tâm Quản Trị (`/admin`), quản trị và kiểm duyệt cộng đồng |
| **User** | `user@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Đăng nhập Cổng Người Dùng (`/`), tương tác bài viết, kết bạn và nhắn tin |

### Các tài khoản kiểm thử bổ sung (Supplementary Test Accounts):

| Vai trò (Role) | Email | Mật khẩu mẫu | Phân quyền Backend thực tế | Trạng thái | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Inactive Client** | `inactive@lyora.com` | `Client@123456` | `UserRole.CLIENT` (`CLIENT`) | Tạm khóa (`isActive: false`) | Kiểm thử xử lý lỗi đăng nhập tài khoản bị vô hiệu hóa (`ForbiddenException`) |
| **Friend 1** | `friend1@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Bạn bè (`ACCEPTED`) của `user@gmail.com`, tham gia chat 1-1, nhóm và tương tác bài viết |
| **Friend 2** | `friend2@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Bạn bè (`ACCEPTED`) của `user@gmail.com`, tham gia chat 1-1, nhóm và đăng bài viết |
| **Friend 3** | `friend3@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Bạn bè (`ACCEPTED`) của `user@gmail.com`, thành viên nhóm chat và tác giả bài viết |
| **Stranger** | `stranger@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Người dùng chưa kết bạn với `user@gmail.com` (phục vụ kiểm thử phân quyền & bảo mật) |

> [!IMPORTANT]
> **Ghi chú bảo mật & vận hành:**
> - Toàn bộ mật khẩu được băm (hash) bằng thuật toán **Bcrypt** (`salt rounds = 10`) trước khi lưu trữ vào cột `passwordHash` của bảng `users`. Tuyệt đối không lưu mật khẩu dạng văn bản thô (plaintext).
> - Vai trò và quyền hạn được gán chính xác theo enum `UserRole` (`ADMIN`, `CLIENT`) trong mã nguồn Backend (`src/common/enums/role.enum.ts`).
> - Cả hai tài khoản mặc định (`admin@gmail.com`, `user@gmail.com`) tương thích hoàn toàn với `AuthService.login`, `JwtStrategy` và `JwtAuthGuard`.
> - **TUYỆT ĐỐI KHÔNG** sử dụng các tài khoản mặc định này trên môi trường Production!

---

## C. Danh mục dữ liệu Seed (Seed Data Inventory)

Danh mục toàn bộ các file seed dữ liệu hiện có trong thư mục `lyora_backend/seed/`:

| STT | Seed File | Tên Bảng (Table) | Mô tả dữ liệu | Số bản ghi | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `users.seed.ts` | `users` | Tài khoản người dùng hệ thống (`ADMIN`, `CLIENT`, `INACTIVE`, bạn bè và stranger) | 7 | Complete |
| 2 | `friendships.seed.ts` | `friendships` | Quan hệ bạn bè `ACCEPTED` giữa `user@gmail.com` và `friend1..3` | 3 | Complete |
| 3 | `conversations.seed.ts` | `conversations` | Cuộc hội thoại mẫu (2 hội thoại `DIRECT` 1-1, 1 hội thoại `GROUP`) | 3 | Complete |
| 4 | `conversations.seed.ts` | `conversation_members` | Thành viên tham gia các hội thoại (`OWNER` cho trưởng nhóm, `MEMBER` cho thành viên & chat 1-1) | 8 | Complete |
| 5 | `conversations.seed.ts` | `idempotency_records` | Bản ghi idempotency mẫu gắn với cuộc hội thoại nhóm khởi tạo | 1 | Complete |
| 6 | `posts.seed.ts` | `posts` | Bài viết cộng đồng mẫu (3 `PUBLIC`, 1 `FRIENDS`, 1 `PRIVATE`) | 5 | Complete |
| 7 | `posts.seed.ts` | `post_comments` | Bình luận mẫu trên các bài viết | 4 | Complete |
| 8 | `posts.seed.ts` | `post_reactions` | Cảm xúc (`LIKE`, `LOVE`, `HAHA`, `WOW`) mẫu trên các bài viết | 6 | Complete |

- **Cấu hình & Tiện ích hỗ trợ**:
  - `seed.config.ts`: Khai báo `SEED_ENTITIES` (bao gồm toàn bộ 8 entities), khởi tạo TypeORM `DataSource` độc lập cho runner (hỗ trợ chuẩn hóa URL và SSL qua `parsePostgresConnectionConfig`), tích hợp hàm chặn an toàn `assertSafeEnvironment()`.
  - `createSeedDB.ts`: Điều phối thực thi tuần tự các hàm seed theo đúng cây phụ thuộc khóa ngoại và đối chiếu số lượng bản ghi thực tế trên cả 8 bảng.

---

## D. Quan hệ cơ sở dữ liệu & Thứ tự chèn (Database Relationships & Insert Order)

Để đảm bảo không vi phạm ràng buộc khóa ngoại (Foreign Key Constraints) và các ràng buộc kiểm tra (Check / Unique Constraints), quá trình seed dữ liệu tuân thủ thứ tự chèn nghiêm ngặt:

```text
1. users (Bảng gốc độc lập — Khởi tạo đầu tiên)
   │
   ├── 2. friendships (user_id, friend_id -> users.id [ON DELETE CASCADE]; CK: user_id != friend_id)
   │
   ├── 3. conversations (creator_id -> users.id [ON DELETE SET NULL]; CK: DIRECT có direct_user_key, GROUP có title)
   │      ├── 3a. conversation_members (conversation_id -> conversations.id, user_id -> users.id)
   │      └── 3b. idempotency_records (user_id -> users.id, resource_id -> conversations.id)
   │
   └── 4. posts (authorId -> users.id [ON DELETE CASCADE])
          ├── 4a. post_comments (postId -> posts.id, authorId -> users.id)
          └── 4b. post_reactions (postId -> posts.id, userId -> users.id; UQ: [postId, userId])
```

1. **Cấp 1 (Root Table)**: `users` — Định danh người dùng (`id: UUID`), phải được chèn đầu tiên.
2. **Cấp 2 (Social & Core Relations)**:
   - `friendships`: Liên kết giữa các `users` hợp lệ (`ACCEPTED` giữa `user@gmail.com` và `friend1..3`, đảm bảo điều kiện kết bạn trước khi tạo hội thoại).
   - `conversations`: Chèn hội thoại `DIRECT` (dùng canonical `direct_user_key = [idA, idB].sort().join(':')`) và hội thoại `GROUP` (kèm `creator_id`).
   - `posts`: Chèn bài viết với `authorId` hợp lệ và số đếm `reactionsCount`, `commentsCount`, `sharesCount` đồng bộ với dữ liệu con.
3. **Cấp 3 (Child / Dependent Tables)**:
   - `conversation_members` & `idempotency_records`: Chèn sau khi đã có `conversations` và `users`.
   - `post_comments` & `post_reactions`: Chèn sau khi đã có `posts` và `users`.

---

## E. Hướng dẫn thực thi (Execution)

### 1. Điều kiện tiên quyết (Prerequisites)
- Dịch vụ **PostgreSQL** đang chạy (local cổng `5432` hoặc PostgreSQL Cloud dành cho môi trường `dev`/`development` có hỗ trợ SSL).
- Cơ sở dữ liệu `lyora_db` đã được tạo.
- Cấu hình file `.env` tại `lyora_backend/.env` hoặc biến môi trường `DATABASE_URL` hợp lệ (mặc định fallback: `postgresql://postgres:postgres@localhost:5432/lyora_db`; tự động bật SSL nếu URL có `sslmode=require` hoặc `aivencloud.com`).

### 2. Lệnh thực thi nạp Seed Data
Từ thư mục gốc của Monorepo:
```bash
# Nạp dữ liệu mẫu vào Database
npm run backend:seed
```

Hoặc từ thư mục `lyora_backend`:
```bash
npm run seed:create
# Hoặc chạy trực tiếp qua ts-node:
npx ts-node -r tsconfig-paths/register seed/createSeedDB.ts
```

### 3. Mối liên hệ với Skill `/lya-insertSeedDB`
- Skill `/lya-createSeedDB` chỉ thực hiện audit, chuẩn bị file seed và đồng bộ tài liệu `seed/README.md` (không xóa CSDL).
- Skill `/lya-insertSeedDB` là quy trình thực thi đầy đủ (Clean & Seed):
  1. Chạy `script/deleteAllData.ts` (lệnh `npm run backend:db:reset`) để làm sạch toàn bộ CSDL via `TRUNCATE CASCADE`.
  2. Chạy `seed/createSeedDB.ts` (lệnh `npm run backend:seed`) để nạp lại toàn bộ dữ liệu mẫu chuẩn.
  3. Truy vấn xác thực số lượng bản ghi thực tế trong từng bảng và kiểm thử đăng nhập tài khoản mặc định.

---

## F. Lưu ý quan trọng (Important Notes)

> [!CAUTION]
> 1. **Môi trường:** Seed data chỉ dành cho `development` và `testing`. Hệ thống tích hợp sẵn cơ chế chặn tự động `assertSafeEnvironment()`, sẽ ném ngoại lệ và dừng ngay lập tức nếu phát hiện `NODE_ENV === 'production'` hoặc chuỗi kết nối chứa các host đám mây thật (`prod`, `production`, `rds.amazonaws.com`, `supabase.co`, `elephantsql.com`).
> 2. **Authentication Flow:** Tuyệt đối không sửa đổi authentication logic hoặc password hashing của Backend chỉ để phục vụ seed. Dữ liệu seed phải tuân thủ 100% chuẩn mật khẩu (`bcrypt`, 10 rounds) và phân quyền của Backend.
> 3. **An toàn dữ liệu:** Quá trình chạy `/lya-createSeedDB` KHÔNG được phép tự ý thực hiện xóa sạch Database. Việc xóa và nạp lại Database chỉ diễn ra khi kích hoạt `/lya-insertSeedDB`.
