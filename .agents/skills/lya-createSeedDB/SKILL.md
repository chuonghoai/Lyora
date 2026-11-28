---
name: lya-createSeedDB
description: >-
  Audit Database Entities & đối chiếu bất đồng bộ giữa logic code và quan hệ DB, tạo/cập nhật seed files trong lyora_backend/seed/ theo cơ chế chỉ insert mới và bỏ qua bản ghi trùng (giữ nguyên dữ liệu cũ), đảm bảo tài khoản đăng nhập mặc định (Admin, User), đồng bộ seed/README.md, đánh giá Readiness và kích hoạt Process chạy /lya-insertSeedDB.
---

# lya-createSeedDB

Mục đích: Khảo sát toàn diện Database Entities và Database Schema trong `lyora_backend`, **phân tích phát hiện bất đồng bộ giữa logic code và quan hệ/schema DB**, đối chiếu các file seed data hiện có trong `lyora_backend/seed/`, tạo mới hoặc cập nhật các file seed data theo nguyên tắc **CHỈ INSERT MỚI — BỎ QUA BẢN GHI TRÙNG LẶP — BẮT BUỘC GIỮ NGUYÊN DỮ LIỆU CŨ** (Additive / Non-destructive), **bắt buộc bảo đảm hai tài khoản đăng nhập mặc định (Admin & User)** nếu có table tài khoản người dùng, **tạo/cập nhật tài liệu `lyora_backend/seed/README.md`**, đánh giá mức độ sẵn sàng thực thi (Readiness: `READY` / `NOT READY`) và cung cấp nút bấm tương tác "Process" để chuyển giao sang `/lya-insertSeedDB`.

> [!CAUTION]
> **NGUYÊN TẮC CỐT LÕI — KHÔNG XÓA DỮ LIỆU CŨ:**
> - **TUYỆT ĐỐI KHÔNG** thiết kế hay chèn logic xóa toàn bộ Database (`TRUNCATE`, `DELETE` toàn bảng, gọi `deleteAllData.ts` hay `npm run backend:db:reset`).
> - Mọi seeder phải hoạt động theo cơ chế **bổ sung phần còn thiếu (Additive Insert-Only)**: chỉ chèn bản ghi chưa tồn tại và **bỏ qua (skip)** ngay khi gặp trùng ID hoặc trùng khóa duy nhất (duplicate row), giữ nguyên toàn bộ dữ liệu cũ trong Database.

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared Workflow](../../rules/shared-workflow.md)
- [Backend Architecture](../../../architecture_backend/ARCHITECTURE_OVERVIEW.md)

---

## 1. QUY ĐỊNH BẮT BUỘC VỀ TÀI KHOẢN ĐĂNG NHẬP (DEFAULT LOGIN ACCOUNTS)

Nếu quá trình audit hoặc tạo seed data có xử lý table lưu trữ tài khoản người dùng có khả năng đăng nhập vào hệ thống, **BẮT BUỘC** phải có ít nhất hai tài khoản sau:

| Role thực tế | Email | Password mặc định |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `123456` |
| **User** | `user@gmail.com` | `123456` |

### 1.1. Yêu cầu triển khai chi tiết
1. **Xác định thực tế từ Backend**:
   - Phải xác định đúng Entity và table lưu trữ tài khoản đăng nhập từ Backend implementation thực tế (không tự giả định tên table hoặc Entity luôn là `users` hay `User`).
   - Phải xác định chính xác cơ chế Authentication hiện tại (`AuthService`, `JwtAuthGuard`, `JwtStrategy`).
2. **Gán Role và Quyền hạn thực tế**:
   - Tài khoản Admin phải được gán đúng role/quyền Admin thực tế mà Backend đang sử dụng (ví dụ: `UserRole.ADMIN`).
   - Tài khoản User phải được gán đúng role/quyền User thực tế mà Backend đang sử dụng (ví dụ: `UserRole.CLIENT`).
   - Tuyệt đối không chỉ tạo 2 records có email tương ứng nhưng thiếu role, permissions hoặc quan hệ bắt buộc.
   - Phải bảo đảm cả hai tài khoản có thể được hệ thống nhận diện và đăng nhập thành công qua luồng API `/auth/login`.
