---
name: Lyora Design System
description: Hệ thống thiết kế chuẩn mực cho nền tảng Cộng Đồng Số — Tương tác bài viết, Nhắn tin & Chia sẻ Lyora (Coral & Warm Neutral, Violet & Lavender cho AI)
colors:
  color-primary: "#E96862"
  color-primary-hover: "#D95652"
  color-primary-active: "#C94845"
  color-secondary: "#FF9B85"
  color-accent: "#FFC2AD"
  color-accent-soft: "#FFF0E9"
  color-background: "#FAF8F7"
  color-surface: "#FFFFFF"
  color-surface-secondary: "#FFF5F1"
  color-surface-tertiary: "#F3EFED"
  color-surface-hover: "#F8EFEC"
  color-text-primary: "#292321"
  color-text-secondary: "#766B67"
  color-text-tertiary: "#A49A95"
  color-text-disabled: "#C7BFBB"
  color-text-inverse: "#FFFFFF"
  color-border: "#EEE5E1"
  color-border-strong: "#DED2CC"
  color-border-focus: "#E96862"
  color-success: "#16834A"
  color-warning: "#B7791F"
  color-error: "#D14343"
  color-info: "#3478D4"
  color-ai-primary: "#7656D6"
  color-ai-secondary: "#9A7AE8"
  color-ai-accent: "#C5B3FA"
  color-ai-background: "#F2EDFF"
  color-ai-text: "#5538A6"
  color-ai-border: "#DED3FA"
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
    backgroundColor: "{colors.color-primary}"
    textColor: "{colors.color-text-inverse}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.color-primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.color-primary-active}"
  card-container:
    backgroundColor: "{colors.color-surface}"
    borderColor: "{colors.color-border}"
    rounded: "{rounded.lg}"
    padding: "24px 32px"
  input-field:
    backgroundColor: "{colors.color-surface}"
    textColor: "{colors.color-text-primary}"
    borderColor: "{colors.color-border-strong}"
    focusBorderColor: "{colors.color-border-focus}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Lyora

## 1. Overview

**Định hướng nhận diện:** *Coral & Warm Neutral — Balanced, Modern, Friendly*

Hệ thống thiết kế Lyora định hình diện mạo ấm áp, hiện đại, thân thiện và cân bằng cho nền tảng **Cộng đồng số — Tương tác bài viết, Nhắn tin & Chia sẻ thời gian thực** (hoàn toàn phi thương mại). Toàn bộ nguồn chân lý về bảng màu và Design Tokens được đồng bộ trực tiếp từ [`design_new.css`](./design_new.css).

- **Brand Style:** **Coral & Warm Neutral** — sắc san hô ấm (`#E96862`) đóng vai trò điểm nhấn thương hiệu trên nền trung tính ấm dịu mắt (`#FAF8F7`, `#FFFFFF`), mang lại cảm giác gần gũi cho tương tác xã hội dài lâu.
- **UI Mode:** **Light Mode** thống nhất (Unified Theme) trên toàn bộ nền tảng; không triển khai chuyển đổi Dark Mode.
- **Design Personality:** **Balanced, Modern, Friendly** — phân cấp rõ ràng, khoảng thở hợp lý, dễ đọc và không phô trương.
- **AI Identity:** **Violet & Lavender** — dải màu tím (`#7656D6`, `#F2EDFF`) được tách biệt hoàn toàn để nhận diện các tính năng AI Assistant và nội dung do AI hỗ trợ.

---

## 2. Design Principles

