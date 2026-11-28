---
name: lya-insertSeedDB
description: >-
  Phân tích hiện trạng Database (phát hiện bất đồng bộ giữa logic code và quan hệ DB), giữ nguyên toàn bộ dữ liệu cũ và chỉ insert bổ sung các seed data còn thiếu cho lyora_backend, tự động bỏ qua row khi gặp lỗi duplicate ID hoặc unique constraint.
---

# lya-insertSeedDB

Mục đích: Thực hiện quy trình **bổ sung và hoàn thiện dữ liệu còn thiếu** vào Database cho `lyora_backend` theo nguyên tắc **Additive / Non-destructive**: kiểm tra an toàn môi trường, phân tích schema & dữ liệu hiện tại trong Database để **phát hiện sớm bất đồng bộ giữa logic code và quan hệ DB** (nêu rõ lỗi và gợi ý phương án đồng bộ cho developer nếu có), **BẮT BUỘC GIỮ NGUYÊN TOÀN BỘ DỮ LIỆU CŨ** (tuyệt đối không xóa/truncate DB), thực thi **chỉ insert mới** bằng `createSeedDB.ts` và **tự động bỏ qua (skip) các row bị trùng ID/khóa duy nhất**, sau đó xác minh số lượng bản ghi thực tế.

> [!CAUTION]
> **QUY TẮC BẮT BUỘC VỀ AN TOÀN DỮ LIỆU:**
> 1. **TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA DỮ LIỆU CŨ:** Cấm chạy `deleteAllData.ts`, cấm chạy `npm run backend:db:reset` / `npm run seed:reset`, cấm thực thi `TRUNCATE TABLE`, `DROP TABLE` hoặc `DELETE FROM` trên Database.
> 2. **CHỈ INSERT MỚI — BỎ QUA ROW TRÙNG LẶP:** Nếu bản ghi đã tồn tại hoặc gặp lỗi duplicate ID / unique constraint (ví dụ mã lỗi PostgreSQL `23505`), **chỉ bỏ qua (skip) row đó** và tiếp tục bổ sung các bản ghi còn thiếu khác.
> 3. **KHÔNG GHI ĐÈ DỮ LIỆU CŨ:** Mục tiêu là hoàn thiện và bổ sung dữ liệu DB còn thiếu/chưa có, giữ nguyên vẹn trạng thái dữ liệu hiện có của developer/tester.

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared Workflow](../../rules/shared-workflow.md)
- [Backend Architecture](../../../architecture_backend/ARCHITECTURE_OVERVIEW.md)

---

## Quy trình thực hiện (Workflow)

### Step 1 — Pre-flight & Safety Checks (Kiểm tra an toàn trước khi bổ sung dữ liệu)
Trước khi phân tích hoặc chèn bất kỳ dữ liệu nào:
1. **Kiểm tra kết nối Database**:
   - Xác minh `DATABASE_URL` hợp lệ và PostgreSQL service đang phản hồi (Port 5432 hoặc PostgreSQL dev đã cấu hình).
   - Nếu không kết nối được, in thông báo lỗi và hướng dẫn developer bật PostgreSQL/Docker, sau đó dừng tác vụ.
2. **Kiểm tra an toàn môi trường (Production Safeguard)**:
   - Kiểm tra `process.env.NODE_ENV`. Nếu là `production` hoặc `prod` -> **DỪNG NGAY LẬP TỨC**.
   - Kiểm tra domain/host của connection string. Nếu chứa các từ khóa remote/production (`rds.amazonaws.com`, `supabase.co`, `elephantsql.com`, `prod`) -> **DỪNG NGAY LẬP TỨC**.
3. **Kiểm tra mã nguồn Seed**:
   - Xác minh sự tồn tại của `lyora_backend/seed/createSeedDB.ts` và các seed files tương ứng.
   - Kiểm tra nhanh các seed files để chắc chắn chúng hoạt động theo chế độ **insert-only & skip duplicate**, không chứa lệnh xóa sạch bảng hay ghi đè dữ liệu cũ. Nếu chưa đạt hoặc chưa có seed files, yêu cầu chạy `/lya-createSeedDB` trước.
   - *(Lưu ý: Không cần và không được kích hoạt `script/deleteAllData.ts`).*

