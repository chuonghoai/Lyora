# Audit Report: Repository & Architecture Assessment

**Thời gian thực hiện:** 2026-11-07  
**Dự án:** Lyora (Refactor từ SmartSpace sang ReactJS + NestJS Monorepo)  
**Trạng thái kiểm tra:** Hoàn thành toàn diện  

---

## 1. Tổng quan kiểm tra (Audit Overview)

Hệ thống đã thực hiện kiểm tra toàn bộ workspace, bao gồm 3 thư mục chỉ định:
- `.agents/`
- `app_architecture/`
- `backend_architecture/`

### 1.1. Thống kê file và thư mục
- **Tổng số file trong workspace (trước refactor):** 141 files.
- **Thư mục gốc:**
  - `.agents/` (bao gồm `README.md`, 5 rules, và 14 skills: 11 Group A + 3 Group B).
  - `app_architecture/` (12 files tài liệu Markdown).
  - `backend_architecture/` (4 files tài liệu Markdown).
- **Trạng thái Git:** Repository chưa khởi tạo git (`.git` không tồn tại).
- **Trạng thái Monorepo:** Chưa có `package.json`, chưa có thư mục mã nguồn `frontend/` hay `backend/`.
- **Môi trường Runtime:** Node.js v24.11.1, npm v11.6.2.

---

## 2. Phân loại Skills trong `.agents/skills/`

Theo quy tắc bảo vệ phạm vi (Section 2 của Task Request), toàn bộ 14 skills trong `.agents/skills/` được phân tách nghiêm ngặt thành hai nhóm:

### 2.1. Nhóm A — Skills bắt đầu bằng `smp-` (Được phép refactor)
Tổng cộng: **11 skills** (mỗi skill chứa đúng 1 file `SKILL.md`):

| STT | Tên Skill hiện tại | Đường dẫn file | Mô tả & Trạng thái |
| :---: | :--- | :--- | :--- |
| 1 | `smp-analyzeTask` | `.agents/skills/smp-analyzeTask/SKILL.md` | Phân tích scope, rủi ro, tác động của task trước khi code. |
| 2 | `smp-cleanup` | `.agents/skills/smp-cleanup/SKILL.md` | Quét và dọn dẹp file tạm, file rác trong workspace. |
| 3 | `smp-createPR` | `.agents/skills/smp-createPR/SKILL.md` | Chuẩn bị và tạo Pull Request từ branch hiện tại vào `dev`. |
| 4 | `smp-createTestCase` | `.agents/skills/smp-createTestCase/SKILL.md` | Đọc code thực tế và tạo Test Cases toàn diện. |
| 5 | `smp-fixbug` | `.agents/skills/smp-fixbug/SKILL.md` | Truy vết root cause và lập kế hoạch sửa bug an toàn. |
| 6 | `smp-newFeature` | `.agents/skills/smp-newFeature/SKILL.md` | Phân tích requirement và lập Implementation Plan tính năng mới. |
| 7 | `smp-newTesting` | `.agents/skills/smp-newTesting/SKILL.md` | Viết integration test backend & cấu hình runner `testapi.ps1`. |
| 8 | `smp-newWeeklyReport` | `.agents/skills/smp-newWeeklyReport/SKILL.md` | Audit codebase & tạo 4 file báo cáo tiến độ tuần theo template. |
| 9 | `smp-review-code` | `.agents/skills/smp-review-code/SKILL.md` | Review code branch hiện tại so với branch `dev`. |
| 10 | `smp-reviewPR` | `.agents/skills/smp-reviewPR/SKILL.md` | Workflow tổng hợp: Review toàn diện và Merge PR. |
| 11 | `smp-reviewSecurityPerformance` | `.agents/skills/smp-reviewSecurityPerformance/SKILL.md` | Đánh giá an toàn, bảo mật và hiệu năng của branch. |

### 2.2. Nhóm B — Skills KHÔNG bắt đầu bằng `smp-` (BẢO VỆ PHẠM VI TUYỆT ĐỐI)
Tổng cộng: **3 skills** (gồm **108 files**):

| STT | Tên Skill | Số lượng file | Trạng thái bảo vệ |
| :---: | :--- | :---: | :--- |
| 1 | `design-taste-frontend` | 38 files | **Bảo vệ nguyên vẹn 100%**: Không đổi tên, không sửa nội dung, không sửa path. |
| 2 | `find-skills` | 1 file | **Bảo vệ nguyên vẹn 100%**: Không đổi tên, không sửa nội dung, không sửa path. |
| 3 | `impeccable` | 69 files | **Bảo vệ nguyên vẹn 100%**: Không đổi tên, không sửa nội dung, không sửa path. |

> **Cơ chế kiểm soát tính toàn vẹn (Integrity Baseline):**  
> Toàn bộ 108 files thuộc nhóm B đã được tính mã băm SHA-256 độc lập và lưu trữ tại `group_b_initial_hashes.csv`. Sau khi hoàn thành refactor, hệ thống sẽ kiểm tra đối chiếu lại để chứng minh không có bất kỳ ký tự nào bị thay đổi.

---

## 3. Đánh giá hiện trạng kiến trúc & Các vấn đề phát hiện

