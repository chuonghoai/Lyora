# Quy tắc UI Component Layer

Trong hệ thống Web Client của Lyora (`lyora_client` và `lyora_admin`), UI Layer chịu trách nhiệm hiển thị giao diện người dùng, tuân thủ hệ thống **Design Tokens thống nhất** từ `DESIGN.md`, tái sử dụng tối đa các thành phần từ **`@lyora/web-shared`**, và đảm bảo khả năng tiếp cận (Accessibility - a11y).

---

## 1. Tổ chức thư mục UI và Tái sử dụng `lyora_web_shared`

```text
lyora_client/ hoặc lyora_admin/
├── src/
│   ├── components/             # Components riêng của từng ứng dụng
│   │   ├── common/             # Common composite đặc thù
│   │   └── ui/                 # UI primitives đặc thù (nếu chưa có trong lyora_web_shared)
│   ├── layouts/                # Layouts riêng (ClientLayout, AdminDashboardLayout)
│   ├── pages/                  # Page components theo từng Route
│   └── features/               # Domain feature components
```

- **Nguyên tắc ưu tiên:** Trước khi tạo mới một UI primitive (Button, Input, Spinner, Image loader, Modal...), developer/agent **BẮT BUỘC** kiểm tra gói `@lyora/web-shared`. Nếu đã có, phải import trực tiếp:
  ```tsx
  import { Button, Input, AppImage, LoadingSpinner } from '@lyora/web-shared';
  ```

---

## 2. Giao diện thống nhất (Unified Theme)

- Dự án áp dụng **một giao diện trực quan thống nhất**, không hỗ trợ chuyển đổi Light/Dark mode.
- Màu sắc, bo góc, bóng đổ và typography phải tuân thủ nghiêm ngặt các tokens đã định nghĩa trong `DESIGN.md`.
- Tuyệt đối không hardcode mã màu tùy tiện dạng `#000000` hoặc `#FFFFFF` mà không theo hệ thống token màu của hệ thống.

---

## 3. Form Handling & Keyboard Accessibility

Trên nền tảng Web, hành vi điều hướng bàn phím tuân theo tiêu chuẩn chuẩn mực của HTML5:

1. **Chuẩn HTML Form:**
   - Mọi form nhập liệu phải được bọc trong thẻ `<form onSubmit={handleSubmit}>`.
   - Nhấn phím **Enter** trên bất kỳ input nào trong form sẽ kích hoạt submit (chuẩn web accessibility).
2. **Tab Navigation (Điều hướng bằng phím Tab):**
   - Trình duyệt tự động điều hướng focus giữa các thẻ input theo thứ tự DOM tự nhiên. Tuyệt đối không can thiệp làm hỏng tab order mặc định.
3. **Form Accessibility & Error Feedback:**
   - Mọi trường nhập liệu phải có nhãn `<label htmlFor="...">` tương ứng với `id` của input.
   - Khi có lỗi validation, gắn thuộc tính `aria-invalid="true"` và hiển thị thông báo lỗi rõ ràng bằng tiếng Việt.

---

## 4. Hiển thị hình ảnh chuẩn hóa (`AppImage`)

- Bắt buộc tái sử dụng component `AppImage` từ `@lyora/web-shared`.
- Không sử dụng thẻ `<img>` trần mà không xử lý fallback, error state và skeleton loading.
- `AppImage` đã được tích hợp sẵn lazy loading (`loading="lazy"`), bo góc tùy biến (`rounded`), và ảnh fallback an toàn.

---

## 5. Áp dụng Anti-Default Discipline (Chống AI-Slop)

- Tuân thủ các nguyên tắc thiết kế từ Skill `design-taste-frontend`:
  - Không sử dụng các dải màu tím - hồng gradient rập khuôn của AI.
  - Bố cục layout theo nhịp điệu nội dung thực tế (bảng dữ liệu quản trị trong `lyora_admin`, lưới thẻ phản ánh trực quan trong `lyora_client`).
  - Hạn chế hiệu ứng kính (glassmorphism) lạm dụng gây nặng trình duyệt.
