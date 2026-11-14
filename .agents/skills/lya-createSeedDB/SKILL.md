---
name: lya-createSeedDB
description: >-
  Audit Database Entities, tạo/cập nhật seed files trong lyora_backend/seed/, đảm bảo tài khoản đăng nhập mặc định (Admin, User), đồng bộ seed/README.md, đánh giá Readiness và kích hoạt Process chạy /lya-insertSeedDB.
---

# lya-createSeedDB

Mục đích: Khảo sát toàn diện Database Entities và Database Schema trong `lyora_backend`, đối chiếu các file seed data hiện có trong `lyora_backend/seed/`, tạo mới hoặc cập nhật các file seed data theo chuẩn quan hệ và bảo mật, **bắt buộc tạo sẵn hai tài khoản đăng nhập mặc định (Admin & User)** nếu có table tài khoản người dùng, **tạo/cập nhật tài liệu `lyora_backend/seed/README.md`**, đánh giá mức độ sẵn sàng thực thi (Readiness: `READY` / `NOT READY`) và cung cấp nút bấm tương tác "Process" để chuyển giao sang `/lya-insertSeedDB`.

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
4. **Điều kiện áp dụng & Ràng buộc**:
   - Nếu table tài khoản đăng nhập đã có seed file: Kiểm tra và bổ sung hai tài khoản nếu còn thiếu; nếu đã có, chuẩn hóa đúng email, role và password hash.
   - Nếu chưa có seed file: Tạo mới và bao gồm hai tài khoản này.
   - Không tạo tài khoản trùng email. Không bỏ qua quy định này chỉ vì đã có những tài khoản seed khác.
   - Nếu cấu trúc Database hoặc nghiệp vụ hiện tại không cho phép tạo hai tài khoản theo yêu cầu: Phải báo cáo chính xác nguyên nhân và đánh dấu audit là `NOT READY`. Tuyệt đối không tự ý thay đổi nghiệp vụ để ép triển khai.

---

## 2. QUY TRÌNH ĐỒNG BỘ TÀI LIỆU `lyora_backend/seed/README.md`

Sau khi hoàn thành audit và tạo/cập nhật seed data, **BẮT BUỘC** phải tạo mới hoặc cập nhật file:
`lyora_backend/seed/README.md`

File `seed/README.md` phải phản ánh chính xác trạng thái thực tế sau mỗi lần chạy `/lya-createSeedDB`, bao gồm 6 mục:

- **A. Overview**: Mục đích của folder `seed/`, vai trò của seed data trong phát triển và kiểm thử, cách sử dụng `createSeedDB.ts`, lưu ý dữ liệu chỉ phục vụ development/testing.
- **B. Default Login Accounts**: Bảng hiển thị rõ hai tài khoản bắt buộc (`admin@gmail.com` / `123456`, `user@gmail.com` / `123456`), ghi chú về password hashing, role thực tế, khuyến cáo không dùng trên production.
- **C. Seed Data Inventory**: Bảng liệt kê toàn bộ seed data hiện có (`STT`, `Seed File`, `Table`, `Description`, `Records`, `Status`). Không bỏ sót file, không liệt kê file không tồn tại, không tự đoán số lượng records (ghi `Not verified` nếu chưa đếm được).
- **D. Database Relationships & Insert Order**: Mô tả các quan hệ ràng buộc khóa ngoại (Foreign Keys) và thứ tự insert an toàn giữa các tables.
- **E. Execution**: Hướng dẫn chi tiết cách chạy seed data theo đúng npm scripts và runtime của Backend (`npm run backend:seed`), giải thích file entry point và mối liên hệ với `/lya-insertSeedDB`.
- **F. Important Notes**: Lưu ý an toàn, cấm dùng trên production, không sửa logic auth, không tự ý xóa CSDL khi chỉ chạy `/lya-createSeedDB`.

---

## 3. QUY TRÌNH THỰC HIỆN (WORKFLOW 5 BƯỚC)

### Step 1 — Audit Database Entities, Schema & Auth Mechanism
1. Rà soát tất cả các file Entity trong dự án (`lyora_backend/src/modules/**/entities/*.entity.ts`, `src/common/entities/*.entity.ts`).
2. Xác định cấu trúc bảng, khóa chính, các cột bắt buộc (`nullable: false`), trường Unique, Enums, Indexes.
3. Xác định cơ chế Authentication (`src/modules/auth/`, `src/common/enums/role.enum.ts`):
   - Thuật toán hash mật khẩu: `bcrypt`.
   - Phân quyền thực tế: `ADMIN`, `CLIENT`.
   - Table chứa tài khoản người dùng: `users` (Entity `User`).

### Step 2 — Audit Existing Seed Files
1. Khảo sát thư mục `lyora_backend/seed/`.
2. Kiểm tra `seed.config.ts`, `createSeedDB.ts`, và các file seed theo từng Entity (như `users.seed.ts`).
3. Đối chiếu sự tồn tại của hai tài khoản mặc định `admin@gmail.com` và `user@gmail.com`.
4. Phát hiện các vấn đề: Thiếu seed file cho Entity mới, thiếu tài khoản đăng nhập mặc định, mật khẩu chưa băm bcrypt, thứ tự insert sai.

