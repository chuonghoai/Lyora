# Shared Workflow Rules

Mọi Skill của AI Agent đều phải tuân thủ quy trình chung (Shared Workflow) sau đây.
Không được nhảy thẳng vào viết code hoặc thực hiện thay đổi khi chưa hoàn thành các bước hiểu và phân tích.

## Quy trình chuẩn (Standard Workflow)

1. **Understand (Hiểu yêu cầu)**
   - Đọc kỹ yêu cầu của user.
   - Xác định rõ mục tiêu và workspace đích: `lyora_backend` (NestJS) hoặc `lyora_web` (ReactJS).
2. **Inspect Repository (Kiểm tra kho lưu trữ)**
   - Kiểm tra cấu trúc hiện tại của repo, các package.json và dependencies liên quan.
3. **Inspect Architecture (Kiểm tra kiến trúc)**
   - Đọc các tài liệu kiến trúc tương ứng: `architecture_web/`, `architecture_backend/`.
   - Đọc tài liệu UI & Tokens: `DESIGN.md`, [Shared UI & Content Consistency Rules](shared-ui-l10n-rules.md), và tham chiếu [.agents/skills/design-taste-frontend/SKILL.md](../skills/design-taste-frontend/SKILL.md) (nếu có UI).
4. **Inspect Existing Implementation & Core Resources (Kiểm tra tài nguyên có sẵn)**
   - Tìm các module/feature liên quan.
   - **Bắt buộc rà soát `lyora_web/src/core` (`@core`)** trước khi tạo component, hook, utility hoặc type mới để tái sử dụng.
5. **Inspect Related Git History (Kiểm tra lịch sử Git)**
   - Xem các commit gần đây về tính năng tương tự để hiểu pattern hiện tại, convention, và các bug fix trước đó.
6. **Analyze (Phân tích)**
   - Phân tích rủi ro, side effects, dependency giữa UI, Data Layer (`features`) và Core.
7. **Implementation / Review Plan (Lập kế hoạch)**
   - Tạo kế hoạch rõ ràng cho các thay đổi cần thiết.
8. **Execute only when authorized (Thực thi khi được phép)**
   - Chờ xác nhận của user với những thay đổi lớn hoặc khi Skill quy định rõ phải chờ.
9. **Validate (Xác minh)**
   - Chạy ESLint (`npm run lint`), build (`npm run build`) và test tương ứng trên các workspace bị ảnh hưởng.
10. **Report (Báo cáo)**
    - Thông báo cho user kết quả công việc.