1. **Consistency (Tính nhất quán):** Đồng nhất giao diện, tokens và hành vi thành phần trên toàn bộ nền tảng Lyora (Cổng Người Dùng, Trung Tâm Quản Trị và Phân Hệ Xác Thực).
2. **Visual Hierarchy (Phân cấp thị giác):** Tạo tầng bậc rõ ràng giữa nền ứng dụng (`--color-background`), bề mặt thẻ (`--color-surface`), văn bản chính/phụ và nút hành động trọng tâm.
3. **Readability (Khả năng đọc):** Ưu tiên độ rõ nét và sự thoải mái khi đọc bài viết, bình luận và hội thoại dài trên nền trung tính ấm với chữ chính tương phản cao (`--color-text-primary`).
4. **Color Restraint (Tiết chế màu sắc):** Sử dụng màu sắc có kiểm soát; không lạm dụng màu Primary (`--color-primary`) cho các icon, viền hay thành phần phụ trợ không cần nhấn mạnh.
5. **Brand Recognition (Nhận diện thương hiệu):** Giữ sắc Coral (`--color-primary`) làm dấu ấn nhận diện thương hiệu xuyên suốt cho các điểm chạm chính.
6. **Functional Distinction (Phân biệt chức năng):** Tách biệt rạch ròi giữa hệ màu **AI** (Violet & Lavender), hệ màu **tương tác xã hội & thương hiệu** (Coral & Warm Neutral) và **trạng thái hệ thống** (Semantic Colors).

---

## 3. Design Tokens (`design_new.css`)

Toàn bộ 29 CSS Variables trong `:root` của `design_new.css` là nguồn chân lý duy nhất cho hệ thống màu sắc của Lyora.

### 3.1. Brand Colors

| CSS Variable | HEX | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-primary` | `#E96862` | Màu nhận diện thương hiệu chính (Coral); dùng cho CTA chính, active indicator và điểm nhấn tương tác quan trọng |
| `--color-primary-hover` | `#D95652` | Trạng thái di chuột (hover) của nút bấm và liên kết dùng `--color-primary` |
| `--color-primary-active` | `#C94845` | Trạng thái nhấn giữ (active/pressed) của nút bấm chính và điểm nhấn đậm hơn |
| `--color-secondary` | `#FF9B85` | Màu thương hiệu phụ trợ (Warm Coral); dùng cho nhấn phụ, minh họa hoặc chỉ báo phụ |
| `--color-accent` | `#FFC2AD` | Màu nhấn nhẹ (Soft Peach); dùng cho viền nhấn nhẹ, điểm nhấn nền hoặc badge phụ trợ |
| `--color-accent-soft` | `#FFF0E9` | Nền nhấn dịu nhẹ của thương hiệu; dùng cho pill active, tag nổi bật nhẹ hoặc nền nút tonal |

### 3.2. Background & Surface Colors

| CSS Variable | HEX | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-background` | `#FAF8F7` | Màu nền tổng thể (Warm Neutral Canvas) của ứng dụng và vùng chứa bảng tin |
| `--color-surface` | `#FFFFFF` | Màu bề mặt chính của Card, bài viết, ô nhập liệu, thanh điều hướng và hộp thoại |
| `--color-surface-secondary` | `#FFF5F1` | Bề mặt phụ ấm nhẹ; dùng cho mục thông báo chưa đọc, vùng nổi bật nhẹ hoặc card phụ |
| `--color-surface-tertiary` | `#F3EFED` | Bề mặt trung tính cấp ba; dùng cho bong bóng tin nhắn đến, trích dẫn bài viết, khối code/well và nền disabled |
| `--color-surface-hover` | `#F8EFEC` | Màu nền phản hồi khi người dùng di chuột (hover) lên hàng bảng, mục menu hoặc nút phụ |

### 3.3. Text Colors

| CSS Variable | HEX | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-text-primary` | `#292321` | Màu chữ chính cho tiêu đề, tên tác giả, nội dung bài viết và tin nhắn |
| `--color-text-secondary` | `#766B67` | Màu chữ phụ cho mô tả, nhãn điều hướng mặc định và nội dung bổ trợ |
| `--color-text-tertiary` | `#A49A95` | Màu chữ cấp ba cho timestamp, metadata phụ, số đếm phụ và placeholder input |
| `--color-text-disabled` | `#C7BFBB` | Màu chữ và biểu tượng ở trạng thái vô hiệu hóa (disabled) |
| `--color-text-inverse` | `#FFFFFF` | Màu chữ tương phản trên nền tối/đậm như nút `--color-primary`, `--color-ai-primary` hoặc badge semantic đậm |

