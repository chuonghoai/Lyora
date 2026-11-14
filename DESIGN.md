---
name: Lyora Design System
description: Tài liệu chuẩn hóa giao diện người dùng (UI) cho nền tảng mạng xã hội Lyora theo theme chính thức "Clean & Trustworthy".
colors:
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  primary-active: "#1E40AF"
  on-primary: "#FFFFFF"
  secondary: "#DBEAFE"
  secondary-strong: "#93C5FD"
  background: "#F3F4F6"
  card: "#FFFFFF"
  foreground: "#111827"
  muted: "#6B7280"
  accent: "#F43F5E"
  border: "#E5E7EB"
  success: "#16A34A"
  warning: "#D97706"
  error: "#DC2626"
  info: "#0284C7"
typography:
  fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
  monoFamily: "ui-monospace, Consolas, monospace"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
---

# Design System: Lyora — Clean & Trustworthy

## 1. Tổng quan

**Lyora** là nền tảng mạng xã hội cộng đồng số tập trung vào **đăng bài viết, chia sẻ, tương tác thời gian thực và nhắn tin trực tiếp** (hoàn toàn phi thương mại).

- **Theme chính thức:** **Clean & Trustworthy**
- **Tính cách thiết kế:** Sạch sẽ, đáng tin cậy, thân thiện, nhiều khoảng trắng và dễ quét thông tin cho trải nghiệm mạng xã hội đại chúng.
- **Chế độ hiển thị:** Chỉ hỗ trợ **Light Mode** ở thời điểm hiện tại.
- **Phạm vi áp dụng:** Toàn bộ giao diện thuộc `lyora_web` (Auth, Cổng người dùng, Trung tâm quản trị, core components) và các mẫu HTML/email đồng bộ từ `lyora_backend`.

---

## 2. Bảng màu chuẩn (Design Tokens)

### 2.1. Token gốc (Bắt buộc giữ nguyên giá trị)

| Token | Biến CSS (`:root`) | Giá trị HEX | Mục đích sử dụng | Class Tailwind tương ứng |
| :--- | :--- | :--- | :--- | :--- |
| `primary` (`pri`) | `--pri` | `#2563EB` | Nút chính, liên kết, logo, tab/icon đang active, bong bóng chat của mình | `bg-primary`, `text-primary`, `border-primary`, `fill-primary` |
| `on-primary` (`onpri`) | `--onpri` | `#FFFFFF` | Chữ và icon đặt trên nền `primary` (hoặc trên nền `accent`/`error`/`success` đậm) | `text-on-primary` |
| `secondary` (`sec`) | `--sec` | `#DBEAFE` | Nền nhấn nhẹ: badge/chip thông tin, nền mục điều hướng đang chọn, nền nút phụ, vùng chọn nhẹ | `bg-secondary` |
| `secondary-strong` (`sec2`) | `--sec2` | `#93C5FD` | Điểm nhấn phụ, viền focus nhạt, chi tiết trang trí logo/panel, skeleton nhấn nhẹ | `bg-secondary-strong`, `border-secondary-strong`, `fill-secondary-strong` |
| `background` (`bg`) | `--bg` | `#F3F4F6` | Nền trang tổng thể, nền bong bóng chat của người khác, nền hover trung tính nhẹ | `bg-background` |
| `card` | `--card` | `#FFFFFF` | Nền card bài viết, khung form, modal, popover, header, sidebar, ô nhập liệu | `bg-card` |
| `foreground` (`txt`) | `--txt` | `#111827` | Chữ chính (tiêu đề, tên người dùng, nội dung bài viết, tin nhắn, label) | `text-foreground` |
| `muted` (`mut`) | `--mut` | `#6B7280` | Chữ phụ, placeholder, timestamp, mô tả phụ, icon ở trạng thái không active | `text-muted`, `placeholder:text-muted` |
| `accent` (`acc`) | `--acc` | `#F43F5E` | Nút Like đã thích, badge số thông báo/tin nhắn chưa đọc, chấm chú ý | `bg-accent`, `text-accent`, `border-accent` |
| `border` (`bd`) | `--bd` | `#E5E7EB` | Viền card, input, nút outline, đường kẻ phân cách cột/hàng | `border-border`, `divide-border` |

