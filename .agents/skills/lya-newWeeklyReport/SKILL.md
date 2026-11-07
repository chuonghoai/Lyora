---
name: lya-newWeeklyReport
description: >-
  Tự động hóa quá trình lập báo cáo tiến độ tuần cho dự án Lyora.
  Audit codebase thực tế, lập 4 file báo cáo (BaoCaoTuan[N].md, 01_promt_used.md, 02_AI_answer.md, 03_editted.md) theo đúng template chuẩn.
---

# lya-newWeeklyReport

Mục đích: Tự động hóa toàn bộ quy trình viết báo cáo tiến độ hằng tuần cho dự án Lyora Monorepo (`lyora_backend`, `lyora_client`, `lyora_admin`, `web_shared`). Dựa trên tên tuần và danh sách các chức năng do người dùng cung cấp, AI Agent tự động audit mã nguồn thực tế, đối chiếu kiến trúc, xây dựng prompt yêu cầu, lập kế hoạch giả định và chỉnh sửa các sai lệch kỹ thuật, xuất ra đủ 4 file Markdown chuẩn mẫu.

---

## Dependencies (Quy tắc phải tuân thủ)

- [Shared Workflow](../../rules/shared-workflow.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)
- [Shared Architecture Rules](../../rules/shared-architecture-rules.md)
- [Shared UI & Content Consistency Rules](../../rules/shared-ui-l10n-rules.md)
- [Design Taste Skill](../design-taste-frontend/SKILL.md) (Áp dụng khi audit hoặc mô tả các chức năng Web UI)
- [lya-newFeature](../lya-newFeature/SKILL.md) (Tham chiếu quy chuẩn lập Implementation Plan cho file 02)

---

## 1. Cấu trúc đầu vào & Quy tắc tiếp nhận

### 1.1. Cách gọi lệnh
Người dùng kích hoạt skill bằng lệnh:
`/lya-newWeeklyReport`

Sau đó cung cấp tên tuần và danh sách các chức năng cần báo cáo.

### 1.2. Mẫu đầu vào hợp lệ
```text
Tuần 8:
- Triển khai tính năng xem và đăng tải tin tức cho admin trên lyora_admin.
- Cải thiện giao diện trang chủ và tạo phản ánh của web client trên lyora_client.
- Tích hợp component Button và Input dùng chung từ web_shared.
- Bổ sung cơ chế gửi thông báo qua WebSocket trên lyora_backend.
```

### 1.3. Quy tắc kiểm tra đầu vào (Input Validation)
1. **Kiểm tra tính đầy đủ:** Nếu thiếu tên tuần hoặc danh sách chức năng, Agent **MUST** dừng lại và yêu cầu người dùng bổ sung đầy đủ trước khi thực hiện.
2. **Không tự suy đoán:** Tuyệt đối không tự ý bổ sung hoặc suy đoán các chức năng không nằm trong danh sách người dùng đã cung cấp.
3. **Bảo toàn phạm vi:** Giữ nguyên ý nghĩa, bản chất và phạm vi của từng chức năng do người dùng nhập.

---

## 2. Ma trận nguồn dữ liệu & Giả định cốt lõi giữa 4 file

| File | Giả định cốt lõi | Nguồn dữ liệu sử dụng | Mục đích & Đặc thù kỹ thuật |
| :--- | :--- | :--- | :--- |
| **`BaoCaoTuan[N].md`** | Tính năng **ĐÃ/ĐANG TRIỂN KHAI** trong thực tế | Kết quả Audit trực tiếp từ Codebase | Phản ánh trung thực 100% hiện trạng code: Hoàn thiện / Một phần / Chưa triển khai. Cột "Người phụ trách" **MUST để trống**. Cột "Tiến độ" tính theo % thực tế audit. Tuyệt đối **KHÔNG** dùng sai lệch từ file 02. |
| **`01_promt_used.md`** | Mặc định tất cả chức năng **CHƯA ĐƯỢC TRIỂN KHAI** | Góc nhìn yêu cầu sản phẩm của Khách hàng / PO | Đóng vai khách hàng mô tả bài toán và yêu cầu tính năng cho AI Agent. **TUYỆT ĐỐI KHÔNG** chứa chi tiết code (tên file, class, method, API endpoint, hex color, DB table/column). |
| **`02_AI_answer.md`** | Mặc định tất cả chức năng **CHƯA ĐƯỢC TRIỂN KHAI** | Kiến trúc Lyora + **Cố ý tạo 2–6 sai lệch hợp lý** | Đóng vai AI Agent phản hồi prompt ở file 01 bằng Implementation Plan (theo `/lya-newFeature`). Kế hoạch bám sát kiến trúc thật nhưng **CỐ Ý ĐƯA VÀO 2–6 SAI LỆCH HỢP LÝ** về logic/chu kỳ/trình tự. Không tiết lộ việc cố ý viết sai. |
| **`03_editted.md`** | Đối chiếu kế hoạch với **CODE THỰC TẾ** | So khớp file `02_AI_answer.md` với Codebase | Đóng vai Tech Lead / Developer đối chiếu và sửa lại đúng các sai lệch trong file 02 theo mã nguồn thật. Trình bày dạng bullet points ngắn gọn chuẩn template. |