### 3.4. Border Colors

| CSS Variable | HEX | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-border` | `#EEE5E1` | Viền mảnh mặc định phân tách Card, thanh điều hướng, bảng dữ liệu và khung hội thoại |
| `--color-border-strong` | `#DED2CC` | Viền đậm hơn cho các control tương tác (input mặc định, outline button, checkbox) |
| `--color-border-focus` | `#E96862` | Màu viền khi trường nhập liệu hoặc thành phần tương tác nhận trạng thái focus |

### 3.5. Interactive States

Bảng tổng hợp quy chuẩn các trạng thái tương tác sử dụng trực tiếp các tokens từ `design_new.css`:

| Trạng thái | Thành phần Primary | Thành phần Surface / Navigation | Thành phần Input / Control |
| :--- | :--- | :--- | :--- |
| **Default** | Nền `--color-primary` (`#E96862`), chữ `--color-text-inverse` (`#FFFFFF`) | Nền `--color-surface` (`#FFFFFF`), chữ `--color-text-secondary` (`#766B67`) | Nền `--color-surface` (`#FFFFFF`), viền `--color-border-strong` (`#DED2CC`) |
| **Hover** | Nền `--color-primary-hover` (`#D95652`) | Nền `--color-surface-hover` (`#F8EFEC`), chữ `--color-text-primary` (`#292321`) | Viền `--color-border-strong` (`#DED2CC`), nền `--color-surface` (`#FFFFFF`) |
| **Active** | Nền `--color-primary-active` (`#C94845`) | Nền `--color-accent-soft` (`#FFF0E9`), chữ/icon `--color-primary` (`#E96862`) | Viền `--color-border-focus` (`#E96862`) |
| **Focus** | Viền focus `--color-border-focus` (`#E96862`) | Viền focus `--color-border-focus` (`#E96862`) | Viền `--color-border-focus` (`#E96862`) |
| **Disabled** | Nền `--color-surface-tertiary` (`#F3EFED`), chữ `--color-text-disabled` (`#C7BFBB`) | Nền `--color-surface-tertiary` (`#F3EFED`), chữ `--color-text-disabled` (`#C7BFBB`) | Nền `--color-surface-tertiary` (`#F3EFED`), chữ `--color-text-disabled` (`#C7BFBB`) |

### 3.6. Semantic Colors

| CSS Variable | HEX | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-success` | `#16834A` | Trạng thái thành công, xác nhận hoàn tất, chỉ báo trực tuyến (online) hoặc tài khoản kích hoạt |
| `--color-warning` | `#B7791F` | Cảnh báo cần chú ý, trạng thái chờ kiểm duyệt hoặc giới hạn thao tác |
| `--color-error` | `#D14343` | Thông báo lỗi hệ thống, lỗi validation input, thao tác xóa/khóa hoặc báo cáo vi phạm nghiêm trọng |
| `--color-info` | `#3478D4` | Thông tin hướng dẫn hệ thống, thông báo trung tính hoặc trạng thái đang đồng bộ |

### 3.7. AI Color System

| CSS Variable | HEX | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-ai-primary` | `#7656D6` | Màu chủ đạo cho nút kích hoạt AI, icon AI và các hành động tạo/tóm tắt nội dung bằng AI |
| `--color-ai-secondary` | `#9A7AE8` | Màu phụ trợ cho trạng thái hover hoặc điểm nhấn thứ cấp trong giao diện AI |
| `--color-ai-accent` | `#C5B3FA` | Màu nhấn nhẹ cho huy hiệu (badge), tag hoặc thanh trang trí nhỏ thuộc thành phần AI |
| `--color-ai-background` | `#F2EDFF` | Màu nền phân biệt cho khung trợ lý AI, hộp thoại gợi ý và khối nội dung do AI tạo |
| `--color-ai-text` | `#5538A6` | Màu chữ chính trên nền `--color-ai-background` đảm bảo độ tương phản và nhận diện AI |
| `--color-ai-border` | `#DED3FA` | Đường viền bao quanh thẻ AI, khung gợi ý và chip tính năng AI |