> **Lưu ý đặt tên:** Token gốc `txt` được ánh xạ sang tên Tailwind ngữ nghĩa `foreground` (`text-foreground`) để tránh trùng lặp ngữ pháp `text-text` khi viết class Tailwind.

### 2.2. Token dẫn xuất (Chuẩn hóa bổ sung từ bộ gốc)

| Token | Biến CSS (`:root`) | Giá trị | Mục đích sử dụng | Class Tailwind tương ứng |
| :--- | :--- | :--- | :--- | :--- |
| `primary-hover` | `--pri-hover` | `#1D4ED8` | Trạng thái di chuột (`hover`) của nút `primary` và liên kết chính | `hover:bg-primary-hover`, `hover:text-primary-hover` |
| `primary-active` | `--pri-active` | `#1E40AF` | Trạng thái nhấn giữ (`active`) của nút `primary` và chữ tương phản trên nền `secondary` | `active:bg-primary-active`, `text-primary-active` |
| `surface-hover` | `--surface-hover` | `#F3F4F6` (`bg`) | Nền phản hồi khi di chuột lên nút `ghost`, hàng bảng hoặc mục menu thụ động trên nền `card` | `hover:bg-background` (hoặc `hover:bg-secondary/60` với nút/menu nhấn nhẹ) |
| Focus Ring | `primary` ở mức mờ `40%` | `rgba(37, 99, 235, 0.4)` | Vòng sáng hỗ trợ tiếp cận bàn phím (`2px`, `offset 2px`) | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card` |
| Chat bubble (người khác) | `--bg` & `--txt` | Nền `#F3F4F6`, chữ `#111827` | Bong bóng tin nhắn nhận được trong khung chat | `bg-background text-foreground` |
| Disabled control | `--bg` & `--mut` | Nền `#F3F4F6`, chữ `muted` với `opacity-55` | Trạng thái vô hiệu hóa cho button, input, textarea | `disabled:bg-background disabled:text-muted/60 disabled:border-border disabled:cursor-not-allowed` |

### 2.3. Màu trạng thái hệ thống (Semantic Status Colors)

Nhóm màu trạng thái được định nghĩa **tách biệt hoàn toàn với `accent` (`#F43F5E`)**. Không dùng `accent` thay cho màu lỗi, và không dùng `error` cho nút Like hay badge thông báo thông thường.

| Token | Biến CSS | Giá trị HEX | Mục đích sử dụng | Class Tailwind tương ứng |
| :--- | :--- | :--- | :--- | :--- |
| `success` | `--color-success` | `#16A34A` | Trạng thái thành công, xác nhận lưu, chấm trạng thái đang online trong chat | `text-success`, `bg-success`, `bg-success/10`, `border-success/30` |
| `warning` | `--color-warning` | `#D97706` | Cảnh báo cần kiểm tra, nội dung chờ duyệt, giới hạn thao tác | `text-warning`, `bg-warning`, `bg-warning/10`, `border-warning/30` |
| `error` | `--color-error` | `#DC2626` | Lỗi hệ thống, lỗi validation form, thao tác nguy hiểm (xóa/chặn/báo cáo vi phạm) | `text-error`, `bg-error`, `bg-error/10`, `border-error` |
| `info` | `--color-info` | `#0284C7` | Thông báo thông tin trung tính từ hệ thống (toast/banner thông tin) | `text-info`, `bg-info`, `bg-info/10`, `border-info/30` |

---

## 3. Quy tắc sử dụng màu (Do / Don't)

