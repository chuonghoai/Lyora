# Lyora Backend — Seed Data Documentation

Tài liệu hướng dẫn và quản lý dữ liệu mẫu (Seed Data) cho hệ thống Backend API (`lyora_backend`) thuộc dự án Lyora Monorepo.

---

## A. Tổng quan (Overview)

- **Mục đích của thư mục `seed/`**: Cung cấp cấu trúc mã nguồn TypeScript chuẩn hóa để khởi tạo, nạp và quản lý dữ liệu mẫu ban đầu cho cơ sở dữ liệu PostgreSQL (`lyora_db`).
- **Vai trò trong Phát triển & Kiểm thử**: 
  - Đảm bảo môi trường phát triển cục bộ (Local Development) và kiểm thử tích hợp (Integration/E2E Testing) luôn có sẵn dữ liệu chuẩn mực, phản ánh đúng các ràng buộc CSDL (Constraints, Foreign Keys, Enums, Unique Indexes).
  - Giúp các nhà phát triển Frontend (`lyora_web`) và Backend (`lyora_backend`) có ngay các tài khoản đăng nhập để kiểm thử các luồng nghiệp vụ trên Cổng Khách Hàng (Client Portal) và Trung Tâm Quản Trị (Admin Portal).
- **File Entry Point**: `seed/createSeedDB.ts` — Thực thi kết nối TypeORM `DataSource`, điều phối nạp dữ liệu tuần tự theo cây quan hệ và kiểm chứng tính toàn vẹn của dữ liệu sau khi chèn.
- **Phạm vi áp dụng**: Dữ liệu seed được thiết kế **chỉ dành riêng cho môi trường Development và Testing**.

---

## B. Tài khoản đăng nhập mặc định (Default Login Accounts)

Hệ thống được thiết lập sẵn hai tài khoản đăng nhập bắt buộc phục vụ quá trình phát triển và kiểm thử:

| Vai trò (Role) | Email | Mật khẩu mẫu | Phân quyền Backend thực tế | Trạng thái | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Admin** | `admin@gmail.com` | `123456` | `UserRole.ADMIN` (`ADMIN`) | Hoạt động (`isActive: true`) | Đăng nhập Trung Tâm Quản Trị (`/admin`), quản trị và kiểm duyệt cộng đồng |
| **User** | `user@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Đăng nhập Cổng Người Dùng (`/`), tương tác bài viết, nhắn tin và chia sẻ |

### Các tài khoản bổ sung (Supplementary Test Accounts):

| Vai trò (Role) | Email | Mật khẩu mẫu | Phân quyền Backend thực tế | Trạng thái | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Inactive Client** | `inactive@lyora.com` | `Client@123456` | `UserRole.CLIENT` (`CLIENT`) | Tạm khóa (`isActive: false`) | Kiểm thử xử lý lỗi đăng nhập tài khoản bị vô hiệu hóa |

> [!IMPORTANT]
> **Ghi chú bảo mật & vận hành:**
> - Toàn bộ mật khẩu được băm (hash) bằng thuật toán **Bcrypt** (`salt rounds = 10`) trước khi lưu trữ vào bảng `users`. Tuyệt đối không lưu mật khẩu dạng văn bản thô (plaintext).
> - Vai trò và quyền hạn được gán chính xác theo enum `UserRole` (`ADMIN`, `CLIENT`) trong mã nguồn Backend (`src/common/enums/role.enum.ts`).
> - Cả hai tài khoản đã được kiểm chứng hoạt động hoàn hảo với `AuthService.login` và `JwtAuthGuard`.
> - **TUYỆT ĐỐI KHÔNG** sử dụng các tài khoản mặc định này trên môi trường Production!

---

## C. Danh mục dữ liệu Seed (Seed Data Inventory)

Danh mục toàn bộ các file seed dữ liệu hiện có trong thư mục `lyora_backend/seed/`:

| STT | Seed File | Tên Bảng (Table) | Mô tả dữ liệu | Số bản ghi | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `users.seed.ts` | `users` | Tài khoản người dùng hệ thống (`ADMIN`, `CLIENT`, `INACTIVE`) | 3 | Complete |

- **Cấu hình & Tiện ích hỗ trợ**:
  - `seed.config.ts`: Khởi tạo TypeORM DataSource độc lập cho runner (hỗ trợ chuẩn hóa URL và SSL cho cả local lẫn DB cloud dev/staging qua `parsePostgresConnectionConfig`), tích hợp hàm chặn an toàn `assertSafeEnvironment()`.
  - `createSeedDB.ts`: Điều phối thực thi tuần tự các hàm seed, thống kê và đối chiếu bản ghi.

---

## D. Quan hệ cơ sở dữ liệu & Thứ tự chèn (Database Relationships & Insert Order)

Để đảm bảo không vi phạm ràng buộc khóa ngoại (Foreign Key Constraints), quá trình seed dữ liệu tuân thủ thứ tự chèn nghiêm ngặt:

```text
1. users (Bảng độc lập — Khởi tạo đầu tiên)
   │
   ├── (Tương lai: posts / comments)
   ├── (Tương lai: conversations / messages)
   └── (Tương lai: reports / audit_logs)