### Step 2 — Analyze Database & Detect Code-DB Synchronization Issues (Phân tích hiện trạng DB & phát hiện bất đồng bộ)
1. **Chụp thống kê dữ liệu hiện có (Existing Snapshot)**:
   - Truy vấn `information_schema` và đếm `COUNT(*)` hiện tại của từng bảng để ghi nhận mốc `Existing` trước khi bổ sung dữ liệu.
2. **Đối chiếu Logic Code vs Schema & Quan hệ Database thực tế**:
   - So sánh các Entity (`src/modules/**/entities/*.entity.ts`) và luồng xử lý nghiệp vụ (`*.service.ts`) với cấu trúc & dữ liệu thực tế đang có trong PostgreSQL:
     - **Schema / Cột / Kiểu dữ liệu:** Kiểm tra có bảng hoặc cột mới nào trong Entity chưa tồn tại trong DB, hoặc kiểu cột / `ENUM` PostgreSQL còn thiếu giá trị mà code mới sử dụng hay không.
     - **Quan hệ & Ràng buộc (FK / Unique / Check):** Kiểm tra các khóa ngoại, bảng trung gian, unique index hoặc ràng buộc `NOT NULL` trong code có đang xung đột với dữ liệu cũ trong DB (ví dụ bản ghi con mồ côi không có bản ghi cha, giá trị `NULL` trên cột không cho phép `NULL`, lệch cột đếm tổng hợp như `reactionsCount`/`commentsCount`/`sharesCount`).
     - **Logic Seed vs DB:** Kiểm tra bản ghi cha cần thiết cho quan hệ (ví dụ user tham gia hội thoại, bài viết gốc cho bình luận/reaction/share) có hợp lệ hay không.
3. **Xử lý khi phát hiện bất đồng bộ (BẮT BUỘC)**:
   - **Nêu rõ từng lỗi bất đồng bộ cho developer**: chỉ rõ Entity/Service nào trong code bị lệch với Table/Column/Relation nào trong DB, nguyên nhân và tác động cụ thể.
   - **Đề xuất phương án đồng bộ Database an toàn (giữ nguyên dữ liệu cũ)**: ví dụ tạo/chạy TypeORM migration, chạy `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT ...`, `ALTER TYPE ... ADD VALUE IF NOT EXISTS ...`, câu lệnh SQL backfill cho dữ liệu cũ mà không phải xóa DB.
   - Nếu lỗi bất đồng bộ thuộc loại **chặn thực thi (blocking)** (ví dụ DB thiếu hẳn bảng hoặc thiếu cột `NOT NULL` khiến `INSERT` chắc chắn thất bại) -> **DỪNG trước Step 3** và báo cáo cho developer đồng bộ DB theo phương án gợi ý. Nếu bất đồng bộ chỉ là cảnh báo nhẹ không cản trở việc insert phần còn thiếu -> ghi rõ vào báo cáo và tiếp tục Step 3.

### Step 3 — Additive Insert Seed Data (Chỉ Insert Mới & Bỏ Qua Duplicate)
Thực thi script nạp dữ liệu bổ sung:
```bash
npm run backend:seed
# hoặc: cd lyora_backend && npx ts-node -r tsconfig-paths/register seed/createSeedDB.ts
```
Cơ chế thực thi bắt buộc của `createSeedDB.ts` và các seeder con:
1. **Không xóa dữ liệu cũ, không ghi đè:** Tuyệt đối giữ nguyên toàn bộ bản ghi đã có sẵn từ trước trong Database.
2. **Chỉ chèn bản ghi chưa tồn tại:**
   - Kiểm tra theo `id` (PK) hoặc khóa duy nhất nghiệp vụ (`email`, `directUserKey`, `[postId, userId]`, v.v.) trước khi chèn.
   - Chèn theo đúng thứ tự phụ thuộc khóa ngoại (bảng cha trước, bảng con sau).
   - Băm mật khẩu các tài khoản mới bổ sung bằng `bcrypt` (salt rounds = 10).
