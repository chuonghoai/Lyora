---
trigger: always_on
---

# Shared UI & Content Consistency Rules

Mọi thay đổi liên quan đến Giao diện người dùng (UI) và Văn bản hiển thị (User-facing text) trong hệ sinh thái Lyora (`lyora_web`) MUST tuân thủ nghiêm ngặt các quy định sau đây.

---

## 1. DESIGN & GIAO DIỆN THỐNG NHẤT (UNIFIED THEME)

Dự án áp dụng **một giao diện trực quan thống nhất**, KHÔNG triển khai chuyển đổi Light/Dark mode.

- **MUST** tuân thủ tuyệt đối hệ thống màu sắc, kiểu chữ và spacing quy định trong `DESIGN.md`.
- **MUST NOT** tự ý sử dụng các mã màu cố định ngoài hệ thống token (tránh dùng mã màu ngẫu nhiên không thuộc bảng token).
- **MUST** tận dụng tối đa các thành phần UI dùng chung trong gói `@core` (`Button`, `Input`, `AppImage`, `LoadingSpinner`) trước khi tạo mới component cục bộ.
- **MUST** tuân thủ quy tắc thiết kế UI trong [.agents/skills/design-taste-frontend/SKILL.md](../skills/design-taste-frontend/SKILL.md) khi tạo mới giao diện:
  - Thực hiện Brief Inference, xuất 1 dòng "Design Read" trước khi code.
  - Thiết lập The Three Dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`).
  - Tuân thủ Anti-Default Discipline (không dùng gradient tím rập khuôn AI, không chia 3 card vô hồn, không lạm dụng glassmorphism).
- **Khi chỉnh sửa hoặc sửa lỗi (fix bug):** Chỉ can thiệp trong phạm vi cục bộ của bug; **TUYỆT ĐỐI KHÔNG** tự ý redesign toàn bộ màn hình nếu yêu cầu chỉ là sửa một lỗi nhỏ.

---

## 2. NGÔN NGỮ THỐNG NHẤT & CHUẨN MỰC NỘI DUNG (UNIFIED LANGUAGE)

Dự án sử dụng **một ngôn ngữ thống nhất (Tiếng Việt)** cho toàn bộ giao diện người dùng và thông báo hệ thống.

- **KHÔNG** sử dụng các thư viện đa ngôn ngữ (i18n / `react-i18next` / `nestjs-i18n`) hoặc các file từ điển JSON phức tạp (`en.json`, `vi.json`).
- Mọi văn bản hiển thị cho người dùng (Button label, Tiêu đề trang, Modal, Thông báo lỗi, Validation message, Placeholder) phải được viết trực tiếp bằng **Tiếng Việt chuẩn mực, rõ ràng, gãy gọn**.
- Đảm bảo tính nhất quán của thuật ngữ giữa Cổng Người Dùng (`src/ui/client`) và Trung Tâm Quản Trị (`src/ui/admin`) (ví dụ: dùng thống nhất "Bài viết", "Bình luận", "Tin nhắn", "Chia sẻ", "Báo cáo vi phạm", "Kiểm duyệt").
- **Khi code review / PR review**: Agent MUST kiểm tra và phát hiện các chuỗi văn bản sai chính tả, ngôn ngữ lộn xộn hoặc các placeholder i18n cũ còn sót lại.

---

## 3. PHẠM VI NGHIỆP VỤ & ĐỊNH HƯỚNG PHI THƯƠNG MẠI (SOCIAL COMMUNITY DOMAIN)

- **Bản chất dự án:** Lyora là nền tảng **Cộng đồng số — Tương tác bài viết — Nhắn tin — Chia sẻ thời gian thực** (Social Networking & Real-Time Communication Platform).
- **Theme Design vs Domain:** Bảng màu và phong cách "Cyber Precision" trong `DESIGN.md` chỉ đóng vai trò là **chủ đề thiết kế thị giác (Theme Design)**.
- **TUYỆT ĐỐI KHÔNG** đưa các nội dung hoặc chức năng thương mại, kinh doanh (như bán hàng, Cyber Key, license key, đơn hàng, doanh thu, giỏ hàng, thanh toán) vào UI, API, Dashboard hay tài liệu của dự án.