### Quy tắc bắt buộc (Do)
- **Chỉ dùng token ngữ nghĩa đã map trong Tailwind:** Mọi màu nền, chữ, viền, ring phải dùng qua class token (`bg-primary`, `bg-card`, `text-foreground`, `text-muted`, `border-border`, `ring-primary/40`...).
- **Tối đa 1 nút `primary` nổi bật trong mỗi khu vực hành động:** Các hành động phụ đi kèm phải dùng biến thể `secondary` (`bg-secondary text-primary-active`), `outline` (`bg-card border border-border text-foreground`) hoặc `ghost`.
- **Dùng `accent` (`#F43F5E`) đúng ngữ cảnh thu hút cảm xúc/chưa đọc:** Chỉ dành cho trạng thái đã thích (Liked heart), badge đếm thông báo/tin nhắn chưa đọc hoặc chấm chỉ báo chưa xem.
- **Đảm bảo tương phản WCAG AA ($\ge 4.5:1$ cho chữ thường):**
  - `foreground` (`#111827`) trên `card` (`#FFFFFF`) đạt ~17.7:1; trên `background` (`#F3F4F6`) đạt ~16.1:1.
  - `on-primary` (`#FFFFFF`) trên `primary` (`#2563EB`) đạt ~5.17:1.
  - **Lưu ý với `muted` (`#6B7280`):** Trên nền `card` (`#FFFFFF`) đạt ~4.83:1 (đạt AA), nhưng trên nền `background` (`#F3F4F6`) chỉ đạt ~4.35:1 (sát ngưỡng AA). Do đó, trên nền `background` chỉ dùng `text-muted` cho chữ phụ cỡ vừa (`13px–14px` trở lên) hoặc tăng lên `text-foreground` với thông tin quan trọng / chữ nhỏ `12px`.

### Điều cấm (Don't)
- **CẤM hard-code** mã `#hex`, `rgb()`, `rgba()`, `hsl()` hoặc giá trị tùy ý (`bg-[#2563EB]`, `text-[#6B7280]`) trong component `.tsx`/`.css` (ngoài tệp định nghĩa token và SVG tĩnh cần thiết).
- **CẤM dùng class màu mặc định của Tailwind** (`bg-blue-600`, `text-gray-500`, `border-slate-200`, `bg-white`, `text-black`, `bg-rose-500`...).
- **CẤM dùng `accent` (`#F43F5E`)** làm màu trang trí đại trà hoặc thay thế `error` (`#DC2626`) cho thông báo lỗi input.
- **CẤM tự thêm Dark Mode (`dark:...`)** hoặc trộn các hệ màu cũ (Coral, Violet AI...) vào giao diện.

### Ví dụ Đúng / Sai

```tsx
// ĐÚNG: Dùng hoàn toàn token ngữ nghĩa
<button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:bg-background disabled:text-muted/60">
  Đăng bài
</button>

// SAI: Dùng class mặc định của Tailwind hoặc mã hex tùy ý
<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-[#1D4ED8]">
  Đăng bài
</button>
```

```tsx
// ĐÚNG: Input dùng token card, border, foreground, muted, error và focus ring
<input
  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
/>

// SAI: Dùng border-gray-300, bg-white, text-slate-900
<input className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900" />
```

```tsx
// ĐÚNG: Card và Link chuẩn token
<article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
  <a href="/profile" className="font-semibold text-primary hover:text-primary-hover hover:underline">
    Xem hồ sơ
  </a>
</article>

// SAI: Hard-code shadow và bg-white
<article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
  <a href="/profile" className="text-[#2563EB]">Xem hồ sơ</a>
</article>
```

---

## 4. Typography

- **Font chữ chính (`font-sans`):** `'Be Vietnam Pro', system-ui, sans-serif` (tối ưu dấu tiếng Việt rõ nét).
- **Font kỹ thuật (`font-mono`):** `ui-monospace, Consolas, monospace` (chỉ dùng cho ID, token, mã code).
- **Cách nạp font:** Nạp **Be Vietnam Pro** với các weight `400`, `500`, `600`, `700` tại `lyora_web/index.html` (kèm fallback `system-ui, sans-serif`) và gắn làm `font-sans` mặc định cho toàn bộ `body`.