---

## 3. Quy trình thực hiện chi tiết (Workflow 7 bước)

### Step 1 — Tiếp nhận & Kiểm tra đầu vào (Validate Input)
1. Trích xuất số tuần $N$ từ chuỗi người dùng nhập (ví dụ: `tuần 8` -> `8`, tạo tiền tố `BaoCaoTuan8`).
2. Trích xuất danh sách chức năng thành các hạng mục độc lập.

### Step 2 — Audit Codebase thực tế (Codebase Audit)
Rà soát toàn diện mã nguồn trong 4 workspace:
- **Frontend Client (`lyora_client/src/`):** Màn hình, components, routing, UI Controller hook.
- **Frontend Admin (`lyora_admin/src/`):** Dashboard, bảng dữ liệu quản trị, admin routing.
- **Shared Resources (`web_shared/src/`):** UI components dùng chung, hooks, utils, types, `apiClient`.
- **Backend API (`lyora_backend/src/`):** Controllers, DTOs, Services, Repositories, WebSocket Gateways.
- **UI & Content:** Tokens theo `DESIGN.md`, Tiếng Việt thống nhất (không dùng i18n, không dùng Dark/Light mode).

### Step 3 — Tạo file `BaoCaoTuan[N].md` (Báo cáo tiến độ tuần)
- Áp dụng cấu trúc template chuẩn `weekly_reports/templete/BaoCaoTuan7.md`.
- Cột "Người phụ trách" hoàn toàn để trống. Cột "Tiến độ" tính theo % thực tế audit.

### Step 4 — Tạo file `01_promt_used.md` (Prompt yêu cầu triển khai)
- Đóng vai PO/Khách hàng mô tả yêu cầu tính năng cho `/lya-newFeature`.
- **TUYỆT ĐỐI KHÔNG** dùng tên file (`.tsx`, `.ts`), tên class, endpoint URL, hex color, DB table/col, code snippet.

### Step 5 — Tạo file `02_AI_answer.md` (Kế hoạch với 2–6 sai lệch hợp lý)
- Đóng vai AI Agent phản hồi bằng Implementation Plan chi tiết theo `/lya-newFeature` bám sát kiến trúc Lyora Monorepo (`lyora_client`, `lyora_admin`, `lyora_backend`, `web_shared`).
- **Bắt buộc cố ý đưa vào 2 đến 6 điểm sai lệch kỹ thuật hợp lý** (chu kỳ thời gian, ngưỡng khoảng cách, thứ tự phát sự kiện, phạm vi client vs admin) để tạo cơ sở đối chiếu cho file 03.
- Tuyệt đối không tiết lộ việc cố ý tạo sai lệch.

### Step 6 — Tạo file `03_editted.md` (Đối chiếu & Sửa sai lệch)
- Đóng vai Tech Lead đối chiếu file 02 với codebase thực tế, chỉnh sửa toàn bộ các điểm sai lệch về đúng mã nguồn thật dạng bullet points.

### Step 7 — Xuất file & Kiểm tra an toàn
- Lưu đủ 4 file tại `weekly_reports/BaoCaoTuan[N]/`.
- Không ghi đè báo cáo tuần cũ nếu chưa có sự đồng ý của người dùng.

