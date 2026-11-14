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
| **Admin** | `admin@gmail.com` | `123456` | `UserRole.ADMIN` (`ADMIN`) | Hoạt động (`isActive: true`) | Đăng nhập Trung Tâm Quản Trị (`/admin`), quản lý hệ thống |
| **User** | `user@gmail.com` | `123456` | `UserRole.CLIENT` (`CLIENT`) | Hoạt động (`isActive: true`) | Đăng nhập Cổng Khách Hàng (`/`), trải nghiệm mua sắm giấy phép |

### Các tài khoản bổ sung (Supplementary Test Accounts):

| Vai trò (Role) | Email | Mật khẩu mẫu | Phân quyền Backend thực tế | Trạng thái | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Staff** | `staff@lyora.com` | `Staff@123456` | `UserRole.STAFF` (`STAFF`) | Hoạt động (`isActive: true`) | Kiểm thử phân quyền nhân viên vận hành và xử lý đơn |
| **Inactive Client** | `inactive@lyora.com` | `Client@123456` | `UserRole.CLIENT` (`CLIENT`) | Tạm khóa (`isActive: false`) | Kiểm thử xử lý lỗi đăng nhập tài khoản bị vô hiệu hóa |

> [!IMPORTANT]
> **Ghi chú bảo mật & vận hành:**
> - Toàn bộ mật khẩu được băm (hash) bằng thuật toán **Bcrypt** (`salt rounds = 10`) trước khi lưu trữ vào bảng `users`. Tuyệt đối không lưu mật khẩu dạng văn bản thô (plaintext).
> - Vai trò và quyền hạn được gán chính xác theo enum `UserRole` (`ADMIN`, `STAFF`, `CLIENT`) trong mã nguồn Backend (`src/common/enums/role.enum.ts`).
> - Cả hai tài khoản đã được kiểm chứng hoạt động hoàn hảo với `AuthService.login` và `JwtAuthGuard`.
> - **TUYỆT ĐỐI KHÔNG** sử dụng các tài khoản mặc định này trên môi trường Production!

---

## C. Danh mục dữ liệu Seed (Seed Data Inventory)

Danh mục toàn bộ các file seed dữ liệu hiện có trong thư mục `lyora_backend/seed/`:

| STT | Seed File | Tên Bảng (Table) | Mô tả dữ liệu | Số bản ghi | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `users.seed.ts` | `users` | Tài khoản người dùng hệ thống (`ADMIN`, `CLIENT`, `STAFF`, `INACTIVE`) | 4 | Complete |

- **Cấu hình & Tiện ích hỗ trợ**:
  - `seed.config.ts`: Khởi tạo TypeORM DataSource độc lập cho runner, tích hợp hàm chặn an toàn `assertSafeEnvironment()`.
  - `createSeedDB.ts`: Điều phối thực thi tuần tự các hàm seed, thống kê và đối chiếu bản ghi.

---

## D. Quan hệ cơ sở dữ liệu & Thứ tự chèn (Database Relationships & Insert Order)

Để đảm bảo không vi phạm ràng buộc khóa ngoại (Foreign Key Constraints), quá trình seed dữ liệu tuân thủ thứ tự chèn nghiêm ngặt:

```text
1. users (Bảng độc lập — Khởi tạo đầu tiên)
   │
   ├── (Tương lai: user_profiles)
   ├── (Tương lai: orders / order_items)
   └── (Tương lai: audit_logs)
```

1. **Bảng cấp 1 (Root / Independent Tables)**: `users` — Chứa định danh người dùng (`id: UUID`), không phụ thuộc bảng nào khác.
2. **Bảng cấp 2 (Dependent Tables)**: Khi phát triển thêm các module mới (ví dụ: `licenses`, `orders`, `products`), các bảng này sẽ được insert sau bảng `users` và liên kết thông qua `userId`.

---

## E. Hướng dẫn thực thi (Execution)

### 1. Điều kiện tiên quyết (Prerequisites)
- Dịch vụ **PostgreSQL** đang chạy trên cổng `5432`.
- Cơ sở dữ liệu `lyora_db` đã được tạo.
- Cấu hình file `.env` tại `lyora_backend/.env` hoặc biến môi trường `DATABASE_URL` hợp lệ (mặc định: `postgresql://postgres:postgres@localhost:5432/lyora_db`).

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