### Step 3 — Create / Update Seed Files & Default Accounts
1. **Cấu hình & Runner**:
   - `seed.config.ts`: Quản lý TypeORM `DataSource`, hàm `assertSafeEnvironment()` ngăn chặn môi trường Production.
   - `createSeedDB.ts`: Điều phối thực thi tuần tự các hàm seed, log tiến độ, đóng kết nối an toàn.
2. **Seed Files**:
   - Bổ sung/cập nhật hai tài khoản bắt buộc vào seed data:
     - `admin@gmail.com` / `123456` với `UserRole.ADMIN`.
     - `user@gmail.com` / `123456` với `UserRole.CLIENT`.
   - Băm mật khẩu bằng `bcrypt.hash(password, 10)`.
   - Giữ lại hoặc bổ sung các tài khoản kiểm thử bổ sung (ví dụ: tài khoản bị khóa).

### Step 4 — Synchronize `lyora_backend/seed/README.md`
1. Tạo hoặc cập nhật `lyora_backend/seed/README.md` theo đầy đủ 6 phần (A đến F) nêu tại Mục 2.
2. Đối chiếu nội dung README với source code thực tế để bảo đảm 100% khớp: Không thiếu file, không sai số lượng bản ghi, không sai tài khoản mặc định.

### Step 5 — Execution Readiness Check & Output Report
Thực hiện đánh giá kỹ thuật toàn diện và xuất báo cáo kết quả.

---

## 4. TIÊU CHÍ ĐÁNH GIÁ SẴN SÀNG (READINESS CRITERIA)

Trạng thái **READY** chỉ được thiết lập khi đáp ứng **toàn bộ** các tiêu chí sau:
1. **Schema Match**: Dữ liệu seed tuân thủ 100% constraints, enums, quan hệ của Database Schema.
2. **Default Login Accounts**: Cả hai tài khoản `admin@gmail.com` và `user@gmail.com` đều đã có trong seed data, role được gán chính xác, password hash bằng `bcrypt` hợp lệ với authentication flow hiện tại.
3. **Seed README Updated**: `lyora_backend/seed/README.md` đã được tạo/cập nhật và đối chiếu khớp với source code.
4. **Runner Integration**: `createSeedDB.ts` bao hàm toàn bộ seed files và có thể chạy không lỗi.
5. **Database Connection**: PostgreSQL đang phản hồi và cho phép truy vấn.

Nếu có bất kỳ tiêu chí nào chưa đạt: Đánh dấu **NOT READY** và ghi rõ nguyên nhân cụ thể.

---

## 5. MẪU BÁO CÁO KẾT QUẢ (OUTPUT REPORT FORMAT)

Báo cáo kết quả của `/lya-createSeedDB` bắt buộc phải bao gồm các bảng chuẩn hóa sau:

### 1. Default Login Accounts
| Role | Email | Password | Seed Status | Login Readiness |
| :--- | :--- | :--- | :---: | :---: |
| **Admin** | `admin@gmail.com` | `123456` | `PASS` | `READY` |
| **User** | `user@gmail.com` | `123456` | `PASS` | `READY` |

*(Ghi chú: Login Readiness chỉ đạt `READY` khi tài khoản có trong seed data, role đúng, password hash hợp lệ với backend và quan hệ bắt buộc đã được thiết lập).*

### 2. Seed Data Inventory
- **Tổng số seed files**: ...
- **Tổng số tables được seed**: ...
- **Bảng chi tiết**:
| STT | Seed File | Tên Bảng (Table) | Mô tả dữ liệu | Số bản ghi | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `users.seed.ts` | `users` | Tài khoản người dùng (Admin, User, Inactive) | 3 | Complete |

- **Phân loại thay đổi**:
  - File mới tạo: ...
  - File đã cập nhật: ...
  - File giữ nguyên: ...
  - Table còn thiếu seed data (nếu có): Không

### 3. Seed README Status
- **Đường dẫn**: `lyora_backend/seed/README.md`
- **Trạng thái**: Đã tạo mới / Đã cập nhật
- **Xác nhận tài liệu hóa tài khoản mặc định**: `ĐÃ XÁC NHẬN (admin@gmail.com, user@gmail.com)`
- **Xác nhận khớp danh sách seed files**: `ĐÃ XÁC NHẬN (100% khớp source code)`

### 4. Overall Execution Readiness
- **Trạng thái**: **`READY`** (hoặc `NOT READY` kèm lý do)

---

## 6. CƠ CHẾ TƯƠNG TÁC (INTERACTIVE PROCESS ACTION)

Khi Overall Execution Readiness là **READY**, Agent **BẮT BUỘC** gọi công cụ `ask_question` để cung cấp cho developer lựa chọn thực thi ngay:
- **Câu hỏi**: "Seed data và tài liệu seed/README.md đã được chuẩn bị đầy đủ và sẵn sàng. Bạn có muốn thực hiện `/lya-insertSeedDB` để xóa dữ liệu cũ và khởi tạo dữ liệu mẫu vào Database không?"
- **Tùy chọn**:
  - `(Recommended) Process (Chạy /lya-insertSeedDB)`
  - `Hủy (Giữ nguyên Database hiện tại)`
- **Hành vi tiếp theo**:
  - Nếu chọn `Process`: Agent lập tức chuyển sang thực thi luồng `/lya-insertSeedDB`.
  - Nếu chọn `Hủy`: Dừng tác vụ và giữ nguyên hiện trạng.
