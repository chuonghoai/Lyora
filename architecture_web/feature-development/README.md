# Quy Trình Phát Triển Tính Năng Mới & Definition of Done (`lyora_web`)

Bất kỳ AI Agent hoặc lập trình viên nào khi triển khai một tính năng mới trong `lyora_web` đều phải tuân thủ nghiêm ngặt quy trình dưới đây.

---

## 1. Quy Trình 6 Bước Triển Khai Tính Năng

```text
Step 1: Data Types & Zod Schemas (@features/[module]/types & models)
   │
   ▼
Step 2: Repository & Service (@features/[module]/repositories & services)
   │
   ▼
Step 3: Query Key Factory & Query Hooks (@features/[module]/hooks)
   │
   ▼
Step 4: UI Controller Hook (@ui/[portal]/[submodule]/*.controller.ts)
   │
   ▼
Step 5: UI View Component (@ui/[portal]/[submodule]/*View.tsx)
   │
   ▼
Step 6: Registration & Testing (routes/paths.ts, AppRoutes.tsx, tests/)
```

### Chi tiết từng bước:
1. **Bước 1 — Định nghĩa Types & Zod Schemas:**
   - Đặt trong `src/features/[feature]/types/[feature].types.ts` và `src/features/[feature]/models/[feature].model.ts`.
   - Khớp 100% với DTO của Backend NestJS.
2. **Bước 2 — Xây dựng Repository & Service:**
   - Repository gọi `apiClient` từ `@core`.
   - Service xử lý business rules, session, tokens.
3. **Bước 3 — Tạo Query Key Factory & Query Hooks:**
   - Đặt trong `src/features/[feature]/hooks/[feature].keys.ts` và `use-[action].query.ts`.
   - Đảm bảo cấu hình `staleTime: 10 phút` và cache invalidation chính xác.
4. **Bước 4 — Xây dựng UI Controller:**
   - Tạo `src/ui/[portal]/[submodule]/[submodule].controller.ts` xuất hook `use[Submodule]Controller`.
   - Trả về object thống nhất chứa states và handlers (`handle...`).
   - Tích hợp hook từ Data Layer, điều hướng router, Toast notification.
5. **Bước 5 — Xây dựng UI View:**
   - Tạo `src/ui/[portal]/[submodule]/[Submodule]View.tsx`.
   - Khởi tạo controller đúng 1 lần: `const controller = use[Submodule]Controller()`.
   - Sử dụng các UI primitive từ `@core` (`Button`, `Input`, `AppImage`, `LoadingSpinner`).
   - Tuân thủ tokens trong `DESIGN.md` và 100% văn bản Tiếng Việt.
6. **Bước 6 — Đăng ký Route & Kiểm thử:**
   - Khai báo URL trong `src/routes/paths.ts` và thêm route vào `src/routes/AppRoutes.tsx`.
   - Viết test trong `src/tests/` và chạy `npm run test --workspace=lyora_web`.
   - Kiểm tra ESLint: `npm run lint --workspace=lyora_web`.
   - Kiểm tra Build: `npm run build --workspace=lyora_web`.

---

## 2. Definition of Done (DoD) Checklist

Trước khi hoàn thành một feature, Agent **BẮT BUỘC** kiểm tra toàn bộ tiêu chí sau:

- [ ] **Layer Boundaries:** Đúng 4 layer (`core`, `features`, `ui`, `routes`). Không có import ngược từ `core` vào `features` hay `ui`.
- [ ] **No TanStack Query in UI:** Không có `useQuery`, `useMutation` hay `useQueryClient` nào trong `src/ui/`.
- [ ] **Pure Data Layer:** Không có file `.tsx` hay JSX nào trong `src/features/`.
- [ ] **View-Controller Contract:** View khởi tạo controller 1 lần; truy cập qua `controller.`; không destructure; không định nghĩa lại handler.
- [ ] **Flat UI Submodules:** Không có folder con `views/`, `controllers/`, `components/` trong các submodule của `src/ui/`.
- [ ] **Core Primitives Reused:** Tái sử dụng `Button`, `Input`, `AppImage`, `LoadingSpinner` từ `@core`.
- [ ] **Unified Theme:** Tuân thủ tokens `DESIGN.md` (Primary Blue `#2563eb`). Không triển khai Dark mode.
- [ ] **Unified Language:** 100% Tiếng Việt chuẩn mực trên giao diện và thông báo lỗi. Không dùng i18n.
- [ ] **No Secrets in Frontend:** Không đưa bất kỳ secret nào của backend vào `lyora_web`.
- [ ] **ESLint & TypeScript:** `npm run lint` đạt 0 error/0 warning; `tsc -b && vite build` thành công.
- [ ] **Unit Tests:** Toàn bộ test trong `src/tests/` chạy qua thành công (100% green).
