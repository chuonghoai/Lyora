---
name: Lyora Design System
description: Hệ thống thiết kế chuẩn mực cho hệ sinh thái Cyber Keys & Software của Lyora
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-shadow: "rgba(37, 99, 235, 0.3)"
  accent: "#aa3bff"
  accent-dark: "#c084fc"
  accent-bg: "rgba(170, 59, 255, 0.1)"
  accent-border: "rgba(170, 59, 255, 0.5)"
  background: "#ffffff"
  background-subtle: "#f8fafc"
  surface: "#ffffff"
  surface-gradient-from: "#f8fafc"
  surface-gradient-to: "#e2e8f0"
  glow-blue: "rgba(96, 165, 250, 0.2)"
  glow-indigo: "rgba(99, 102, 241, 0.15)"
  text-primary: "#0f172a"
  text-body: "#334155"
  text-body-alt: "#475569"
  text-muted: "#64748b"
  text-placeholder: "#94a3b8"
  text-dark-h: "#f3f4f6"
  text-dark-body: "#9ca3af"
  border: "#cbd5e1"
  border-checkbox: "#d1d5db"
  border-subtle: "#e5e4e7"
  border-subtle-dark: "#2e303a"
typography:
  display:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
  label:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px 32px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Lyora

## Overview

**Creative North Star: "Cyber Precision & Ambient Clarity"**

Hệ thống thiết kế Lyora kiến tạo một diện mạo công nghệ hiện đại, tinh gọn và chuẩn xác cho nền tảng thương mại điện tử giải pháp phần mềm và Cyber Keys. Lấy cảm hứng từ sự sắc sảo của các công cụ kỹ thuật số hàng đầu thế giới, giao diện tôn vinh tính minh bạch, tương phản cao, và khả năng điều hướng thông tin mượt mà.

Màu xanh **Primary Blue (`#2563eb`)** đóng vai trò ngọn hải đăng cho mọi tương tác chính, tương phản tự nhiên trên nền sáng tinh khiết (`#ffffff` và `#f8fafc`). Hiệu ứng bóng phát quang có màu sắc thương hiệu (`blue-500/30`) cùng các điểm nhấn tím công nghệ (`#aa3bff`) đem đến nét cá tính công nghệ mà vẫn duy trì sự nhã nhặn, sang trọng.

Dự án tuân thủ nghiêm ngặt nguyên tắc **Giao diện trực quan thống nhất (Unified Theme)** theo tiêu chuẩn Light mode chủ đạo; toàn bộ kiểu chữ và thành phần giao diện hướng đến sự nhanh nhạy, êm ái với trải nghiệm người dùng Việt Nam.

**Key Characteristics:**
- **Nhận diện sắc sảo:** Sắc xanh công nghệ `#2563eb` kết hợp ánh phát quang nhẹ nhàng (tinted glow) khẳng định uy tín và chuyên môn kỹ thuật.
- **Tối ưu hiệu năng bản địa (Zero-Cost System Fonts):** Tận dụng tối đa bộ font hệ điều hành (`system-ui`) giúp tải trang tức thời, sắc nét hoàn hảo trên mọi độ phân giải.
- **Phân tầng bo góc chặt chẽ:** 4px (phần tử vi mô), 8px (controls/buttons), 16px (thẻ chứa/containers).
- **Kỷ luật chống AI-Slop (Anti-Default Discipline):** Loại bỏ triệt để các dải gradient tím rập khuôn AI, bố cục 3 thẻ vô hồn và lạm dụng kính mờ (glassmorphism).

## Colors

Bảng màu mang phong cách hiện đại, thanh lịch với tông xanh Primary Blue chủ lực, kết hợp cùng các sắc độ trung tính chuẩn mực của dòng Slate và điểm xuyết sắc tím Accent độc đáo.

### Primary
- **Primary Blue** (`#2563eb` - `blue-600`): Màu thương hiệu chính, áp dụng cho nút bấm hành động chính (Primary Button), viền khi focus trường dữ liệu (`focus:border-[#2563eb]`), liên kết đang hoạt động và biểu tượng active.
- **Primary Hover** (`#1d4ed8` - `blue-700`): Trạng thái hover tương tác của nút bấm chính.
- **Primary Shadow** (`rgba(37, 99, 235, 0.3)` - `blue-500/30`): Bóng đổ phát quang nhẹ cho nút bấm chính, tạo chiều sâu thị giác.

### Secondary
- **Accent Purple** (`#aa3bff`): Màu điểm nhấn công nghệ, sử dụng cho huy hiệu (badge) công nghệ, nhãn nổi bật hoặc hiệu ứng phát sáng nhẹ.
- **Accent Background** (`rgba(170, 59, 255, 0.1)`): Nền mờ cho các badge trạng thái đặc thù hoặc vùng đánh dấu phụ.
- **Accent Border** (`rgba(170, 59, 255, 0.5)`): Viền nhấn mạnh của thành phần công nghệ nổi bật.