3. **Xử lý lỗi Duplicate ID / Unique Key (Bắt buộc Skip):**
   - Trong quá trình insert, nếu phát sinh lỗi trùng `id` hoặc trùng unique constraint (PostgreSQL SQLSTATE `23505` / TypeORM duplicate error hoặc thông qua `ON CONFLICT DO NOTHING` / `orIgnore()`), **bỏ qua (SKIP) duy nhất row bị trùng đó**, ghi log rõ bảng + khóa bị trùng, rồi **tiếp tục chèn các row còn lại** thay vì dừng hoặc rollback cả batch.
4. Ghi log chi tiết theo từng bảng: số lượng đã có (`Existing`), số lượng vừa chèn mới (`Inserted`), và số lượng bị bỏ qua do trùng (`Skipped`).

### Step 4 — Verify Database Records (Xác thực giữ nguyên dữ liệu cũ & bổ sung đầy đủ)
1. Thực hiện truy vấn kiểm tra số lượng bản ghi thực tế (`COUNT(*)`) trong từng bảng sau khi seed:
   - Xác nhận **`Actual >= Existing`** ở 100% các bảng (tuyệt đối không để mất hoặc giảm bất kỳ bản ghi cũ nào).
   - Kiểm tra các dữ liệu seed chuẩn (đặc biệt 2 tài khoản mặc định `admin@gmail.com`, `user@gmail.com` và các bảng còn thiếu) đã hiện diện đầy đủ trong Database.
2. Kiểm tra tính hợp lệ của dữ liệu:
   - Mật khẩu trong CSDL phải là chuỗi Bcrypt hash (`$2b$10$...`), tuyệt đối không được là plaintext.
   - Các trường Unique, Enums và khóa ngoại tuân thủ đúng định dạng.
3. Đánh giá trạng thái thực thi:
   - `SUCCESS`: Dữ liệu cũ được giữ nguyên 100%, toàn bộ dữ liệu seed còn thiếu đã được bổ sung (hoặc đã tồn tại sẵn và được skip hợp lệ), không có lỗi bất đồng bộ blocking.
   - `PARTIAL`: Một số bản ghi hoặc bảng đã bổ sung thành công, một số row gặp lỗi ràng buộc khác (không phải duplicate) hoặc có cảnh báo bất đồng bộ cần developer xử lý tiếp.
   - `FAILED`: Lỗi kết nối DB hoặc lỗi schema blocking khiến tiến trình không thể chèn dữ liệu (nhưng dữ liệu cũ vẫn phải nguyên vẹn).

### Step 5 — Output Verification Report (Báo cáo kết quả)
Xuất báo cáo tổng kết chi tiết dạng Markdown gồm 4 phần bắt buộc:

1. **Phân tích đồng bộ Logic Code vs Quan hệ Database**:
   - Kết luận: `Đồng bộ 100%` hoặc liệt kê chi tiết các lỗi bất đồng bộ phát hiện được + **gợi ý phương án đồng bộ DB cụ thể** cho từng lỗi.
2. **Bảng kết quả bổ sung dữ liệu (Additive Insert Summary)**:
   | Tên Bảng (Table) | Entity | Trước Seed (Existing) | Thêm mới (Inserted) | Bỏ qua do trùng (Skipped) | Sau Seed (Actual) | Trạng thái |
   | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
   | `users` | `User` | ... | ... | ... | ... | `SUCCESS` |
3. **Bảng danh sách tài khoản đăng nhập mẫu**:
   | Vai trò (Role) | Email | Mật khẩu mẫu | Trạng thái trong DB | Ghi chú |
   | :--- | :--- | :--- | :---: | :--- |
   | `ADMIN` | `admin@gmail.com` | `123456` | `Đã có sẵn (Giữ nguyên)` / `Mới bổ sung` | Quản trị viên hệ thống |
   | `CLIENT` | `user@gmail.com` | `123456` | `Đã có sẵn (Giữ nguyên)` / `Mới bổ sung` | Người dùng tiêu chuẩn |
4. **Hướng dẫn bước tiếp theo**:
   - Nếu có lỗi bất đồng bộ cần xử lý: liệt kê thứ tự lệnh/migration developer nên chạy để đồng bộ DB mà không mất dữ liệu cũ.
   - Khởi động backend (`npm run backend:dev`) và frontend (`npm run web:dev`) để kiểm thử với đầy đủ dữ liệu cũ + dữ liệu mới vừa bổ sung.
