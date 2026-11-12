# AI Agent Skills & Rules System (Lyora Monorepo)

Hệ thống Skills và Rules trong thư mục `.agents` được thiết kế để chuẩn hóa quy trình làm việc của AI Agent trong dự án **Lyora Monorepo**, bao gồm 2 workspace chính:
- **`lyora_backend`**: Backend API viết bằng NestJS (TypeScript + TypeORM + PostgreSQL + Redis).
- **`lyora_web`**: Unified Web Frontend Portal (ReactJS + Vite + TypeScript + TailwindCSS), bao gồm 4 layer chuẩn hóa:
  - `core`: Hạ tầng dùng chung, HTTP API Client, Storage, Toast, WebSocket, UI primitives.
  - `features`: Data Layer độc lập, thuần TypeScript (Services, Repositories, TanStack Query Hooks, Models, Types).
  - `ui`: View Layer phân thành 3 module gốc (`admin`, `auth`, `client`) với mô hình kết nối View-Controller thống nhất.
  - `routes`: Cấu hình định tuyến tập trung, Route Guards, Lazy Loading.

---

## 1. Source of Truth (Nguồn chân lý kiến trúc)

Mọi thay đổi do AI Agent thực hiện phải tuân thủ các tài liệu kiến trúc gốc theo thứ tự ưu tiên:
1. `architecture_web/` (Kiến trúc Web Frontend Hợp nhất: `lyora_web`)
2. `architecture_backend/` (Kiến trúc Backend API NestJS: `lyora_backend`)
3. `DESIGN.md` (Design tokens, bảng màu Cyber Precision, typography thống nhất)
4. `.agents/rules/` và `.agents/skills/` (Quy định hành vi và kỹ năng chuẩn hóa của Agent)

> **Nguyên tắc cốt lõi:**
> - Bắt buộc tái sử dụng hạ tầng và UI primitives từ `@core` (`lyora_web/src/core`).
> - Bắt buộc tuân thủ luồng dữ liệu một chiều: `View -> Controller -> Query Hook -> Service -> Repository -> Core API Client -> Backend`.
> - Bắt buộc sử dụng ESLint cho cả hai workspace.
> - Áp dụng một ngôn ngữ thống nhất (Tiếng Việt) và một giao diện trực quan thống nhất (không dùng thư viện i18n và không dùng Dark/Light mode).

---

## 2. Cấu trúc thư mục thực tế

```text
.agents/
├── README.md                               # Tài liệu tổng quan hệ thống Agent (file này)
├── rules/                                  # Hệ thống quy tắc dùng chung (Shared Rules)
│   ├── shared-architecture-rules.md        # Ràng buộc kiến trúc 2 workspace: lyora_backend & lyora_web
│   ├── shared-git-rules.md                 # Quy tắc an toàn thao tác Git
│   ├── shared-reporting-rules.md           # Chuẩn format báo cáo & đánh giá mức độ nghiêm trọng
│   ├── shared-ui-l10n-rules.md             # [Always-on] Quy định UI thống nhất, Tiếng Việt chuẩn mực & Design Taste
│   └── shared-workflow.md                  # Quy trình 10 bước chuẩn mực (Understand -> Plan -> Execute)
└── skills/                                 # Danh mục các kỹ năng chuyên biệt (Skills)
    ├── design-taste-frontend/              # [Group B] Thiết kế UI chống rập khuôn (Anti-slop frontend)
    ├── find-skills/                        # [Group B] Khám phá và cài đặt skill từ skills.sh
    ├── impeccable/                         # [Group B] Thiết kế, polish & audit UI components
    ├── logo-design/                        # [Group B] Thiết kế logo & nhận diện thương hiệu chuyên nghiệp
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
| `/lya-newFeature` | Phân tích và lập kế hoạch tính năng mới (`lyora_web` / `lyora_backend`) | Mô tả tính năng | Có (khi user cho phép) | Không | **Có** (cho Implementation Plan) |
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
| `logo-design` | Thiết kế logo, biểu tượng & bộ nhận diện thương hiệu chuyên nghiệp | Brief thương hiệu / Yêu cầu logo | Có (tạo/sửa file SVG, assets logo) | Không | **Có** (Checkpoint duyệt concept) |
| `find-skills` | Tìm kiếm và cài đặt thêm skill từ hệ sinh thái [skills.sh](https://skills.sh/) | Câu hỏi / Từ khóa tìm kiếm | Không | Không | **Có** (trước khi cài đặt) |