### Neutral
- **App Background** (`#ffffff` / `#f8fafc`): Nền tổng thể của toàn bộ ứng dụng, tạo cảm giác thoáng đãng và sạch sẽ.
- **Card Surface** (`#ffffff`): Nền trắng tinh khiết của các khối thẻ (Card), ô đăng nhập (Form container), bảng điều khiển và hộp thoại (Modal).
- **Visual Gradient** (`from-[#f8fafc] to-[#e2e8f0]`): Dải chuyển màu tinh tế dùng làm nền phân tách phân đoạn hoặc khối trang trí.
- **Decorative Glowing** (`rgba(96, 165, 250, 0.2)` / `rgba(99, 102, 241, 0.15)`): Các quầng sáng mờ ảo kết hợp với `blur` lớn để tăng chiều sâu công nghệ cho trang.
- **Text Headings** (`#0f172a`): Màu văn bản tiêu đề chính, đảm bảo độ tương phản vượt trội (Contrast ratio > 10:1).
- **Text Body** (`#334155` / `#475569`): Màu văn bản nội dung thông thường, rõ nét và êm dịu cho mắt khi đọc lâu.
- **Text Muted** (`#64748b` - `text-slate-500`): Màu của timestamp, văn bản phụ trợ, nhãn hướng dẫn phụ.
- **Text Placeholder** (`#94a3b8` - `text-slate-400`): Văn bản gợi ý mờ trong các ô nhập liệu.
- **Border Input** (`#cbd5e1` - `border-slate-300`): Đường viền tiêu chuẩn của trường nhập liệu và khung chọn.
- **Border Checkbox** (`#d1d5db` - `border-gray-300`): Đường viền cho ô đánh dấu kiểm (checkbox).
- **Border Subtle** (`#e5e4e7`): Đường phân tách mỏng nhẹ giữa các danh mục hoặc đường biên ngoài trang web.

### Named Rules
**The Blue Dominance Rule.** Màu Primary Blue `#2563eb` là điểm nhấn hành động chính duy nhất; không sử dụng màu sắc rực rỡ khác để cạnh tranh với các nút kêu gọi hành động (CTA).
**The Glow Restraint Rule.** Hiệu ứng phát quang (`bg-blue-400/20`, `blue-500/30`) chỉ đóng vai trò điểm xuyết chiều sâu vi mô, tuyệt đối không lạm dụng phủ bóng màu trên diện rộng gây rối mắt.
**The Unified Theme Authority Rule.** Dự án áp dụng duy nhất một chuẩn hiển thị thống nhất (Light Mode), không chuyển đổi Dark Mode hay dùng mã màu nằm ngoài hệ thống token đã định nghĩa.

## Typography

**Display Font:** `system-ui, 'Segoe UI', Roboto, sans-serif` (biến `--sans` và `--heading`)  
**Body Font:** `system-ui, 'Segoe UI', Roboto, sans-serif` (biến `--sans`)  
**Label/Mono Font:** `ui-monospace, Consolas, monospace` (biến `--mono`)

**Character:** Hệ thống kiểu chữ tối ưu hóa font gốc hệ thống (Native System Fonts) để loại bỏ độ trễ tải mạng, đem lại độ nét tối đa trên mọi loại màn hình. Phông chữ Monospace được cách ly chặt chẽ cho mã bản quyền, key kích hoạt và code block.

### Hierarchy
- **Display** (Extra-bold 800, `48px` - `56px`, line-height 1.1, letter-spacing `-1.68px`): Sử dụng cho Hero Headings lớn trên landing page (co về `36px` trên màn hình tablet/mobile ≤1024px).
- **Headline** (Bold 700, `36px`, line-height 1.2, letter-spacing `-0.8px`): Tiêu đề trang chính (Page titles).
- **Sub-headline / Title** (Semi-bold 600, `24px` - `28px`, line-height 1.25, letter-spacing `-0.24px`): Tiêu đề phần mục, tiêu đề thẻ Card lớn (`h2`).
- **Body** (Regular 400 đến Medium 500, `15px` - `18px`, line-height 1.45 - 1.5, letter-spacing `0.18px`): Nội dung bài viết, mô tả sản phẩm, văn bản đoạn văn.
- **Label / Small text** (Medium 500, `13px` - `14px`, line-height 1.4): Nhãn ô nhập liệu, thẻ tag, thông tin metadata phụ trợ.
- **Code / Monospace** (Regular 400, `13px` - `15px`, line-height 1.5): Mã khóa bản quyền (License Key), chuỗi mã hóa, thông số kỹ thuật.

