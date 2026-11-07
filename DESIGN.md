# Lyora Design System Tokens (`DESIGN.md`)

Tài liệu này là **Nguồn chân lý (Source of Truth)** về màu sắc, kiểu chữ (typography), khoảng cách (spacing), và quy chuẩn thiết kế cho toàn bộ giao diện Web của hệ sinh thái Lyora (`lyora_client` và `lyora_admin`), được kế thừa từ gói `@lyora/web-shared`.

---

## 1. Hệ thống màu sắc thống nhất (Unified Color Tokens)

Dự án áp dụng **một giao diện trực quan thống nhất**, không triển khai chuyển đổi Light/Dark mode. Các mã màu được tổ chức tập trung để đảm bảo tính nhận diện thương hiệu và độ tương phản cao (WCAG 2.1 AA tối thiểu 4.5:1).

### 1.1. Brand Colors (Màu thương hiệu)
- **Primary (Teal):**
  - `primary-50`: `#E0F2F1` (Nền badge nhẹ)
  - `primary-100`: `#B2DFDB` (Viền active nhẹ)
  - `primary-500`: `#009688` (Accent nổi bật)
  - `primary-600`: `#00796B` (Màu thương hiệu chính - Buttons, Active states)
  - `primary-700`: `#004D40` (Hover state của nút chính)
- **Secondary (Emerald):**
  - `secondary-500`: `#10B981`
  - `secondary-600`: `#059669`

---

### 1.2. Semantic & Surface Tokens

| Token Name | Giá trị Hex | Tailwind Class tương đương | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `--color-bg-app` | `#F8FAFC` | `bg-slate-50` | Nền tổng thể của toàn bộ ứng dụng |
| `--color-bg-surface` | `#FFFFFF` | `bg-white` | Nền của Card, Container, Panel |
| `--color-bg-elevated` | `#F1F5F9` | `bg-slate-100` | Nền Dropdown, Popover, Tooltip, Dialog |
| `--color-text-primary` | `#0F172A` | `text-slate-900` | Tiêu đề chính, văn bản quan trọng (Contrast > 10:1) |
| `--color-text-secondary`| `#475569` | `text-slate-600` | Mô tả phụ, nhãn form, phụ đề |
| `--color-text-muted` | `#64748B` | `text-slate-500` | Timestamp, placeholder, ghi chú mờ |
| `--color-border-subtle` | `#E2E8F0` | `border-slate-200` | Đường phân cách, Divider, Card border |
| `--color-border-strong` | `#CBD5E1` | `border-slate-300` | Viền ô nhập liệu (Input border) |
| `--color-primary` | `#00796B` | `bg-teal-600` | Nút hành động chính, Icon active, Link nổi bật |
| `--color-primary-hover` | `#004D40` | `hover:bg-teal-700` | Trạng thái hover của nút chính |
| `--color-danger` | `#DC2626` | `text-red-600 / bg-red-600` | Báo lỗi, xóa dữ liệu, cảnh báo khẩn cấp |
| `--color-success` | `#16A34A` | `text-green-600 / bg-green-600` | Trạng thái hoàn thành, thành công |
| `--color-warning` | `#D97706` | `text-amber-600 / bg-amber-600` | Cảnh báo chờ xử lý |

---

## 2. Hệ thống Typography

- **Font Family Chính:**
  - Tiêu đề & Nội dung: `'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Mã nguồn & Code: `'JetBrains Mono', 'Fira Code', monospace`
- **Scale tỷ lệ kích thước font:**
  - `text-xs`: 12px / Line-height: 16px (Nhãn phụ, badge trạng thái)
  - `text-sm`: 14px / Line-height: 20px (Input text, table cell, body compact)
  - `text-base`: 16px / Line-height: 24px (Body chính)
  - `text-lg`: 18px / Line-height: 28px (Subheading)
  - `text-xl`: 20px / Line-height: 28px (Card title)
  - `text-2xl`: 24px / Line-height: 32px (Section header)
  - `text-3xl`: 30px / Line-height: 36px (Page header)

---

## 3. Spacing & Border Radius

- **Bo góc (Border Radius):**
  - Button & Input: `rounded-lg` (8px)
  - Card & Container: `rounded-xl` (12px)
  - Dialog & Modal: `rounded-2xl` (16px)
  - Tag & Badge: `rounded-full` (9999px)
- **Hệ thống Spacing (Đơn vị 4px):**
  - Khoảng cách giữa các section: `space-y-6` (24px) hoặc `space-y-8` (32px)
  - Padding trong Card: `p-5` (20px) hoặc `p-6` (24px)
  - Khoảng cách giữa Input và Label: `gap-1.5` (6px)

---

## 4. Áp dụng Anti-Default Discipline (Chống AI-Slop)

Khi xây dựng giao diện mới với Skill `design-taste-frontend`:
1. **Không dùng Gradient tím rập khuôn AI:** Tránh các dải chuyển màu tím - hồng mặc định (`from-purple-600 to-indigo-600`). Sử dụng nền đơn sắc sạch sẽ với điểm nhấn Teal thương hiệu.
2. **Không chia 3 Card vô hồn:** Bố cục layout theo nhịp điệu nội dung thực tế (bảng dữ liệu quản trị trong admin, danh sách thẻ trực quan trong client).
3. **Không lạm dụng Glassmorphism:** Hạn chế `backdrop-blur` dày đặc. Ưu tiên viền tinh tế (`border-slate-200`) và đổ bóng nhẹ (`shadow-sm`, `shadow-md`).
