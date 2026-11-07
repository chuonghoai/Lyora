# AI Agent Skills & Rules System (Lyora Monorepo)

Hệ thống Skills và Rules trong thư mục `.agents` được thiết kế để chuẩn hóa quy trình làm việc của AI Agent trong dự án **Lyora Monorepo**, bao gồm 3 dự án chính và 1 thư viện dùng chung:
- **`lyora_backend`**: Backend API viết bằng NestJS.
- **`lyora_client`**: Ứng dụng Web dành cho Khách hàng / Cư dân (ReactJS + Vite).
- **`lyora_admin`**: Ứng dụng Web dành cho Ban Quản trị / Điều phối (ReactJS + Vite).
- **`lyora_web_shared`**: Thư viện dùng chung (`@lyora/web-shared`) chứa components, hooks, utils, types, API client và cấu hình ESLint/Env cho hai frontend.

---

## 1. Source of Truth (Nguồn chân lý kiến trúc)

Mọi thay đổi do AI Agent thực hiện phải tuân thủ các tài liệu kiến trúc gốc theo thứ tự ưu tiên:
1. `architecture_web/` (Kiến trúc Web Frontend: `lyora_client`, `lyora_admin`, `lyora_web_shared`)
2. `architecture_backend/` (Kiến trúc Backend API NestJS: `lyora_backend`)
3. `DESIGN.md` (Design tokens, màu sắc, typography thống nhất)
4. `.agents/rules/` và `.agents/skills/` (Quy định hành vi và kỹ năng chuẩn hóa của Agent)

> **Nguyên tắc cốt lõi:**
> - Bắt buộc tái sử dụng tài nguyên dùng chung từ `lyora_web_shared`.
> - Bắt buộc sử dụng ESLint cho cả hai frontend.
> - Áp dụng một ngôn ngữ thống nhất (Tiếng Việt) và một giao diện trực quan thống nhất (không có i18n và không có Dark/Light mode).

---

## 2. Cấu trúc thư mục thực tế

```text
.agents/
├── README.md                               # Tài liệu tổng quan hệ thống Agent (file này)
├── rules/                                  # Hệ thống quy tắc dùng chung (Shared Rules)
│   ├── shared-architecture-rules.md        # Ràng buộc kiến trúc 3 dự án + lyora_web_shared
│   ├── shared-git-rules.md                 # Quy tắc an toàn thao tác Git
│   ├── shared-reporting-rules.md           # Chuẩn format báo cáo & đánh giá mức độ nghiêm trọng
│   ├── shared-ui-l10n-rules.md             # [Always-on] Quy định UI thống nhất, Tiếng Việt chuẩn mực & Design Taste
│   └── shared-workflow.md                  # Quy trình 10 bước chuẩn mực (Understand -> Plan -> Execute)
└── skills/                                 # Danh mục các kỹ năng chuyên biệt (Skills)
    ├── design-taste-frontend/              # [Group B] Thiết kế UI chống rập khuôn (Anti-slop frontend)
    ├── find-skills/                        # [Group B] Khám phá và cài đặt skill từ skills.sh
    ├── impeccable/                         # [Group B] Thiết kế, polish & audit UI components
    ├── lya-analyzeTask/                    # Phân tích scope, rủi ro, tác động của task
    ├── lya-cleanup/                        # Quét và dọn dẹp file rác trong workspace
    ├── lya-createPR/                       # Chuẩn bị và tạo Pull Request
    ├── lya-createTestCase/                 # Đọc code thực tế và tạo Test Cases
    ├── lya-fixbug/                         # Truy vết root cause và lập kế hoạch sửa bug
    ├── lya-newFeature/                     # Phân tích yêu cầu và lập kế hoạch tính năng mới
    ├── lya-newTesting/                     # Quy chuẩn viết Integration Test Backend (Jest runner)
    ├── lya-newWeeklyReport/                # Tự động hóa audit codebase & lập 4 file báo cáo tiến độ tuần
    ├── lya-review-code/                    # Review code branch hiện tại so với dev
    ├── lya-reviewPR/                       # Tổng hợp: Review toàn diện và Merge PR
    └── lya-reviewSecurityPerformance/      # Đánh giá an toàn, bảo mật và hiệu năng
```

---

## 3. Danh sách Skills

| Command / Skill | Purpose | Input | Sửa code | Sửa Git | Xác nhận (Approval) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `/lya-newFeature` | Phân tích và lập kế hoạch tính năng mới (`lyora_client` / `lyora_admin` / `lyora_backend`) | Mô tả tính năng | Có (khi user cho phép) | Không | **Có** (cho Implementation Plan) |
| `/lya-fixbug` | Phân tích root cause và lập kế hoạch sửa bug | Mô tả lỗi | Có (khi user cho phép) | Không | **Có** (cho Implementation Plan) |
| `/lya-analyzeTask` | Phân tích scope, rủi ro và tác động kiến trúc | Mô tả task | Không | Không | Không |
| `/lya-review-code` | Review branch hiện tại so với `dev` (Functional, Arch, Quality, Design) | Branch name / Không | Không | Không | Không |
| `/lya-reviewPR` | **Tổng hợp:** Review toàn diện và Merge PR | Branch name | Không | Có (merge, xóa branch) | **CÓ** (trước khi Merge) |
| `/lya-reviewSecurityPerformance` | Đánh giá an toàn, bảo mật và hiệu năng | Branch name | Không | Không | Không |
| `/lya-createPR` | Push code và tạo Pull Request lên remote | Không | Không | Có (push) | Không (chỉ tạo PR) |
| `/lya-createTestCase` | Đọc code thực tế để tạo Test Cases | Không / Mô tả | Không | Không | Không |
| `/lya-newTesting` | Viết integration test backend qua Jest runner | Tên API / Flow | Có (khi user cho phép) | Không | **Có** (cho plan test) |
| `/lya-newWeeklyReport` | Audit codebase & tạo 4 file báo cáo tiến độ tuần theo template | Tên tuần & Danh sách tính năng | Không (chỉ tạo file .md báo cáo) | Không | **Có** (nếu ghi đè báo cáo cũ) |
| `/lya-cleanup` | Quét và dọn dẹp file rác trong workspace | Không | Không (chỉ xóa rác) | Không | **Có** (trước khi xóa file) |
| `design-taste-frontend` | Hướng dẫn thiết kế frontend chất lượng cao, chống AI-slop | Brief UI / Yêu cầu thiết kế | Có (áp dụng trong code UI) | Không | Theo quy trình của task |
| `impeccable` | Thiết kế, polish & audit UI components, forms, pages | UI Component / Yêu cầu UI | Có (áp dụng trong code UI) | Không | Theo quy trình của task |
| `find-skills` | Tìm kiếm và cài đặt thêm skill từ hệ sinh thái [skills.sh](https://skills.sh/) | Câu hỏi / Từ khóa tìm kiếm | Không | Không | **Có** (trước khi cài đặt) |