| Cấp độ | Cỡ chữ | Line Height | Font Weight | Class Tailwind mẫu | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (H1)** | `24px–30px` | `1.2–1.25` | `700` (Bold) | `text-2xl sm:text-3xl font-bold tracking-tight text-foreground` | Tiêu đề trang chính, tiêu đề form Đăng nhập / Đăng ký |
| **Section Heading (H2)** | `18px–20px` | `1.3` | `600` (Semibold) | `text-lg sm:text-xl font-semibold text-foreground` | Tiêu đề khu vực, tên bảng điều khiển, tiêu đề modal |
| **Card Title (H3)** | `16px` | `1.4` | `600` (Semibold) | `text-base font-semibold text-foreground` | Tên tác giả bài viết, tiêu đề card con |
| **Body** | `14px–16px` | `1.5–1.6` | `400` (Regular) | `text-sm sm:text-base font-normal leading-relaxed text-foreground` | Nội dung bài viết, bình luận, tin nhắn, mô tả |
| **Button / Label** | `14px` | `1.4` | `500–600` | `text-sm font-medium text-foreground` / `text-sm font-semibold` | Nhãn nút bấm, label ô nhập liệu, tab điều hướng |
| **Caption / Metadata** | `12px` | `1.4` | `400–500` | `text-xs font-normal text-muted` | Thời gian đăng, số lượt tương tác phụ, chú thích ảnh |

---

## 5. Hình khối, Viền & Khoảng cách

### Bo góc (Border Radius)
- **Card / Modal / Khung lớn:** `12px–16px` → `rounded-xl` (`12px`) hoặc `rounded-2xl` (`16px`).
- **Input / Textarea / Button:** `8px–10px` → `rounded-lg` (`8px`) hoặc `rounded-[10px]` (ưu tiên thống nhất `rounded-lg` / token `--radius-lg` = `8px`).
- **Avatar / Badge / Chip / Pill:** Bo tròn hoàn toàn → `rounded-full`.
- **Checkbox / Micro control:** `4px` → `rounded`.

### Đổ bóng & Viền (Elevation & Borders)
- **Viền chuẩn:** Luôn là `1px` màu `border` (`border border-border`).
- **Đổ bóng nhẹ:** Dùng `shadow-sm` cho card nổi nhẹ/dropdown/popover và `shadow-md` cho modal/toast nổi trên lớp phủ. Tuyệt đối không dùng bóng đậm hoặc phát sáng neon.

### Khoảng cách (Spacing)
Sử dụng thang spacing chuẩn của Tailwind (bội số `4px`):
- Khoảng cách vi mô (icon – chữ): `gap-1.5` (`6px`) hoặc `gap-2` (`8px`).
- Khoảng cách giữa các trường trong form: `space-y-4` (`16px`) hoặc `space-y-5` (`20px`).
- Khoảng cách giữa các card trên feed: `space-y-4` (`16px`) hoặc `gap-4` (`16px`).
- Padding trong Card: `p-4 sm:p-6` (card nhỏ/feed) hoặc `p-6 sm:p-8` (form auth/card lớn).

---

## 6. Quy chuẩn Component chính

### 6.1. Button (`@core/components/Button.tsx`)
- **Base:** `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:bg-background disabled:text-muted/60 disabled:border-border disabled:cursor-not-allowed`
- **Primary:** `bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active`
- **Secondary:** `bg-secondary text-primary-active hover:bg-secondary-strong/50 active:bg-secondary-strong/70`
- **Ghost / Outline:**
  - Outline: `border border-border bg-card text-foreground hover:bg-background`
  - Ghost: `bg-transparent text-muted hover:bg-background hover:text-foreground`
- **Danger:** `bg-error text-on-primary hover:bg-error/90 active:bg-error`

### 6.2. Input / Textarea (`@core/components/Input.tsx`)
- **Default:** `w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors duration-150`
- **Focus:** `focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40`
- **Error:** `border-error focus:border-error focus:ring-2 focus:ring-error/25` kèm thông báo `<span role="alert" className="text-xs text-error">`
- **Disabled:** `disabled:bg-background disabled:text-muted/60 disabled:cursor-not-allowed`

### 6.3. Card bài viết (Post Card)
- Khung card: `rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4`
- Header tác giả: `AppImage` avatar tròn (`h-10 w-10 rounded-full`), tên tác giả (`text-sm font-semibold text-foreground`), timestamp (`text-xs text-muted`).
- Nội dung bài viết: `text-sm sm:text-base leading-relaxed text-foreground`.
- Thanh tương tác (Like / Bình luận / Chia sẻ):
  - Mặc định (chưa thích): `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors`
  - Trạng thái **Đã thích (Liked)**: `inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent transition-transform active:scale-95` (icon tim tô `fill-accent text-accent` kèm hiệu ứng nảy nhẹ).