### 3.8. Reference CSS Root Tokens

```css
:root {
  /* Brand */
  --color-primary: #E96862;
  --color-primary-hover: #D95652;
  --color-primary-active: #C94845;
  --color-secondary: #FF9B85;
  --color-accent: #FFC2AD;
  --color-accent-soft: #FFF0E9;

  /* Background & Surface */
  --color-background: #FAF8F7;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #FFF5F1;
  --color-surface-tertiary: #F3EFED;
  --color-surface-hover: #F8EFEC;

  /* Text */
  --color-text-primary: #292321;
  --color-text-secondary: #766B67;
  --color-text-tertiary: #A49A95;
  --color-text-disabled: #C7BFBB;
  --color-text-inverse: #FFFFFF;

  /* Border */
  --color-border: #EEE5E1;
  --color-border-strong: #DED2CC;
  --color-border-focus: #E96862;

  /* Semantic */
  --color-success: #16834A;
  --color-warning: #B7791F;
  --color-error: #D14343;
  --color-info: #3478D4;

  /* AI */
  --color-ai-primary: #7656D6;
  --color-ai-secondary: #9A7AE8;
  --color-ai-accent: #C5B3FA;
  --color-ai-background: #F2EDFF;
  --color-ai-text: #5538A6;
  --color-ai-border: #DED3FA;
}
```

---

## 4. Color Usage Guidelines

### 4.1. Nguyên Tắc Phân Bổ Màu Chung
- **Coral (`--color-primary` `#E96862`)** là màu nhận diện thương hiệu chính: chỉ đặt tại nút kêu gọi hành động (CTA) trọng tâm, mục đang kích hoạt và tín hiệu tương tác tích cực cần chú ý.
- **Warm Neutral (`--color-background` `#FAF8F7`, `--color-surface` `#FFFFFF`, `--color-surface-tertiary` `#F3EFED`)** là nền tảng chiếm phần lớn diện tích màn hình để nội dung người dùng tạo nổi bật tự nhiên.
- **Violet & Lavender (`--color-ai-*`)** chỉ dành riêng cho tính năng AI; tuyệt đối không dùng cho nút xã hội thông thường hay trạng thái hệ thống.
- **Semantic Colors (`--color-success`, `--color-warning`, `--color-error`, `--color-info`)** chỉ dùng cho trạng thái hệ thống, validation và kiểm duyệt.
- **Không lạm dụng màu Primary** cho hàng loạt icon điều hướng thụ động, icon trang trí hoặc đường viền thẻ thông thường.

### 4.2. Áp Dụng Màu Theo Khu Vực Giao Diện

1. **Navigation và Sidebar**
   - Nền thanh điều hướng và sidebar dùng `--color-surface` (`#FFFFFF`), phân tách với nền chính bằng đường viền `--color-border` (`#EEE5E1`).
   - Mục menu ở trạng thái mặc định dùng chữ và icon `--color-text-secondary` (`#766B67`); khi hover chuyển nền `--color-surface-hover` (`#F8EFEC`) và chữ `--color-text-primary` (`#292321`).
   - Mục đang được chọn (Active route) dùng nền `--color-accent-soft` (`#FFF0E9`) kèm chữ/icon `--color-primary` (`#E96862`) hoặc `--color-primary-active` (`#C94845`).

