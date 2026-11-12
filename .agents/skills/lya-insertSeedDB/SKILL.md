---
name: lya-insertSeedDB
description: >-
  Xóa sạch dữ liệu hiện có trong Database và insert lại toàn bộ seed data chuẩn cho lyora_backend.
---

# lya-insertSeedDB

Mục đích: Thực hiện quy trình khôi phục và làm mới toàn bộ Database (Clean & Seed) cho `lyora_backend`, bao gồm kiểm tra an toàn môi trường, xóa sạch dữ liệu hiện tại bằng `deleteAllData.ts`, nạp toàn bộ seed data bằng `createSeedDB.ts`, và xác minh số lượng bản ghi thực tế của từng bảng trong CSDL.

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared Workflow](../../rules/shared-workflow.md)
- [Backend Architecture](../../../architecture_backend/ARCHITECTURE_OVERVIEW.md)

---

## Quy trình thực hiện (Workflow)

### Step 1 — Pre-flight & Safety Checks (Kiểm tra an toàn)
Trước khi thực hiện bất kỳ thao tác xóa hoặc chèn dữ liệu:
1. **Kiểm tra kết nối Database**:
   - Xác minh `DATABASE_URL` hợp lệ và PostgreSQL service đang phản hồi (Port 5432).
   - Nếu không kết nối được, in thông báo lỗi và hướng dẫn developer bật PostgreSQL/Docker, sau đó dừng tác vụ.
2. **Kiểm tra an toàn môi trường (Production Safeguard)**:
   - Kiểm tra `process.env.NODE_ENV`. Nếu là `production` hoặc `prod` -> **DỪNG NGAY LẬP TỨC**.
   - Kiểm tra domain/host của connection string. Nếu chứa các từ khóa remote/production (`rds.amazonaws.com`, `supabase.co`, `elephantsql.com`, `prod`) -> **DỪNG NGAY LẬP TỨC**.
3. **Kiểm tra mã nguồn Seed**:
   - Xác minh sự tồn tại của `lyora_backend/script/deleteAllData.ts` và `lyora_backend/seed/createSeedDB.ts`.
   - Nếu chưa có, yêu cầu chạy `/lya-createSeedDB` trước.

### Step 2 — Clean Database (Xóa sạch toàn bộ dữ liệu)
Thực thi script làm sạch CSDL:
```bash
npm run backend:db:reset
# hoặc: cd lyora_backend && npx ts-node -r tsconfig-paths/register script/deleteAllData.ts
```
Cơ chế của `deleteAllData.ts`:
- Truy vấn danh sách tất cả các bảng trong schema `public` (bỏ qua bảng `migrations` nếu có).
- Ghi log số lượng bản ghi của từng bảng trước khi xóa.
- Thực thi lệnh `TRUNCATE TABLE ... RESTART IDENTITY CASCADE;` để xóa triệt để dữ liệu và reset sequence mà không gặp lỗi khóa ngoại.
- Kiểm tra lại toàn bộ các bảng: Đảm bảo số lượng bản ghi của 100% các bảng đều về `0`. Nếu còn bản ghi sót lại, báo lỗi và dừng quy trình.

### Step 3 — Insert Seed Data (Khởi tạo dữ liệu mẫu)
Thực thi script nạp dữ liệu mẫu:
```bash
npm run backend:seed
# hoặc: cd lyora_backend && npx ts-node -r tsconfig-paths/register seed/createSeedDB.ts
```
Cơ chế của `createSeedDB.ts`:
- Chạy lần lượt các seeder theo thứ tự phụ thuộc (ví dụ: `seedUsers`).
- Băm mật khẩu bằng `bcrypt` an toàn (salt rounds = 10).
- Ghi log từng bước và hiển thị danh sách các tài khoản được khởi tạo.
- Bắt lỗi và rollback nếu có bất kỳ ngoại lệ nào xảy ra.

### Step 4 — Verify Database Records (Xác thực CSDL sau khởi tạo)
1. Thực hiện truy vấn kiểm tra số lượng bản ghi thực tế (`COUNT(*)`) trong từng bảng:
   - So sánh số lượng thực tế với số lượng bản ghi mẫu dự kiến (Expected count).
2. Kiểm tra tính hợp lệ của dữ liệu nhạy cảm:
   - Mật khẩu trong CSDL phải là chuỗi Bcrypt hash (`$2b$10$...`), tuyệt đối không được là plaintext.
   - Các trường Unique và Enums tuân thủ đúng định dạng.
3. Đánh giá trạng thái thực thi:
   - `SUCCESS`: 100% bảng có dữ liệu khớp với seed data.
   - `PARTIAL`: Một số bảng seed thành công, một số bảng thiếu bản ghi.
   - `FAILED`: Lỗi kết nối, lỗi TRUNCATE hoặc lỗi chèn dữ liệu.

### Step 5 — Output Verification Report (Báo cáo kết quả)
Xuất báo cáo tổng kết chi tiết dạng Markdown:
1. **Bảng kết quả nạp dữ liệu**:
   | Tên Bảng (Table) | Entity | Dự kiến (Expected) | Thực tế (Actual) | Trạng thái (Status) |
   | :--- | :--- | :---: | :---: | :---: |
   | `users` | `User` | 4 | 4 | `SUCCESS` |

2. **Bảng danh sách tài khoản thử nghiệm**:
   | Vai trò (Role) | Email | Mật khẩu mẫu | Trạng thái hoạt động | Ghi chú |
   | :--- | :--- | :--- | :---: | :--- |
   | `ADMIN` | `admin@lyora.com` | `Admin@123456` | Active | Quản trị viên hệ thống |
   | `STAFF` | `staff@lyora.com` | `Staff@123456` | Active | Nhân viên vận hành |
   | `CLIENT` | `client@lyora.com` | `Client@123456` | Active | Khách hàng chuẩn |
   | `CLIENT` | `inactive@lyora.com` | `Client@123456` | Inactive | Khách hàng tạm khóa |

3. **Hướng dẫn bước tiếp theo**:
   - Khởi động backend (`npm run backend:dev`) và frontend (`npm run web:dev`).
   - Sử dụng các tài khoản trên để đăng nhập kiểm thử luồng Authentication.