### 6.4. Ô đăng bài ("Bạn đang nghĩ gì?")
- Khung: `rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm`
- Nút/input mở trình soạn: `w-full rounded-full border border-border bg-background px-4 py-2.5 text-left text-sm text-muted hover:bg-secondary/40 hover:text-foreground transition-colors`
- Nút gửi bài viết: 1 nút `primary` duy nhất ở góc phải dưới.

### 6.5. Giao diện Nhắn tin (Chat)
- **Tin nhắn của mình:** `ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-on-primary shadow-sm`
- **Tin nhắn của người khác:** `mr-auto max-w-[75%] rounded-2xl rounded-bl-sm bg-background px-4 py-2.5 text-sm text-foreground`
- **Chấm Online:** `h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card`
- **Chỉ báo "đang nhập...":** `text-xs italic text-muted` kèm 3 chấm nhấp nhô dùng `bg-muted`.

### 6.6. Badge thông báo (Notification Badge)
- Đặt góc trên bên phải icon chuông hoặc tin nhắn:
  `absolute -right-1 -top-1 min-w-4.5 h-4.5 rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-on-primary flex items-center justify-center ring-2 ring-card`

### 6.7. Thanh điều hướng (Navigation)
- **Sidebar trái (Desktop):** Nền `bg-card border-r border-border`; mục bình thường `text-muted hover:bg-background hover:text-foreground rounded-xl px-3 py-2.5`; mục đang active `bg-secondary text-primary font-semibold`.
- **Bottom Tab Bar (Mobile):** `fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden`; tab active dùng `text-primary bg-secondary/70 rounded-xl`.

### 6.8. Modal, Dropdown, Tooltip, Avatar & Skeleton
- **Modal:** Lớp phủ `bg-foreground/40 backdrop-blur-[1px]`; hộp thoại `rounded-2xl border border-border bg-card p-6 shadow-md`.
- **Dropdown / Popover:** `rounded-xl border border-border bg-card p-1.5 shadow-sm`.
- **Tooltip:** `rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium text-card shadow-sm`.
- **Avatar:** `rounded-full object-cover border border-border bg-secondary/40`.
- **Skeleton:** `animate-pulse rounded-lg bg-secondary/50` (hoặc `bg-border/70` cho khối trung tính).

---

## 7. Layout