### Named Rules
**The System Native First Rule.** Mọi văn bản giao diện bắt buộc dùng sans-serif hệ thống gốc để bảo toàn tốc độ hiển thị và trải nghiệm mượt mà tự nhiên của hệ điều hành.
**The Monospace Purpose Rule.** Font Monospace chỉ được sử dụng cho dữ liệu kỹ thuật (License key, token, code block), tuyệt đối không dùng cho tiêu đề hay nội dung giao tiếp thông thường.

## Layout

Hệ thống bố cục được xây dựng dựa trên lưới nhịp điệu 4px/8px chuẩn mực, bảo đảm tính linh hoạt và khả năng hiển thị responsive hoàn hảo trên mọi kích thước màn hình.

- **Khung chứa chính (Root Container):** Bề rộng tối đa `1126px` căn giữa (`max-w-[1126px] mx-auto`), có đường viền phân tách mờ hai bên (`border-inline: 1px solid var(--border)`).
- **Form Card / Login Container:** Giới hạn chiều rộng tối ưu `max-w-[400px]` đi kèm `w-full` để luôn vừa vặn trên các màn hình di động nhỏ mà vẫn giữ sự cân đối trên desktop.
- **Độ giãn cách phần tử (Spacing Scale):**
  - `space-y-2` và `gap-2` (8px): Khoảng cách giữa các phần tử cùng nhóm (input với nhãn, icon với text).
  - `mb-3` (12px): Khoảng cách giữa các khối trường thông tin.
  - `mt-6` (24px): Khoảng cách trên đầu nút bấm hoặc phân đoạn lớn trong form.
- **Vùng đệm nội dung (Padding):**
  - Card & Container: `p-6 sm:p-7` hoặc `p-6 sm:p-8` (24px đến 32px) tạo cảm giác thoáng đãng, sang trọng.
  - Controls (Input, Button): `px-3 py-2` (12px dọc, 8px ngang) hoặc `px-3.5 py-2.5` (14px dọc, 10px ngang).

## Elevation & Depth

Giao diện áp dụng triết lý phân tầng phẳng tinh gọn (tonal layering) kết hợp với các hiệu ứng đổ bóng mềm (soft ambient shadow) và bóng màu thương hiệu (tinted glow) để tạo chiều sâu tự nhiên mà không gây nặng nề.

### Shadow Vocabulary
- **Card Deep Ambient** (`box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08)`): Đổ bóng mềm lan tỏa rộng dưới nền form container và modal, tạo cảm giác bề mặt lơ lửng trên nền sáng.
- **Button Primary Glow** (`box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -2px rgba(37, 99, 235, 0.3)`): Bóng đổ màu xanh công nghệ dưới nút Primary, tăng độ nổi bật và phản hồi trực quan.
- **System Layer Subtle** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`): Bóng đổ phân tầng mỏng cho menu thả xuống (dropdown) và tooltip.

### Named Rules
**The Soft Lift Rule.** Các bề mặt ở trạng thái nghỉ giữ độ phẳng tinh tế; chỉ nâng cao độ sâu (lift) với bóng đổ mềm khi là khối tương tác trọng tâm (Form Card) hoặc khi người dùng hover/focus.

## Shapes

Ngôn ngữ hình học thể hiện sự chuẩn xác kỹ thuật với các góc bo mềm mại nhưng có kỷ luật rõ ràng theo phân cấp kích thước:

- **Khối điều khiển vi mô (Checkbox, Radio):** Bo góc `4px` (`rounded`), tạo sự dứt khoát, chuẩn mực.
- **Khối nhập liệu & Nút bấm (Input, Button):** Bo góc `8px` (`rounded-lg`), cân bằng hoàn hảo giữa tính hiện đại và dễ bấm.
- **Khối thẻ & Hộp thoại (Card, Modal, Container):** Bo góc lớn `16px` (`rounded-2xl`), tạo sự êm dịu, bao bọc và tập trung chú ý.
- **Khối huy hiệu & Quầng trang trí (Badge, Glowing Orb):** Bo tròn hoàn toàn `9999px` (`rounded-full`).

Đường viền (Borders) luôn duy trì độ mảnh 1px (`border`), sử dụng màu trung tính mờ (`#cbd5e1` hoặc `#e5e4e7`) ở trạng thái tĩnh và chuyển sáng rực sang Primary Blue (`#2563eb`) kèm viền phát quang khi được kích hoạt focus.

## Components

Hệ thống thành phần được thiết kế để tái sử dụng cao, tối ưu khả năng tương tác và bảo toàn tính nhất quán trong toàn bộ hệ sinh thái.

