# Feature Development Workflow & Definition of Done

Bất kỳ AI Agent nào khi triển khai một tính năng mới hoặc chỉnh sửa tính năng hiện tại trên các ứng dụng Web Frontend (`lyora_client` hoặc `lyora_admin`), đều phải tuân thủ quy trình dưới đây.

---

## Workflow 10 Bước Chuẩn Mực

1. **Hiểu rõ yêu cầu & Xác định dự án mục tiêu:** Xác định rõ tính năng thuộc về `lyora_client` (Website khách hàng), `lyora_admin` (Website quản trị), hay là tài nguyên dùng chung thuộc `lyora_web_shared`.
2. **Kiểm tra tài nguyên dùng chung (`lyora_web_shared`):** Bắt buộc rà soát `@lyora/web-shared` xem đã có component, hook, utility hoặc type tương tự chưa. Nếu có, tái sử dụng ngay.
3. **Thiết kế Component Hierarchy:** Phân chia Page, Layouts và Sub-components theo chuẩn Feature-based.
4. **Thiết kế UI Controller Hook:** Xác định state nội bộ, handlers, và các mutation/query từ TanStack Query.
5. **Thiết kế Service & API:** Sử dụng `apiClient` từ `@lyora/web-shared` để kết nối tới backend.
6. **Xác định Types & Zod Schema:** Khai báo interface cho DTOs và schema validation form.
7. **Cấu hình React Router:** Khai báo route path trong router constants của dự án tương ứng.
8. **Triển khai Code:** Viết code theo thứ tự: Types -> Service -> Hook -> Components -> Page. Sử dụng tiếng Việt rõ ràng, thống nhất cho nội dung hiển thị (không dùng i18n).
9. **Kiểm tra UI Theme & Thẩm mỹ:** Đối chiếu với `DESIGN.md` và tiêu chí chống AI-slop từ Taste Skill.
10. **Linting & Testing:**
    - Chạy ESLint bắt buộc: `npm run client:lint` hoặc `npm run admin:lint`.
    - Chạy build: `npm run client:build` hoặc `npm run admin:build`.

---

## Definition of Done (DoD) Checklist

Trước khi coi một feature là hoàn thành, Agent **PHẢI** kiểm tra đầy đủ các tiêu chí sau:

- [ ] Đã xác định đúng workspace (`lyora_client` / `lyora_admin` / `lyora_web_shared`).
- [ ] Đã tái sử dụng các components và utilities có sẵn từ `@lyora/web-shared`.
- [ ] Không tạo duplicate code giữa Client và Admin nếu thành phần đó có thể dùng chung.
- [ ] Tách biệt rõ ràng giữa Presentation Component (TSX) và Logic Controller (Custom Hook).
- [ ] Không hardcode URL API tùy tiện; sử dụng `apiClient` từ `@lyora/web-shared`.
- [ ] Văn bản trên giao diện hiển thị đúng chuẩn tiếng Việt thống nhất; không chứa placeholder i18n.
- [ ] Tuân thủ bảng mã màu và tokens thống nhất trong `DESIGN.md` (không có Light/Dark mode).
- [ ] Hình ảnh từ internet bắt buộc sử dụng component `AppImage`.
- [ ] Chạy ESLint thành công không có lỗi (`npm run lint`).
- [ ] TypeScript compile thành công (`npm run build`).
- [ ] Không rò rỉ bất kỳ thông tin bí mật hoặc private keys nào vào Frontend.