2. **Buttons và Interactive Elements**
   - **Primary Button:** Nền `--color-primary` (`#E96862`), chữ `--color-text-inverse` (`#FFFFFF`); hover `--color-primary-hover` (`#D95652`); active `--color-primary-active` (`#C94845`).
   - **Secondary / Tonal Button:** Nền `--color-surface-secondary` (`#FFF5F1`) hoặc `--color-accent-soft` (`#FFF0E9`), chữ `--color-primary-active` (`#C94845`), hover `--color-surface-hover` (`#F8EFEC`).
   - **Outline / Neutral Button:** Nền `--color-surface` (`#FFFFFF`), viền `--color-border-strong` (`#DED2CC`), chữ `--color-text-primary` (`#292321`), hover `--color-surface-hover` (`#F8EFEC`).
   - **Disabled Button:** Nền `--color-surface-tertiary` (`#F3EFED`), chữ `--color-text-disabled` (`#C7BFBB`).

3. **Social Feed và Post Cards**
   - Vùng nền của bảng tin (Newsfeed) sử dụng `--color-background` (`#FAF8F7`).
   - Mỗi thẻ bài viết (Post Card) dùng nền `--color-surface` (`#FFFFFF`) với viền `--color-border` (`#EEE5E1`).
   - Khối bài viết chia sẻ lại (Repost/Quote) hoặc thẻ đính kèm liên kết bên trong bài viết dùng nền `--color-surface-tertiary` (`#F3EFED`) hoặc `--color-surface-secondary` (`#FFF5F1`).
   - Tên người đăng và nội dung văn bản bài viết dùng `--color-text-primary` (`#292321`); mô tả phụ dùng `--color-text-secondary` (`#766B67`); thời gian đăng và lượt đếm dùng `--color-text-tertiary` (`#A49A95`).

4. **Like, Comment, Share, Follow**
   - Ở trạng thái mặc định (chưa tương tác), cả 3 nút **Thích (Like)**, **Bình luận (Comment)** và **Chia sẻ (Share)** dùng icon và chữ `--color-text-secondary` (`#766B67`) để giữ bảng tin thanh thoát, không bị rối màu.
   - Khi hover vào các nút tương tác, sử dụng nền `--color-surface-hover` (`#F8EFEC`) và chữ `--color-text-primary` (`#292321`).
   - Khi người dùng đã bày tỏ cảm xúc (**Liked**): icon và số đếm chuyển sang `--color-primary` (`#E96862`), có thể kết hợp nền pill `--color-accent-soft` (`#FFF0E9`).
   - Nút **Theo dõi (Follow)**: trạng thái chưa theo dõi dùng nút chính `--color-primary` (`#E96862`) chữ `--color-text-inverse` (`#FFFFFF`) hoặc nút tonal `--color-accent-soft` (`#FFF0E9`) chữ `--color-primary-active` (`#C94845`); trạng thái **Đang theo dõi (Following)** chuyển về nút trung tính nền `--color-surface-tertiary` (`#F3EFED`) chữ `--color-text-secondary` (`#766B67`).

5. **Messaging và Chat Interface**
   - Cửa sổ danh sách hội thoại và khung trò chuyện dùng nền `--color-surface` (`#FFFFFF`), ngăn cách cột bằng `--color-border` (`#EEE5E1`).
   - Hội thoại đang chọn dùng nền `--color-surface-secondary` (`#FFF5F1`); hội thoại khi hover dùng `--color-surface-hover` (`#F8EFEC`).
   - Tin nhắn nhận (Incoming) dùng nền `--color-surface-tertiary` (`#F3EFED`) và chữ `--color-text-primary` (`#292321`).
   - Tin nhắn gửi đi (Outgoing) dùng nền `--color-primary` (`#E96862`) và chữ `--color-text-inverse` (`#FFFFFF`).
   - Trạng thái trực tuyến (Online) dùng chấm chỉ báo `--color-success` (`#16834A`); timestamp dùng `--color-text-tertiary` (`#A49A95`).

