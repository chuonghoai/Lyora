# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Người dùng cá nhân (Client / End Users):** Người dùng tham gia mạng xã hội để kết nối bạn bè, chia sẻ suy nghĩ, hình ảnh, bài viết; tương tác, bình luận, chia sẻ nội dung; nhắn tin trò chuyện và gọi điện trực tiếp với bạn bè trong thời gian thực.
- **Quản trị viên & Kiểm duyệt viên (Admin / Moderator):** Đội ngũ quản trị hệ thống phụ trách giám sát dòng nội dung trên nền tảng, đăng tải thông báo/bài viết chính thức, kiểm duyệt và khóa các bài viết vi phạm tiêu chuẩn cộng đồng, đồng thời quản lý người dùng và cấu hình các tính năng của trang web.

## Product Purpose

Lyora là nền tảng mạng xã hội và truyền thông tương tác hiện đại, giúp kết nối mọi người thông qua việc chia sẻ bài viết, nhắn tin và gọi điện trực tuyến. Sản phẩm hướng tới xây dựng một không gian giao tiếp gắn kết, lành mạnh, có tính tương tác cao và kiểm duyệt nội dung văn minh.

## Positioning

Mạng xã hội tập trung vào sự kết nối chân thực và giao tiếp tức thời, tích hợp mượt mà giữa dòng thời gian bài viết (Social Feed) và kênh liên lạc trực tiếp (Tin nhắn & Cuộc gọi thời gian thực) trên một giao diện thống nhất, tinh gọn và thân thiện với người dùng Việt Nam.

## Operating Context

- **Môi trường hoạt động:** Ứng dụng web hiện đại trên trình duyệt máy tính (Desktop Web) và thiết bị di động (Mobile Web).
- **Quy trình hoạt động Client:** Đăng nhập → Lướt bảng tin bài viết → Đăng bài viết cá nhân → Bày tỏ cảm xúc / Bình luận / Chia sẻ bài viết → Nhắn tin trao đổi riêng/nhóm → Gọi điện thoại/video call với bạn bè.
- **Quy trình hoạt động Admin:** Đăng nhập bảng điều khiển quản trị → Xuất bản bài viết/thông báo hệ thống → Giám sát luồng bài viết từ người dùng → Thực hiện kiểm duyệt, ẩn hoặc khóa bài viết vi phạm → Quản lý danh sách tài khoản và bật/tắt các tính năng hệ thống.

## Capabilities and Constraints

- **Phạm vi chức năng cốt lõi (Core Capabilities):**
  - *Phân hệ Client (`src/ui/client`):* Đăng bài viết đa phương tiện, chia sẻ và tương tác bài viết (like, comment, share), nhắn tin trò chuyện trực tiếp (chat), gọi điện thoại/video thời gian thực với bạn bè.
  - *Phân hệ Admin (`src/ui/admin`):* Đăng bài viết chính thức của hệ thống, quản lý danh sách bài viết, công cụ kiểm duyệt & khóa bài viết người dùng vi phạm, quản lý người dùng và cấu hình tính năng trang web.
  - *Phân hệ Xác thực (`src/ui/auth`):* Đăng nhập, đăng ký tài khoản, phân quyền truy cập theo vai trò (`CLIENT`, `ADMIN`, `STAFF`).
- **Phạm vi ngoài lề (Out of Scope):**
  - Không bao gồm các hoạt động thương mại điện tử, mua bán hàng hóa, thanh toán đơn hàng hay cấp phát key bản quyền phần mềm.
- **Ràng buộc kỹ thuật & Kiến trúc (Technical Constraints):**
  - Cấu trúc Monorepo: `lyora_web` (Frontend React 19 + Vite 8 + TailwindCSS 4 + TanStack Query 5 + Zustand 5) kết hợp `lyora_backend` (NestJS 11 + TypeORM + PostgreSQL + Redis + WebSocket).
  - Kiến trúc phân lớp nghiêm ngặt (Strict Layered Architecture): Tách biệt Core, Data Layer (Repository/Service/Query), UI Layer (View-Controller) và Routing Guards.
  - Giao diện trực quan thống nhất (Unified Theme): Chỉ áp dụng 1 theme sáng chuẩn mực (Light Mode), không chia tách Dark/Light mode.
  - Ngôn ngữ thống nhất (Unified Language): 100% tiếng Việt chuẩn mực, rõ ràng cho mọi thành phần UI và thông báo người dùng; không sử dụng thư viện i18n phức tạp.

## Brand Commitments

- **Tên nền tảng:** Lyora.
- **Phong cách thị giác (Visual North Star):** "Cyber Precision & Ambient Clarity" quy định tại `DESIGN.md`. Sắc xanh chủ đạo Primary Blue (`#2563eb`), điểm nhấn công nghệ tím (`#aa3bff`), bề mặt nền sáng tinh khiết (`#ffffff`, `#f8fafc`).
- **Giọng điệu (Voice & Tone):** Thân thiện, gãy gọn, minh bạch, văn minh và hiện đại.

## Evidence on Hand

- Cấu trúc thư mục mã nguồn hiện có tại `lyora_web/src/ui/` (phân chia `client`, `admin`, `auth`) và `lyora_backend/src/modules/` (auth, users, health).
- Hệ thống Design Tokens và quy chuẩn giao diện chi tiết đã được ban hành trong `DESIGN.md`.
- Ghi chú hiệu chỉnh: Toàn bộ các định nghĩa trước đây liên quan đến "Cyber Keys / Software License" trong các tài liệu cũ được thay thế bằng mô hình mạng xã hội và truyền thông tương tác theo xác nhận chính thức từ người dùng.

## Product Principles

1. **Kết nối trực tiếp & Tức thời (Direct & Real-time):** Trải nghiệm đăng bài, tương tác, nhắn tin và gọi điện phải đạt độ phản hồi nhanh nhạy, mượt mà và tin cậy cao.
2. **Minh bạch & Văn minh (Safety & Moderation):** Nội dung cộng đồng được kiểm duyệt công tâm, quy trình khóa/ẩn bài viết vi phạm rõ ràng nhằm bảo vệ môi trường tương tác lành mạnh.
3. **Tinh gọn & Tập trung (Clarity over Clutter):** Giao diện loại bỏ hoàn toàn các yếu tố thương mại rườm rà hay AI-slop; tập trung tối đa vào nội dung bài viết và trải nghiệm kết nối con người.
4. **Nhất quán chuẩn mực (Unified Identity):** Tuyệt đối tuân thủ ngôn ngữ tiếng Việt tự nhiên và hệ thống Design Tokens đồng bộ từ cổng người dùng đến bảng quản trị.

## Accessibility & Inclusion

- Độ tương phản màu chữ đạt chuẩn WCAG (Contrast ratio > 4.5:1 cho văn bản thông thường, > 10:1 cho tiêu đề chính).
- Vùng chạm tối thiểu 44x44px trên các thiết bị cảm ứng và giao diện di động.
- Trạng thái giao diện đầy đủ (Loading spinner, Empty state trực quan, Error feedback rõ ràng bằng tiếng Việt).