Sử dụng breakpoint tiêu chuẩn của Tailwind (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`):

- **Desktop (Cổng mạng xã hội chính):** Bố cục 3 cột cân đối với `max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:gap-6`:
  1. Cột trái (`hidden lg:block`): Sidebar điều hướng chính (`bg-card`).
  2. Cột giữa (`mx-auto w-full max-w-2xl`): Bảng tin (Feed), ô đăng bài, chi tiết bài viết hoặc khung chat.
  3. Cột phải (`hidden xl:block`): Gợi ý kết nối, trạng thái cộng đồng (`bg-card`).
- **Mobile (`< 768px` / `< 1024px`):** Bố cục 1 cột toàn chiều rộng (`pb-20` chừa khoảng cho Bottom Tab Bar cố định ở đáy màn hình).
- **Auth (`Login`, `Register`, `ForgotPassword`):** Bố cục 2 cột trên `lg:` (panel giới thiệu dùng `bg-secondary` bên trái, form card `bg-card` bên phải); thu về 1 cột căn giữa trên mobile.
- **Admin Dashboard:** Header + thanh điều hướng quản trị nền `bg-card`, vùng nội dung nền `bg-background`.

---

## 8. Cấu hình Token trong Code

- **Phiên bản Tailwind:** Dự án sử dụng **Tailwind CSS v4** (`@tailwindcss/vite`). Không sử dụng `tailwind.config.js`.
- **Nguồn sự thật duy nhất:** Tệp [`lyora_web/src/index.css`](./lyora_web/src/index.css).
- **Cấu trúc cấu hình:**
  1. Khai báo CSS variables ở `:root` (`--pri`, `--onpri`, `--sec`, `--sec2`, `--bg`, `--card`, `--txt`, `--mut`, `--acc`, `--bd`, các biến dẫn xuất và semantic colors).
  2. Ánh xạ vào Tailwind v4 qua `@theme inline { ... }` để sinh ra các utility class ngữ nghĩa (`--color-primary: var(--pri)`, `--color-on-primary: var(--onpri)`, `--color-secondary: var(--sec)`, `--color-secondary-strong: var(--sec2)`, `--color-background: var(--bg)`, `--color-card: var(--card)`, `--color-foreground: var(--txt)`, `--color-muted: var(--mut)`, `--color-accent: var(--acc)`, `--color-border: var(--bd)`, `--font-sans: 'Be Vietnam Pro', system-ui, sans-serif`, v.v.).
  3. Đặt `--color-*: initial;` ở đầu `@theme` để vô hiệu hóa bảng màu mặc định của Tailwind (`blue-500`, `gray-600`, `slate-200`...), giúp trình biên dịch ngăn chặn việc dùng sai màu ngay từ lúc viết code (chỉ giữ lại `transparent`, `currentColor`, `inherit` hoạt động tự nhiên của CSS/Tailwind).
- **Cách thêm hoặc sửa token:**
  - Sửa giá trị HEX trong `:root` của `lyora_web/src/index.css` (và đồng bộ tại `DESIGN.md`).
  - Nếu thêm token mới, khai báo biến ở `:root` trước rồi ánh xạ `--color-<tên-ngữ-nghĩa>` trong `@theme inline` theo quy ước kebab-case viết thường.

---

## 9. Dark Mode

Theme **"Clean & Trustworthy"** hiện **CHỈ định nghĩa Light Mode**.
- Không triển khai nút chuyển Dark Mode và không viết utility class `dark:*` trong component.
- Vì toàn bộ màu trong `@theme inline` tham chiếu tới CSS variables ở `:root`, nếu tương lai dự án bổ sung Dark Mode thì chỉ cần khai báo lại bộ biến `--pri`, `--bg`, `--card`, `--txt`... trong một selector/media query riêng mà **không cần sửa component**. Không tự ý bịa bảng màu Dark Mode khi chưa có phê duyệt thiết kế.

---

## 10. Checklist cho Dev / Agent khi sửa UI

- [ ] Chỉ sử dụng các class token từ mục 2 (`bg-primary`, `text-on-primary`, `bg-secondary`, `bg-background`, `bg-card`, `text-foreground`, `text-muted`, `bg-accent`, `border-border`, `ring-primary/40`...).
- [ ] Không hard-code `#hex`, `rgb()`, `hsl()`, `bg-[#...]`, hay class màu mặc định (`bg-blue-*`, `text-gray-*`, `bg-white`, `text-black`...).
- [ ] Kiểm tra đủ 5 trạng thái tương tác của control: `default`, `hover`, `active`, `focus-visible` (`ring-2 ring-primary/40 ring-offset-2`), `disabled`, cộng `error` cho form input.
- [ ] Phân biệt rạch ròi `accent` (`#F43F5E` cho Like/thông báo chưa đọc) và `error` (`#DC2626` cho lỗi/xóa).
- [ ] Kiểm tra tương phản chữ `muted` trên nền `background`, đảm bảo không dùng cho chữ quá nhỏ hoặc thông tin trọng yếu.
- [ ] Kiểm tra hiển thị trên cả **Desktop** và **Mobile** (không tràn ngang, khoảng cách chừa cho bottom bar nếu có).
- [ ] Toàn bộ văn bản hiển thị người dùng viết trực tiếp bằng Tiếng Việt chuẩn mực, phi thương mại.

---

## Lịch sử thay đổi

- **2026-11-14:** Chuẩn hóa toàn bộ hệ thống thiết kế sang theme **Clean & Trustworthy** (`#2563EB` Primary, `#F3F4F6` Background, `#FFFFFF` Card, `#111827` Foreground, `#F43F5E` Accent, font `Be Vietnam Pro`).
