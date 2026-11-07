# Báo Cáo Tài Nguyên Dùng Chung (`shared_resources_report.md`)

**Thời gian lập báo cáo:** 2026-11-07  
**Dự án:** Lyora Monorepo  
**Gói dùng chung:** `web_shared` (Tên package: `@lyora/web-shared`)  

---

## 1. Nguyên tắc tổ chức tài nguyên dùng chung

- **Nguyên tắc duy nhất:** Mọi thành phần UI, hook, utility, kiểu dữ liệu (type) và cấu hình dùng chung giữa `lyora_client` và `lyora_admin` bắt buộc phải được đặt tập trung tại `web_shared`.
- **Ranh giới:** Không đưa code nghiệp vụ đặc thù của Client hoặc Admin vào `web_shared`. Không đưa backend secrets hoặc private keys vào `web_shared`.
- **Cơ chế nạp:** Được xuất khẩu thông qua barrel export `web_shared/src/index.ts` và nhập khẩu trực tiếp vào `lyora_client` và `lyora_admin` thông qua npm workspace dependency `"@lyora/web-shared": "*"`.

---

## 2. Bảng phân loại và theo dõi tài nguyên dùng chung

| STT | File / Resource | Vị trí cũ (nếu có) | Vị trí mới trong `web_shared` | Được sử dụng bởi | Trạng thái | Mục đích sử dụng |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | `apiClient.ts` | `frontend/src/core/api/apiClient.ts` | `web_shared/src/api/apiClient.ts` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Khởi tạo Axios instance tập trung, tự động gắn JWT Bearer token và chuẩn hóa lỗi API. |
| 2 | `Button.tsx` | Khởi tạo mới | `web_shared/src/components/Button.tsx` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | UI Button primitive hỗ trợ loading state, các biến thể `primary`, `secondary`, `outline`, `danger`. |
| 3 | `Input.tsx` | Khởi tạo mới | `web_shared/src/components/Input.tsx` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Input field chuẩn HTML form kèm label, error message tiếng Việt và a11y attributes. |
| 4 | `LoadingSpinner.tsx` | Khởi tạo mới | `web_shared/src/components/LoadingSpinner.tsx` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Spinner báo hiệu trạng thái tải bất đồng bộ (size sm, md, lg). |
| 5 | `AppImage.tsx` | Khởi tạo mới | `web_shared/src/components/AppImage.tsx` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Component render ảnh an toàn, lazy loading, có skeleton placeholder và fallback khi lỗi. |
| 6 | `useDebounce.ts` | Khởi tạo mới | `web_shared/src/hooks/useDebounce.ts` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Hook hoãn xử lý tìm kiếm và input text (debounce). |
| 7 | `useClickOutside.ts`| Khởi tạo mới | `web_shared/src/hooks/useClickOutside.ts`| `lyora_client`, `lyora_admin` | **Đã thiết lập** | Hook bắt sự kiện click ra ngoài để đóng modal, dropdown, drawer. |
| 8 | `formatDate.ts` | Khởi tạo mới | `web_shared/src/utils/formatDate.ts` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Tiện ích định dạng ngày giờ theo chuẩn tiếng Việt (`vi-VN`). |
| 9 | `formatCurrency.ts`| Khởi tạo mới | `web_shared/src/utils/formatCurrency.ts`| `lyora_client`, `lyora_admin` | **Đã thiết lập** | Tiện ích định dạng tiền tệ Việt Nam Đồng (VND). |
| 10 | `api.types.ts` | Khởi tạo mới | `web_shared/src/types/api.types.ts` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Types chuẩn: `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `UserRole`. |
| 11 | `constants/index.ts`| Khởi tạo mới | `web_shared/src/constants/index.ts` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Hằng số dùng chung: `APP_NAME`, `DEFAULT_PAGE_SIZE`, v.v. |
| 12 | `eslint.config.js` | Khởi tạo mới | `web_shared/eslint.config.js` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Cấu hình ESLint Flat Config dùng chung (`sharedEslintConfig`). |
| 13 | `.env / .env.example`| Khởi tạo mới | `web_shared/.env` | `lyora_client`, `lyora_admin` | **Đã thiết lập** | Biến môi trường công khai dùng chung (`VITE_API_BASE_URL`), nạp qua `envDir`. |
| 14 | Modal / Dialog | Chưa có | Dự kiến `web_shared/src/components/Modal.tsx` | `lyora_client`, `lyora_admin` | **Chưa di chuyển** | Sẽ bổ sung khi phát triển tính năng dialog phức tạp. |
| 15 | Table / Pagination | Chưa có | Dự kiến `web_shared/src/components/Table.tsx` | `lyora_client`, `lyora_admin` | **Chưa di chuyển** | Sẽ bổ sung khi phát triển tính năng quản trị danh sách dữ liệu. |

---

## 3. Xác nhận tính độc lập & Bảo mật

- **Không có circular dependencies:** `web_shared` hoàn toàn không import bất kỳ file nào từ `lyora_client` hay `lyora_admin`.
- **Không có backend secrets:** Toàn bộ file trong `web_shared` chỉ chứa các biến môi trường công khai của frontend (`VITE_*`). Toàn bộ database credentials và JWT secrets được cô lập tuyệt đối bên trong `lyora_backend`.