### 3.1. Thư mục `app_architecture/` (Flutter Client)
Hiện tại toàn bộ 12 files được thiết kế cho ứng dụng di động / web Flutter với các thành phần:
- **Ngôn ngữ & Runtime:** Dart, Flutter SDK, `flutter gen-l10n`, `flutter analyze`.
- **State Management:** Riverpod (`StateNotifier`, `StateNotifierProvider`, `ref.watch`, `ref.listen`).
- **UI & Widget:** Flutter Widgets (`StatelessWidget`, `StatefulWidget`, `FocusNode`, `TextEditingController`, `CircularProgressIndicator`, `Image.network`).
- **Navigation:** `go_router` (`context.go`, `context.push`, `context.pop`, `context.pushReplacement`, cấu trúc 3-file `route_name.dart`, `router_path.dart`, `app_router.dart`).
- **Data Serialization:** `fromJson` và `toJson` theo kiểu Dart `Map<String, dynamic>`.
- **Localization:** Flutter ARB files (`app_en.arb`, `app_vi.arb`).
- **Cấu trúc thư mục cũ:** `lib/core/`, `lib/features/`, `lib/ui/mobile/`, `lib/ui/web/`, `lib/ui/responsive/`, `lib/ui/shared/`.

**Định hướng chuyển đổi sang ReactJS Web Architecture:**
- Đổi tên thư mục thành `web_architecture/`.
- Chuyển đổi sang ReactJS + TypeScript + Vite.
- State Management: Phân tách rõ Local UI State (useState/useReducer), Shared Global State (Zustand hoặc Context API), và Server State / Caching (TanStack Query).
- Navigation: `react-router` (data routing / layout nesting / useNavigate / Link).
- Forms & Validation: React Hook Form + Zod.
- Data fetching & HTTP: Axios client có interceptors (JWT auth token, refresh token).
- Localization: `i18next` / `react-i18next` với cấu trúc JSON (`locales/en.json`, `locales/vi.json`).
- UI & Styling: CSS Modules / TailwindCSS / Design Tokens tương thích Dark/Light Mode.
- Testing: Vitest + React Testing Library.

### 3.2. Thư mục `backend_architecture/` (Spring Boot Backend)
Hiện tại toàn bộ 4 files được viết cho hệ thống Spring Boot Java:
- **Ngôn ngữ & Framework:** Java, Spring Boot, Spring Data JPA, Spring Security, Lombok.
- **Layers:** Controller (`@RestController`, `@PostMapping`), Service (`@Service`, `@Transactional`), Repository (`JpaRepository`, `StringRedisTemplate`).
- **DTO & Validation:** Lombok annotations (`@Data`, `@Builder`), Bean Validation (`@Valid`, `@NotBlank`, `@Email`).
- **Security & Token:** Spring Security JWT, `nimbus-jose-jwt` (`SignedJWT`, `MACSigner`), `User.getLanguage()`, `MessageSource` (`messages_vi.properties`, `messages_en.properties`).
- **Test:** JUnit 5 (`@BeforeAll`, `@Test`, `java.net.http.HttpClient`).

**Định hướng chuyển đổi sang NestJS Backend Architecture:**
- Giữ nguyên tên thư mục `backend_architecture/`.
- Chuyển đổi sang NestJS + TypeScript + Node.js.
- Module Architecture: `@Module`, `@Controller`, `@Injectable` (Service), Provider/Repository.
- Validation: `class-validator` và `class-transformer` với `ValidationPipe` toàn cục.
- Database & ORM: TypeORM hoặc Prisma (sử dụng decorator `@Entity`, `@Repository` hoặc Prisma client).
- Security & Auth: `@nestjs/passport`, `@nestjs/jwt`, Guards (`JwtAuthGuard`, `RolesGuard`), Decorators tùy chỉnh (`@CurrentUser`).
- Realtime & Push Notification: WebSocket Gateway (`@WebSocketGateway`, `@WebSocketServer`, Socket.IO) và Firebase Admin SDK.
- Localization: `nestjs-i18n` với JSON/YAML message keys theo ngôn ngữ người dùng (`user.language`).
- Testing: Jest, Supertest (`*.spec.ts`, `*.e2e-spec.ts`).

### 3.3. Các tham chiếu và ràng buộc liên quan trong `.agents/`
- `.agents/README.md`: Chứa 37 tham chiếu đến các định danh cũ (`smp-*`, `SmartSpace`, `app_architecture/`, Spring Boot). Cần cập nhật sang `lya-*`, `web_architecture/`, ReactJS và NestJS.
- `.agents/rules/shared-architecture-rules.md`: Tham chiếu `app_architecture/` -> cần trỏ sang `web_architecture/`.
- `.agents/rules/shared-workflow.md`: Tham chiếu `app_architecture/` -> cần trỏ sang `web_architecture/`.
- `.agents/rules/shared-ui-l10n-rules.md`: Quy tắc Dark/Light Mode và L10n cần giữ nguyên giá trị cốt lõi, nhưng ví dụ hiển thị không dùng cú pháp Dart `Text("...")`.
- Group A Skills: Có các tham chiếu chéo giữa các skill (`smp-reviewPR` gọi `smp-review-code`, `smp-newWeeklyReport` gọi `smp-newFeature`). Cần cập nhật đồng bộ sang tiền tố `lya-`.

---

## 4. Tình trạng Repository hiện tại

- Không có file `package.json` ở root.
- Không có cấu hình npm workspaces.
- Không có thư mục `frontend/` hoặc `backend/`.
- Không có mã nguồn ứng dụng giả hay file mock.
- Hệ thống sẵn sàng cho quá trình Refactor từng giai đoạn theo đúng yêu cầu đề ra.

