# UI View Layer Rules (`lyora_web/src/ui`)

Tài liệu này quy chuẩn cấu trúc thư mục, quy tắc thiết kế và cách tổ chức các thành phần trong tầng giao diện (**UI Layer**) của `lyora_web`.

---

## 1. Cấu Trúc 3 Module Gốc Duy Nhất

Trong `src/ui/`, bắt buộc chỉ tồn tại đúng 3 module cấp cao nhất:

```text
src/ui/
├── admin/                      # Cổng Quản Trị Viên
│   ├── AdminLayout.tsx         # Layout khung điều hướng Admin
│   ├── admin-layout.controller.ts # Controller cho AdminLayout
│   ├── dashboard/              # Submodule màn hình Dashboard
│   │   ├── DashboardView.tsx   # View trình diễn
│   │   └── dashboard.controller.ts # Controller điều phối
│   └── index.ts
│
├── auth/                       # Phân Hệ Xác Thực
│   ├── login/                  # Submodule màn hình Login
│   │   ├── LoginView.tsx       # View chính
│   │   ├── login.controller.ts # Controller điều phối
│   │   └── LoginForm.tsx       # Subcomponent nhận controller
│   └── index.ts
│
├── client/                     # Cổng Khách Hàng
│   ├── ClientLayout.tsx        # Layout khung điều hướng Client
│   ├── client-layout.controller.ts # Controller cho ClientLayout
│   ├── home/                   # Submodule màn hình Home
│   │   ├── HomeView.tsx        # View trình diễn
│   │   └── home.controller.ts  # Controller điều phối
│   └── index.ts
│
└── index.ts                    # Public barrel export
```

### Quy tắc tổ chức bên trong Submodule con:
- View (`*View.tsx`), Controller (`*.controller.ts`) và các UI subcomponent con được đặt **phẳng trong cùng một thư mục**.
- **Tuyệt đối KHÔNG** tạo các thư mục con `views/`, `controllers/`, hoặc `components/`.

---

## 2. Tái Sử Dụng Thành Phần Từ Core (`@core`)

Trước khi tạo bất kỳ UI component cục bộ nào, bắt buộc kiểm tra và tái sử dụng các primitives từ `src/core/components/`:
- **`Button`:** Nút bấm chuẩn với variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) và cờ `isLoading`.
- **`Input`:** Ô nhập liệu với nhãn, thông báo lỗi validation, helper text và trạng thái focus chuẩn.
- **`AppImage`:** Tải hình ảnh an toàn với skeleton loading, fallback khi lỗi và lazy loading.
- **`LoadingSpinner`:** Vòng quay tải trang đồng bộ.

---

## 3. Giao Diện Thống Nhất (Unified Theme)

- **Không chuyển đổi Light/Dark mode:** Hệ sinh thái sử dụng duy nhất một giao diện trực quan tiêu chuẩn.
- **Tuân thủ Design Tokens từ `DESIGN.md`:**
  - Primary Color: `#2563eb` (Primary Blue).
  - Background: `#f8fafc`.
  - Surface: `#ffffff` kèm border `#cbd5e1` hoặc `#e2e8f0`.
  - Text Primary: `#0f172a`.
  - Text Secondary: `#475569`.
- **Anti-Default Discipline:**
  - Không sử dụng gradient tím rập khuôn AI.
  - Bố cục thông thoáng, padding thoải mái.

---

## 4. Ngôn Ngữ Tiếng Việt Chuẩn Mực (Unified Language)

- Toàn bộ văn bản hiển thị cho người dùng (tiêu đề, nhãn nút, placeholder, thông báo lỗi, toast) được viết trực tiếp bằng **Tiếng Việt chuẩn mực, mạch lạc, dễ hiểu**.
- Không sử dụng thư viện đa ngôn ngữ (i18n / `react-i18next`).