3. **Mã hóa Password**:
   - Password seed bắt buộc phải được hash bằng đúng thuật toán và cơ chế mà Backend hiện tại sử dụng (`bcrypt.hash(password, 10)`).
   - Tuyệt đối không lưu plaintext password vào Database nếu hệ thống đang áp dụng password hashing.
   - Không tự ý thay đổi authentication logic chỉ để hai tài khoản đăng nhập được.
   - Phải kiểm chứng password hash có thể được Backend kiểm tra thành công (`bcrypt.compare('123456', passwordHash) === true`).
   - Thông tin password mặc định được phép ghi trong tài liệu `seed/README.md` vì đây là tài khoản development/testing có chủ đích.
4. **Điều kiện áp dụng & Bảo toàn dữ liệu cũ**:
   - Nếu table tài khoản đăng nhập đã có seed file: Kiểm tra và bổ sung hai tài khoản nếu còn thiếu.
   - **BẮT BUỘC GIỮ LẠI DỮ LIỆU CŨ:** Khi chèn vào Database, nếu bản ghi tài khoản (trùng `id` hoặc `email`) đã tồn tại trong DB thì **bỏ qua (skip) row đó**, không xóa và không ghi đè dữ liệu hiện có của người dùng trong DB.
   - Nếu chưa có seed file: Tạo mới và bao gồm hai tài khoản này.
   - Nếu cấu trúc Database hoặc nghiệp vụ hiện tại không cho phép tạo hai tài khoản theo yêu cầu: Phải báo cáo chính xác nguyên nhân và đánh dấu audit là `NOT READY`. Tuyệt đối không tự ý thay đổi nghiệp vụ để ép triển khai.

---

## 2. QUY TRÌNH ĐỒNG BỘ TÀI LIỆU `lyora_backend/seed/README.md`

Sau khi hoàn thành audit và tạo/cập nhật seed data, **BẮT BUỘC** phải tạo mới hoặc cập nhật file:
`lyora_backend/seed/README.md`

File `seed/README.md` phải phản ánh chính xác trạng thái thực tế sau mỗi lần chạy `/lya-createSeedDB`, bao gồm 6 mục:

- **A. Overview**: Mục đích của folder `seed/`, vai trò của seed data trong phát triển và kiểm thử, cơ chế **Additive / Insert-Only (giữ nguyên dữ liệu cũ, bỏ qua bản ghi trùng)** của `createSeedDB.ts`, lưu ý dữ liệu chỉ phục vụ development/testing.
- **B. Default Login Accounts**: Bảng hiển thị rõ hai tài khoản bắt buộc (`admin@gmail.com` / `123456`, `user@gmail.com` / `123456`), ghi chú về password hashing, role thực tế, khuyến cáo không dùng trên production.
- **C. Seed Data Inventory**: Bảng liệt kê toàn bộ seed data hiện có (`STT`, `Seed File`, `Table`, `Description`, `Records`, `Status`). Không bỏ sót file, không liệt kê file không tồn tại, không tự đoán số lượng records (ghi `Not verified` nếu chưa đếm được).
- **D. Database Relationships & Insert Order**: Mô tả các quan hệ ràng buộc khóa ngoại (Foreign Keys) và thứ tự insert an toàn giữa các tables.
- **E. Execution**: Hướng dẫn chi tiết cách chạy seed data theo đúng npm scripts và runtime của Backend (`npm run backend:seed`) để **bổ sung dữ liệu còn thiếu mà không xóa DB**, giải thích file entry point và mối liên hệ với `/lya-insertSeedDB`.
- **F. Important Notes**: Lưu ý an toàn, cấm dùng trên production, không sửa logic auth, **cấm tuyệt đối xóa dữ liệu cũ trong Database**, nêu rõ cơ chế skip khi gặp duplicate ID/unique key.

---

## 3. QUY TRÌNH THỰC HIỆN (WORKFLOW 5 BƯỚC)