6. **Notification**
   - Mục thông báo chưa đọc dùng nền `--color-surface-secondary` (`#FFF5F1`) kèm chấm chỉ báo `--color-primary` (`#E96862`).
   - Mục thông báo đã đọc dùng nền `--color-surface` (`#FFFFFF`), hover dùng `--color-surface-hover` (`#F8EFEC`).
   - Thông báo trạng thái hệ thống (Toast, Banner, Alert) giữ nền `--color-surface` (`#FFFFFF`) kèm viền/icon theo đúng Semantic Color: `--color-success` (`#16834A`), `--color-warning` (`#B7791F`), `--color-error` (`#D14343`), `--color-info` (`#3478D4`).

7. **AI Assistant và AI-generated Content**
   - Khối hộp thoại trợ lý AI, tóm tắt bài viết bằng AI hoặc gợi ý trả lời tin nhắn bằng AI dùng nền `--color-ai-background` (`#F2EDFF`) và viền `--color-ai-border` (`#DED3FA`).
   - Văn bản tiêu đề/nhãn AI dùng `--color-ai-text` (`#5538A6`).
   - Nút kích hoạt AI và biểu tượng AI dùng `--color-ai-primary` (`#7656D6`) với chữ `--color-text-inverse` (`#FFFFFF`); trạng thái phụ dùng `--color-ai-secondary` (`#9A7AE8`) và `--color-ai-accent` (`#C5B3FA`).

8. **Forms, Inputs và Dialogs**
   - Trường nhập liệu (`Input`, `Textarea`, `Select`) dùng nền `--color-surface` (`#FFFFFF`), chữ `--color-text-primary` (`#292321`), placeholder `--color-text-tertiary` (`#A49A95`) và viền `--color-border-strong` (`#DED2CC`).
   - Khi focus, viền chuyển sang `--color-border-focus` (`#E96862`).
   - Khi có lỗi nhập liệu (Validation Error), viền và chữ báo lỗi dùng `--color-error` (`#D14343`).
   - Khi bị khóa (Disabled), nền chuyển sang `--color-surface-tertiary` (`#F3EFED`) và chữ dùng `--color-text-disabled` (`#C7BFBB`).
   - Dialog và Modal dùng nền `--color-surface` (`#FFFFFF`), viền `--color-border` (`#EEE5E1`), tiêu đề `--color-text-primary` (`#292321`), nội dung mô tả `--color-text-secondary` (`#766B67`).

---

## 5. Typography

**Display Font:** `system-ui, 'Segoe UI', Roboto, sans-serif` (biến `--sans` và `--heading`)  
**Body Font:** `system-ui, 'Segoe UI', Roboto, sans-serif` (biến `--sans`)  
**Label/Mono Font:** `ui-monospace, Consolas, monospace` (biến `--mono`)

**Character:** Hệ thống kiểu chữ tối ưu hóa font gốc hệ thống (Native System Fonts) để loại bỏ độ trễ tải mạng, đem lại độ nét tối đa trên mọi loại màn hình. Phông chữ Monospace được cách ly chặt chẽ cho dữ liệu kỹ thuật, mã định danh phiên, token và code block.

### Hierarchy
- **Display** (Extra-bold 800, `48px` - `56px`, line-height 1.1, letter-spacing `-1.68px`): Sử dụng cho Hero Headings lớn trên trang chính (co về `36px` trên màn hình tablet/mobile ≤1024px).
- **Headline** (Bold 700, `36px`, line-height 1.2, letter-spacing `-0.8px`): Tiêu đề trang chính (Page titles).
- **Sub-headline / Title** (Semi-bold 600, `24px` - `28px`, line-height 1.25, letter-spacing `-0.24px`): Tiêu đề phần mục, tiêu đề thẻ Card lớn (`h2`).
- **Body** (Regular 400 đến Medium 500, `15px` - `18px`, line-height 1.45 - 1.5, letter-spacing `0.18px`): Nội dung bài viết cộng đồng, bình luận, tin nhắn, văn bản đoạn văn.
- **Label / Small text** (Medium 500, `13px` - `14px`, line-height 1.4): Nhãn ô nhập liệu, thẻ tag, thông tin metadata phụ trợ.
- **Code / Monospace** (Regular 400, `13px` - `15px`, line-height 1.5): Mã định danh hệ thống (ID), token kết nối, chuỗi mã hóa, thông số kỹ thuật.