```

1. **Bảng cấp 1 (Root / Independent Tables)**: `users` — Chứa định danh người dùng (`id: UUID`), không phụ thuộc bảng nào khác.
2. **Bảng cấp 2 (Dependent Tables)**: Khi phát triển thêm các module cộng đồng mới (ví dụ: `posts`, `comments`, `messages`, `reports`), các bảng này sẽ được insert sau bảng `users` và liên kết thông qua `userId` / `authorId`.

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
- Skill `/lya-createSeedDB` chỉ thực hiện audit, chuẩn bị file seed và cập nhật tài liệu `seed/README.md`.
- Skill `/lya-insertSeedDB` là quy trình thực thi đầy đủ (Clean & Seed):
  1. Chạy `script/deleteAllData.ts` (lệnh `npm run backend:db:reset`) để làm sạch toàn bộ CSDL via `TRUNCATE CASCADE`.
  2. Chạy `seed/createSeedDB.ts` (lệnh `npm run backend:seed`) để nạp lại dữ liệu mẫu chuẩn.
  3. Truy vấn xác thực số lượng bản ghi thực tế trong từng bảng.

---

## F. Lưu ý quan trọng (Important Notes)

> [!CAUTION]
> 1. **Môi trường:** Seed data chỉ dành cho `development` và `testing`. Hệ thống tích hợp sẵn cơ chế chặn tự động `assertSafeEnvironment()`, sẽ ném ngoại lệ và dừng ngay lập tức nếu phát hiện `NODE_ENV === 'production'` hoặc chuỗi kết nối chứa các host đám mây thật (RDS, Supabase, ElephantSQL, v.v.).
> 2. **Authentication Flow:** Tuyệt đối không sửa đổi authentication logic hoặc password hashing của Backend chỉ để phục vụ seed. Dữ liệu seed phải tuân thủ 100% chuẩn mật khẩu và mã hóa của Backend.
> 3. **An toàn dữ liệu:** Quá trình chạy `/lya-createSeedDB` KHÔNG được phép tự ý thực hiện xóa sạch Database. Việc xóa và nạp lại Database chỉ diễn ra khi kích hoạt `/lya-insertSeedDB`.

---

## G. Tiện ích Seed Bạn Bè Mẫu Đảo Ngược Được (Reversible Personal Demo Friends Seed)

Tiện ích độc lập `seed/demo-friends.seed.ts` được thiết kế để nạp và dọn dẹp an toàn một bộ 10 bạn bè mẫu cho tài khoản cá nhân kiểm thử thực tế (`giang0912005@gmail.com`).

### 1. Đặc tính thiết kế & Nguyên tắc an toàn
- **Hoàn toàn độc lập**: KHÔNG tích hợp vào luồng seed mặc định (`createSeedDB.ts`) hoặc lệnh reset CSDL (`deleteAllData.ts`).
- **Khả năng đảo ngược 100%**: Lưu vết chính xác danh tính các bản ghi đã tạo thông qua manifest file (`seed/.manifest/demo-friends-manifest.json`). Khi dọn dẹp, toàn bộ bạn bè mẫu, quan hệ bạn bè và các hội thoại thuần test giữa tài khoản mục tiêu với bạn bè mẫu sẽ được dọn sạch mà không ảnh hưởng đến bất kỳ người dùng thật nào.
- **Bảo vệ người dùng thật & Xung đột**:
  - Không bao giờ xóa tài khoản mục tiêu hoặc bất kỳ người dùng nào không thuộc tên miền `@lyora-demo.test`.
  - Nếu bạn bè mẫu đã được thêm vào hội thoại nhóm có chứa người dùng thật khác bên ngoài, hội thoại đó sẽ được phân loại là `[PROTECTED]` và **TUYỆT ĐỐI KHÔNG BỊ XÓA** để bảo toàn lịch sử dữ liệu của người dùng thật.
- **Giao dịch toàn vẹn (ACID Transaction)**: Mọi thao tác thêm hoặc xóa đều được đóng gói trong TypeORM transaction, tự động rollback nếu gặp lỗi giữa chừng.
- **Kiểm soát bảo mật Manifest**: Thư mục `.manifest/` và các file `*manifest.json` được loại trừ trong `.gitignore`. Manifest chỉ lưu ID và email, tuyệt đối không lưu password hash, token hay credentials.

### 2. Danh sách 10 Bạn Bè Mẫu (`@lyora-demo.test`)

Mật khẩu chuẩn hóa cho toàn bộ bạn bè mẫu: `DemoFriend@Lyora2026` (Bcrypt 10 rounds, `role: CLIENT`, `isActive: true`, `avatarUrl: null`).

| STT | Họ và tên | Email (`@lyora-demo.test`) | Số điện thoại | Vị trí | Tiểu sử tóm tắt |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | Nguyễn Minh Anh | `minh-anh@lyora-demo.test` | `0905001001` | TP. Hồ Chí Minh | Thành viên demo Lyora — Thích đọc sách và nghe nhạc. |
| 2 | Trần Hoàng Nam | `hoang-nam@lyora-demo.test` | `0905001002` | Hà Nội | Thành viên demo Lyora — Kỹ sư phần mềm. |
| 3 | Lê Thảo Vy | `thao-vy@lyora-demo.test` | `0905001003` | Đà Nẵng | Thành viên demo Lyora — Đam mê nhiếp ảnh và nghệ thuật số. |
| 4 | Phạm Quốc Bảo | `quoc-bao@lyora-demo.test` | `0905001004` | TP. Hồ Chí Minh | Thành viên demo Lyora — Chuyên viên an toàn thông tin. |
| 5 | Võ Gia Hân | `gia-han@lyora-demo.test` | `0905001005` | Cần Thơ | Thành viên demo Lyora — Thiết kế đồ họa và sáng tạo nội dung. |
| 6 | Nguyễn Đăng Khoa | `dang-khoa@lyora-demo.test` | `0905001006` | Hà Nội | Thành viên demo Lyora — Nghiên cứu trí tuệ nhân tạo. |
| 7 | Trần Khánh Linh | `khanh-linh@lyora-demo.test` | `0905001007` | Hải Phòng | Thành viên demo Lyora — Nhiệt huyết với các hoạt động cộng đồng. |
| 8 | Lê Minh Hoàng | `minh-hoang@lyora-demo.test` | `0905001008` | Đà Lạt | Thành viên demo Lyora — Thích đi phượt và khám phá ẩm thực. |
| 9 | Phạm Như Ý | `nhu-y@lyora-demo.test` | `0905001009` | Huế | Thành viên demo Lyora — Yêu thích kiến trúc và không gian tối giản. |
| 10 | Đỗ Thành Đạt | `thanh-dat@lyora-demo.test` | `0905001010` | Nha Trang | Thành viên demo Lyora — Chơi cờ vua và lập trình hệ thống. |

### 3. Các chế độ thực thi & Lệnh NPM

Hệ thống hỗ trợ 5 chế độ hoạt động thông qua npm scripts:

| Chế độ (Mode) | Lệnh từ `lyora_backend` | Lệnh từ Monorepo Root | Hành vi & Tác động |
| :--- | :--- | :--- | :--- |
| **PREVIEW ADD** | `npm run seed:demo-friends:preview` | `npm run backend:seed:demo-friends:preview` | Dry-run kiểm tra tài khoản mục tiêu và các bản ghi dự kiến thêm. **Không ghi CSDL hay Manifest.** |
| **ADD** | `npm run seed:demo-friends:add` | `npm run backend:seed:demo-friends:add` | Tạo 10 tài khoản demo, thiết lập quan hệ bạn bè `ACCEPTED`, ghi log Manifest. Idempotent khi chạy lại. |
| **STATUS** | `npm run seed:demo-friends:status` | `npm run backend:seed:demo-friends:status` | Kiểm tra tình trạng đồng bộ giữa CSDL, Manifest, các quan hệ bạn bè và hội thoại liên quan. |
| **PREVIEW CLEANUP** | `npm run seed:demo-friends:cleanup:preview` | `npm run backend:seed:demo-friends:cleanup:preview` | Dry-run kiểm tra các bản ghi sẽ xóa, phát hiện xung đột và phân loại `[PROTECTED]`. **Không xóa CSDL.** |
| **CLEANUP** | `npm run seed:demo-friends:cleanup` | `npm run backend:seed:demo-friends:cleanup` | Xóa an toàn toàn bộ bạn bè demo, quan hệ bạn bè và hội thoại thuần test. Cập nhật Manifest thành `CLEANED`. |

#### Tùy chỉnh tham số dòng lệnh:
Có thể truyền trực tiếp email tài khoản mục tiêu khác:
```bash
npx ts-node -r tsconfig-paths/register seed/demo-friends.seed.ts --mode=add --email=custom@example.com
```