### Step 1 — Audit Database Entities, Auth & Phân tích đồng bộ Logic Code vs Quan hệ DB
1. Rà soát tất cả các file Entity và Service liên quan trong dự án (`lyora_backend/src/modules/**/entities/*.entity.ts`, `src/common/entities/*.entity.ts`, `src/modules/**/*.service.ts`).
2. Xác định cấu trúc bảng, khóa chính, các cột bắt buộc (`nullable: false`), trường Unique, Enums, Indexes và quan hệ khóa ngoại (`@ManyToOne`, `@OneToMany`, `JoinColumn`).
3. Xác định cơ chế Authentication (`src/modules/auth/`, `src/common/enums/role.enum.ts`):
   - Thuật toán hash mật khẩu: `bcrypt`.
   - Phân quyền thực tế: `ADMIN`, `CLIENT`.
   - Table chứa tài khoản người dùng: `users` (Entity `User`).
4. **Phân tích đối chiếu bất đồng bộ giữa Logic Code và Quan hệ/Schema DB (Code-DB Sync Analysis)**:
   - Kiểm tra xem DB hiện tại (nếu kết nối được) và cấu trúc Entity/Service trong code có sai lệch hay không:
     - Thiếu bảng hoặc thiếu cột mới mà code đang truy vấn/ghi (ví dụ cột `isOnline`, `lockReason`, `lockedAt`, `parentId`, bảng `post_shares`, ...).
     - Sai lệch kiểu dữ liệu, giá trị `ENUM` trong PostgreSQL chưa cập nhật đủ giá trị mới từ enum TypeScript.
     - Bất đồng bộ quan hệ khóa ngoại (`FK`), `UNIQUE` index, hoặc cột đếm/trạng thái dẫn xuất giữa code và dữ liệu thực tế trong DB (ví dụ `reactionsCount`, `commentsCount`, `sharesCount`, dữ liệu bản ghi con mồ côi thiếu bản ghi cha).
     - Constraint `NOT NULL` mới thêm trong code nhưng dữ liệu cũ trong DB đang có `NULL`.
   - **Yêu cầu bắt buộc khi phát hiện bất đồng bộ:**
     - **Nêu rõ chi tiết từng lỗi bất đồng bộ cho developer**: chỉ rõ file/entity/service trong code đang kỳ vọng gì vs schema/dữ liệu thực tế trong DB đang thế nào và hệ quả có thể xảy ra.
     - **Gợi ý phương án đồng bộ Database an toàn (không làm mất dữ liệu cũ)**: ví dụ viết/chạy TypeORM migration, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT ...`, `ALTER TYPE ... ADD VALUE IF NOT EXISTS ...`, câu lệnh `UPDATE`/backfill đồng bộ giá trị cho dữ liệu cũ trước khi siết constraint, hoặc bật `synchronize` có kiểm soát ở môi trường dev.
     - **KHÔNG** tự ý xóa dữ liệu cũ hoặc sửa bừa nghiệp vụ để che giấu lỗi bất đồng bộ.

### Step 2 — Audit Existing Seed Files
1. Khảo sát thư mục `lyora_backend/seed/`.
2. Kiểm tra `seed.config.ts`, `createSeedDB.ts`, và các file seed theo từng Entity (như `users.seed.ts`, `friendships.seed.ts`, `conversations.seed.ts`, `posts.seed.ts`).
3. Đối chiếu sự tồn tại của hai tài khoản mặc định `admin@gmail.com` và `user@gmail.com` và toàn bộ các bảng đang thiếu seed data.
4. Phát hiện các vấn đề:
   - Thiếu seed file cho Entity/bảng mới.
   - Thiếu tài khoản đăng nhập mặc định hoặc mật khẩu chưa băm `bcrypt`.
   - Thứ tự insert sai quan hệ khóa ngoại.
   - **Kiểm tra tính an toàn Insert-Only:** Phát hiện xem seeder có vô tình ghi đè dữ liệu cũ, xóa dữ liệu hay bị crash toàn bộ tiến trình khi gặp duplicate ID/unique key hay không.

### Step 3 — Create / Update Seed Files (Chỉ Insert Mới, Bỏ Qua Trùng Lặp, Giữ Dữ Liệu Cũ)
1. **Cấu hình & Runner**:
   - `seed.config.ts`: Quản lý TypeORM `DataSource`, hàm `assertSafeEnvironment()` ngăn chặn môi trường Production.
   - `createSeedDB.ts`: Điều phối thực thi tuần tự các hàm seed, log rõ số lượng **bản ghi thêm mới (Inserted)** và **bản ghi bỏ qua do đã tồn tại (Skipped)**, đóng kết nối an toàn.
   - **Cấm tuyệt đối:** Không gọi `deleteAllData.ts`, không chạy `TRUNCATE`, không chạy `DELETE` xóa dữ liệu cũ.
2. **Quy chuẩn Insert-Only & Skip Duplicate cho mọi Seed File**:
   - Mục tiêu là **bổ sung và hoàn thiện dữ liệu còn thiếu**, **bắt buộc giữ nguyên toàn bộ dữ liệu cũ đã có trong DB**.
   - Trước khi insert từng row: kiểm tra bản ghi đã tồn tại theo khóa chính (`id`) hoặc khóa duy nhất nghiệp vụ (`email`, `directUserKey`, `[postId, userId]`, ...). Nếu đã tồn tại -> **bỏ qua row đó (skip)**, KHÔNG ghi đè dữ liệu cũ.
   - Khi thực thi `INSERT`: xử lý an toàn trường hợp trùng khóa (`ON CONFLICT DO NOTHING` / `orIgnore()` hoặc `try/catch` mã lỗi PostgreSQL `23505` — unique violation / duplicate primary key). Nếu gặp lỗi duplicate ID hoặc unique constraint -> **log cảnh báo nhẹ và bỏ qua row đó**, tiếp tục chèn các row hợp lệ còn thiếu (không để một row trùng làm hỏng toàn bộ quá trình seed).
   - Bổ sung/chuẩn hóa tài khoản mặc định (`admin@gmail.com` / `123456`, `user@gmail.com` / `123456` với `bcrypt` 10 rounds) để insert khi DB chưa có.

### Step 4 — Synchronize `lyora_backend/seed/README.md`
1. Tạo hoặc cập nhật `lyora_backend/seed/README.md` theo đầy đủ 6 phần (A đến F) nêu tại Mục 2.
2. Đối chiếu nội dung README với source code thực tế để bảo đảm 100% khớp: Không thiếu file, không sai số lượng bản ghi, không sai tài khoản mặc định, phản ánh đúng cơ chế **không xóa DB — chỉ insert bổ sung và skip bản ghi trùng**.

### Step 5 — Execution Readiness Check & Output Report
Thực hiện đánh giá kỹ thuật toàn diện và xuất báo cáo kết quả (bao gồm phần phân tích đồng bộ Code vs DB).

---

## 4. TIÊU CHÍ ĐÁNH GIÁ SẴN SÀNG (READINESS CRITERIA)

Trạng thái **READY** chỉ được thiết lập khi đáp ứng **toàn bộ** các tiêu chí sau:
1. **Schema & Code-DB Sync**: Dữ liệu seed tuân thủ 100% constraints, enums, quan hệ của Database Schema; không có lỗi bất đồng bộ nghiêm trọng (blocking) giữa code và DB (hoặc đã nêu rõ phương án đồng bộ và được developer xử lý xong).
2. **Non-Destructive & Duplicate-Safe Seeding**: Toàn bộ seeders hoạt động theo cơ chế **chỉ insert mới**, bỏ qua row gặp lỗi duplicate ID/unique key, **không xóa và không ghi đè dữ liệu cũ**.
3. **Default Login Accounts**: Cả hai tài khoản `admin@gmail.com` và `user@gmail.com` đều đã có trong seed data, role được gán chính xác, password hash bằng `bcrypt` hợp lệ với authentication flow hiện tại.
4. **Seed README Updated**: `lyora_backend/seed/README.md` đã được tạo/cập nhật và đối chiếu khớp với source code.
5. **Runner Integration**: `createSeedDB.ts` bao hàm toàn bộ seed files theo đúng thứ tự phụ thuộc khóa ngoại và có thể chạy không lỗi.
6. **Database Connection**: PostgreSQL đang phản hồi và cho phép truy vấn.

Nếu có bất kỳ tiêu chí nào chưa đạt (ví dụ DB thiếu cột/bảng do chưa đồng bộ schema): Đánh dấu **NOT READY**, nêu rõ lỗi bất đồng bộ và gợi ý phương án đồng bộ DB cụ thể cho developer.

---

## 5. MẪU BÁO CÁO KẾT QUẢ (OUTPUT REPORT FORMAT)

Báo cáo kết quả của `/lya-createSeedDB` bắt buộc phải bao gồm các mục chuẩn hóa sau:

### 1. Code vs Database Sync Analysis (Phân tích đồng bộ Logic Code & Quan hệ DB)
- **Trạng thái đồng bộ tổng quát**: `ĐỒNG BỘ` hoặc `CÓ BẤT ĐỒNG BỘ CẦN XỬ LÝ`
- Nếu phát hiện bất đồng bộ (hoặc nêu rõ "Không phát hiện bất đồng bộ" nếu khớp 100%):
| STT | Thành phần (Table / Column / FK / Logic) | Yêu cầu trong Logic Code | Thực trạng trong Database | Mức độ ảnh hưởng | Phương án đồng bộ DB gợi ý (Giữ dữ liệu cũ) |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | ... | ... | ... | ... | ... |

### 2. Default Login Accounts
| Role | Email | Password | Seed Status | Login Readiness |
| :--- | :--- | :--- | :---: | :---: |
| **Admin** | `admin@gmail.com` | `123456` | `PASS` | `READY` |
| **User** | `user@gmail.com` | `123456` | `PASS` | `READY` |

*(Ghi chú: Khi insert vào DB đang có dữ liệu, nếu tài khoản đã tồn tại thì bỏ qua giữ nguyên dữ liệu cũ; chỉ chèn mới nếu tài khoản chưa tồn tại).*

### 3. Seed Data Inventory
- **Tổng số seed files**: ...
- **Tổng số tables được seed**: ...
- **Bảng chi tiết**:
| STT | Seed File | Tên Bảng (Table) | Mô tả dữ liệu | Số bản ghi mẫu | Cơ chế trùng lặp (Duplicate Handling) | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| 1 | `users.seed.ts` | `users` | Tài khoản người dùng (Admin, User, Inactive, ...) | ... | Skip nếu trùng `id` / `email` | Complete |

- **Phân loại thay đổi**:
  - File mới tạo: ...
  - File đã cập nhật: ...
  - File giữ nguyên: ...
  - Table còn thiếu seed data (nếu có): Không

### 4. Seed README Status
- **Đường dẫn**: `lyora_backend/seed/README.md`
- **Trạng thái**: Đã tạo mới / Đã cập nhật
- **Xác nhận tài liệu hóa tài khoản mặc định**: `ĐÃ XÁC NHẬN (admin@gmail.com, user@gmail.com)`
- **Xác nhận khớp danh sách seed files & cơ chế Insert-Only**: `ĐÃ XÁC NHẬN (100% khớp source code)`

### 5. Overall Execution Readiness
- **Trạng thái**: **`READY`** (hoặc `NOT READY` kèm lý do và phương án đồng bộ gợi ý)

---

## 6. CƠ CHẾ TƯƠNG TÁC (INTERACTIVE PROCESS ACTION)

Khi Overall Execution Readiness là **READY**, Agent **BẮT BUỘC** gọi công cụ `ask_question` để cung cấp cho developer lựa chọn thực thi ngay:
- **Câu hỏi**: "Seed data (chế độ chỉ insert bổ sung, tự động bỏ qua bản ghi trùng và giữ nguyên toàn bộ dữ liệu cũ) cùng tài liệu seed/README.md đã sẵn sàng. Bạn có muốn chạy `/lya-insertSeedDB` để bổ sung các dữ liệu còn thiếu vào Database không?"
- **Tùy chọn**:
  - `(Recommended) Process (Chạy /lya-insertSeedDB để bổ sung dữ liệu còn thiếu)`
  - `Hủy (Giữ nguyên Database hiện tại)`
- **Hành vi tiếp theo**:
  - Nếu chọn `Process`: Agent lập tức chuyển sang thực thi luồng `/lya-insertSeedDB` (tuyệt đối không xóa dữ liệu cũ trong DB).
  - Nếu chọn `Hủy`: Dừng tác vụ và giữ nguyên hiện trạng.