### Named Rules
- **The System Native First Rule:** Mọi văn bản giao diện bắt buộc dùng sans-serif hệ thống gốc để bảo toàn tốc độ hiển thị và trải nghiệm mượt mà tự nhiên của hệ điều hành.
- **The Monospace Purpose Rule:** Font Monospace chỉ được sử dụng cho dữ liệu kỹ thuật (ID, token, code block), tuyệt đối không dùng cho tiêu đề hay nội dung giao tiếp thông thường.

---

## 6. Layout & Spacing

Hệ thống bố cục được xây dựng dựa trên lưới nhịp điệu 4px/8px chuẩn mực, bảo đảm tính linh hoạt và khả năng hiển thị responsive hoàn hảo trên mọi kích thước màn hình.

- **Khung chứa chính (Root Container):** Bề rộng tối đa `1126px` căn giữa (`max-w-[1126px] mx-auto`), có đường viền phân tách hai bên bằng `--color-border` (`#EEE5E1`).
- **Form Card / Login Container:** Giới hạn chiều rộng tối ưu `max-w-[400px]` đi kèm `w-full` để luôn vừa vặn trên các màn hình di động nhỏ mà vẫn giữ sự cân đối trên desktop.
- **Độ giãn cách phần tử (Spacing Scale):**
  - `xs` (`4px`): Khoảng cách vi mô giữa icon và nhãn nhỏ.
  - `sm` (`8px` - `space-y-2`, `gap-2`): Khoảng cách giữa các phần tử cùng nhóm (input với nhãn, icon với text).
  - `md` (`12px` - `mb-3`, `gap-3`): Khoảng cách giữa các khối trường thông tin.
  - `lg` (`16px` - `gap-4`): Khoảng cách giữa các card liền kề trên bảng tin.
  - `xl` (`24px` - `mt-6`): Khoảng cách trên đầu nút bấm hoặc phân đoạn lớn trong form.
  - `2xl` (`32px`): Vùng đệm lớn cho container hoặc phân tách khối lớn.
- **Vùng đệm nội dung (Padding):**
  - Card & Container: `24px` đến `32px` (`p-6 sm:p-7` hoặc `p-6 sm:p-8`).
  - Controls (Input, Button): `8px 12px` đến `10px 16px` (`px-3 py-2` hoặc `px-3.5 py-2.5`).

---

## 7. Shapes & Elevation

### Shapes (Border Radius)
Ngôn ngữ hình học thân thiện, hiện đại với phân cấp kích thước rõ ràng:
- **Khối điều khiển vi mô (Checkbox, Radio):** Bo góc `4px` (`rounded`).
- **Khối nhập liệu & Nút bấm (Input, Button):** Bo góc `8px` (`rounded-lg`).
- **Khối thẻ & Hộp thoại (Card, Modal, Container):** Bo góc lớn `16px` (`rounded-2xl`).
- **Khối huy hiệu & Avatar (Badge, Pill, Avatar):** Bo tròn hoàn toàn `9999px` (`rounded-full`).

Đường viền luôn duy trì độ mảnh `1px`, sử dụng `--color-border` (`#EEE5E1`) hoặc `--color-border-strong` (`#DED2CC`) ở trạng thái tĩnh và chuyển sang `--color-border-focus` (`#E96862`) khi được kích hoạt focus.

### Elevation & Depth
Giao diện áp dụng triết lý phân tầng ấm áp (tonal layering) giữa nền `--color-background` (`#FAF8F7`), thẻ `--color-surface` (`#FFFFFF`) và bề mặt thứ cấp `--color-surface-tertiary` (`#F3EFED`), kết hợp bóng đổ trung tính nhẹ nhàng:
- **Card Deep Ambient** (`box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08)`): Dùng cho Form Card trọng tâm hoặc Modal nổi trên nền sáng.
- **System Layer Subtle** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)`): Dùng cho menu thả xuống (dropdown), popover và tooltip.
- **The Soft Lift Rule:** Các bề mặt ở trạng thái nghỉ giữ độ phẳng tinh tế với viền `1px` `--color-border` (`#EEE5E1`); chỉ nâng độ sâu bằng bóng đổ mềm khi là hộp thoại, dropdown hoặc form nổi.