### Buttons
- **Hình dáng:** Bo góc 8px (`rounded-lg`), chiều rộng mở rộng toàn phần `w-full` trong khối form hoặc vừa vặn nội dung (`inline-flex`).
- **Primary Button:** Nền xanh `#2563eb`, chữ trắng tinh khiết `#ffffff`, độ đậm semi-bold (600), đệm `px-4 py-2` hoặc `px-3.5 py-2.5`, bóng phát quang `shadow-md shadow-blue-500/30`.
- **Hover & Focus:** Chuyển đổi mượt mà với `transition-colors duration-150`, nền đổi sang `#1d4ed8`.
- **Trạng thái Disabled:** Độ mờ `opacity-50`, con trỏ `cursor-not-allowed`.

### Inputs / Fields
- **Kiểu dáng:** Bo góc 8px (`rounded-lg`), đường viền 1px mỏng màu `#cbd5e1`, nền trắng `#ffffff`, chữ `#0f172a`.
- **Nhãn trường (Label):** Chữ cỡ `14px` (`text-sm`), độ đậm medium (500), màu `#334155`, căn khoảng cách `gap-1.5` phía trên ô nhập.
- **Trạng thái Focus:** Viền chuyển màu sang Primary Blue (`focus:border-[#2563eb]`) kết hợp vòng viền sáng nhẹ (`focus:ring-1 focus:ring-[#2563eb]`).
- **Trạng thái Lỗi:** Viền chuyển sang đỏ (`border-red-500`), văn bản thông báo lỗi `text-xs text-red-600`.

### Cards / Containers
- **Hình dáng & Kích thước:** Bo góc 16px (`rounded-2xl`), chiều rộng tối đa `max-w-[400px]` (cho form đăng nhập/giao dịch) với `w-full`.
- **Nền & Chiều sâu:** Nền trắng tinh khôi `#ffffff` kết hợp bóng đổ lan tỏa `shadow-[0_8px_30px_rgb(0,0,0,0.08)]`.
- **Khoảng đệm nội bộ:** `p-6 sm:p-7` hoặc `p-6 sm:p-8`.

### Checkboxes
- **Kiểu dáng:** Bo góc 4px (`rounded`), viền xám `#d1d5db` (`border-gray-300`), màu kích hoạt đồng bộ Primary Blue.

### Visual & Decorative Elements
- **Khối chuyển màu (Gradient):** `bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]`.
- **Quầng sáng phát quang:** Các khối tròn `bg-blue-400/20` và `bg-indigo-500/15` đi kèm `blur-3xl` tạo không gian công nghệ mờ ảo phía sau giao diện.
- **Hoạt ảnh chuyển động (Animations):** `animate-spin` cho vòng xoay tải dữ liệu (loading spinner); các chuyển động trang trí công nghệ nhẹ nhàng (`animate-line`, `animate-triangle`, `animate-keyboard`).
- **Hòa trộn hình ảnh (Blend Mode):** `mix-blend-multiply` để hòa trộn các ảnh minh họa kỹ thuật số với nền trang trí.

## Do's and Don'ts

### Do:
- **Do** tuân thủ tuyệt đối các mã màu chính thức: Primary `#2563eb`, Primary Hover `#1d4ed8`, Accent `#aa3bff`, Headings `#0f172a`, Body `#334155`.
- **Do** sử dụng đúng quy chuẩn bo góc: `rounded-lg` (8px) cho Input/Button và `rounded-2xl` (16px) cho Form Card.
- **Do** áp dụng bóng đổ có màu `shadow-md shadow-blue-500/30` cho nút bấm Primary để đồng bộ nhận diện thương hiệu.
- **Do** thiết lập `focus:border-[#2563eb]` và `focus:ring-1 focus:ring-[#2563eb]` trên mọi trường input tương tác.
- **Do** viết toàn bộ văn bản giao diện (Button, Label, Title, Modal, Thông báo) trực tiếp bằng tiếng Việt chuẩn mực, rõ ràng, gãy gọn.
- **Do** tái sử dụng tối đa các thành phần UI chung từ `@lyora/web-shared` (`Button`, `Input`, `LoadingSpinner`, `AppImage`).

### Don't:
- **Don't** tự ý thêm bộ chuyển đổi Light/Dark mode hoặc viết các class `dark:` gây phân mảnh trải nghiệm giao diện thống nhất.
- **Don't** sử dụng font Monospace cho văn bản thông thường (chỉ dùng duy nhất cho code, token, license key).
- **Don't** áp dụng gradient tím-hồng rập khuôn AI (AI-slop) khắp màn hình.
- **Don't** sử dụng bo góc tùy tiện ngoài hệ thống chuẩn (`4px`, `8px`, `16px`, `9999px`).
- **Don't** dùng các đường kẻ hairline divider xám ngang dọc dày đặc; hãy ưu tiên dùng khoảng trắng (`gap`, `space-y`) và phân tách nền.
- **Don't** sử dụng các mã màu cố định ngoài hệ thống token đã được quy định trong tài liệu này.