---

## 8. Core Components (`@core`)

Mọi màn hình trong `lyora_web` ưu tiên tái sử dụng các thành phần nền tảng từ `@core` (`Button`, `Input`, `LoadingSpinner`, `AppImage`) kết hợp đúng Design Tokens của hệ thống:

- **Buttons:** Bo góc `8px` (`rounded-lg`), sử dụng `--color-primary` (`#E96862`) cho nút chính, `--color-primary-hover` (`#D95652`) khi hover, `--color-primary-active` (`#C94845`) khi nhấn, `--color-text-inverse` (`#FFFFFF`) cho chữ.
- **Inputs / Fields:** Bo góc `8px` (`rounded-lg`), nền `--color-surface` (`#FFFFFF`), viền `--color-border-strong` (`#DED2CC`), chữ `--color-text-primary` (`#292321`), placeholder `--color-text-tertiary` (`#A49A95`), focus `--color-border-focus` (`#E96862`), lỗi `--color-error` (`#D14343`).
- **Cards / Containers:** Bo góc `16px` (`rounded-2xl`), nền `--color-surface` (`#FFFFFF`), viền `--color-border` (`#EEE5E1`).
- **Checkboxes:** Bo góc `4px` (`rounded`), viền `--color-border-strong` (`#DED2CC`), màu kích hoạt `--color-primary` (`#E96862`).

---

## 9. Do's and Don'ts

### Do:
- **Do** sử dụng chính xác tên CSS Variables và mã HEX trong `design_new.css` (`--color-primary` `#E96862`, `--color-background` `#FAF8F7`, `--color-surface` `#FFFFFF`, `--color-text-primary` `#292321`, `--color-ai-primary` `#7656D6`, ...).
- **Do** tách biệt rạch ròi màu **Coral (`#E96862`)** cho thương hiệu/hành động chính, **Warm Neutral** cho nền/bề mặt, **Violet & Lavender (`#7656D6` / `#F2EDFF`)** cho AI, và **Semantic Colors** cho trạng thái hệ thống.
- **Do** sử dụng đúng quy chuẩn bo góc (`4px`, `8px`, `16px`, `9999px`) và font hệ thống gốc (`system-ui`).
- **Do** viết toàn bộ văn bản giao diện (Button, Label, Title, Modal, Thông báo) trực tiếp bằng tiếng Việt chuẩn mực, rõ ràng, gãy gọn.
- **Do** tái sử dụng tối đa các thành phần UI chung từ `@core` (`Button`, `Input`, `LoadingSpinner`, `AppImage`).

### Don't:
- **Don't** sử dụng lại các bảng màu cũ hoặc tự ý tạo thêm bất kỳ mã HEX/token nào ngoài danh sách đã định nghĩa trong `design_new.css`.
- **Don't** tự ý thêm bộ chuyển đổi Light/Dark mode hoặc viết các class `dark:` gây phá vỡ tính thống nhất của Light Mode.
- **Don't** dùng màu AI (`--color-ai-primary` `#7656D6`, `--color-ai-background` `#F2EDFF`) cho các chức năng xã hội thông thường, hay dùng màu Coral cho tính năng AI.
- **Don't** tô màu `--color-primary` (`#E96862`) lên toàn bộ icon thụ động hoặc các thành phần không cần nhấn mạnh.
- **Don't** sử dụng font Monospace cho văn bản thông thường (chỉ dùng duy nhất cho code, token, ID kỹ thuật).
- **Don't** đưa các nội dung hoặc thành phần giao diện thương mại (đơn hàng, giỏ hàng, thanh toán, bán hàng) vào hệ thống.
