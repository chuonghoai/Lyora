# Service & API Client Layer

Trong hệ thống Web Client của Lyora, tầng kết nối API và HTTP Client được quản lý tập trung thông qua thư viện dùng chung **`@lyora/web-shared`**, giúp `lyora_client` và `lyora_admin` đồng nhất hoàn toàn cơ chế gọi API tới Backend NestJS (`lyora_backend`).

---

## 1. HTTP Client dùng chung (`@lyora/web-shared/apiClient`)

- **Vị trí gốc:** `lyora_web_shared/src/api/apiClient.ts`.
- **Trách nhiệm:**
  - Khởi tạo Axios instance tập trung với cấu hình mặc định (`timeout: 15000`, `Content-Type: application/json`).
  - **Request Interceptor:** Tự động lấy JWT token từ `localStorage.getItem('lyora_token')` và đính kèm vào header `Authorization: Bearer <token>`.
  - **Response Interceptor:** Trích xuất trực tiếp `response.data`. Nếu xảy ra lỗi mạng hoặc HTTP error (401, 403, 500), chuẩn hóa lỗi thành đối tượng `ApiError` có kiểu dữ liệu rõ ràng.

```typescript
// Sử dụng trong lyora_client hoặc lyora_admin
import { apiClient, type ApiResponse, type ApiError } from '@lyora/web-shared';
```

---

## 2. Feature Service Layer (Từng ứng dụng riêng biệt)

- **Vị trí:** `lyora_client/src/features/<feature>/services/` hoặc `lyora_admin/src/features/<feature>/services/`.
- **Trách nhiệm:**
  - Chứa các hàm API đặc thù của từng ứng dụng (ví dụ: Client gọi API tạo phản ánh, Admin gọi API phê duyệt và phân công xử lý).
  - Trả về Promise có kiểu dữ liệu rõ ràng (`Promise<ApiResponse<T>>`).
  - **Stateless:** Các file service là pure TypeScript module, **TUYỆT ĐỐI KHÔNG** lưu trữ state bên trong Service.

```typescript
// lyora_client/src/features/reports/services/reportService.ts
import { apiClient, type ApiResponse } from '@lyora/web-shared';
import type { ReportItem, CreateReportDto } from '../types';

export const reportService = {
  async getReports(params?: { status?: string }): Promise<ApiResponse<ReportItem[]>> {
    return apiClient.get('/reports', { params });
  },

  async createReport(dto: CreateReportDto): Promise<ApiResponse<ReportItem>> {
    return apiClient.post('/reports', dto);
  },
};
```

---

## 3. Quy tắc DO / DON'T

**DO:**
- Tái sử dụng `apiClient` từ `@lyora/web-shared` cho mọi tác vụ kết nối mạng.
- Định nghĩa kiểu dữ liệu trả về cho tất cả các hàm API (`Promise<ApiResponse<T>>`).
- Sử dụng TanStack Query (`useQuery`, `useMutation`) trong UI Controller hook để gọi Service.

**DON'T:**
- **KHÔNG** tự tạo thêm một Axios instance riêng biệt trong `lyora_client` hoặc `lyora_admin` nếu không có lý do đặc biệt.
- **KHÔNG** đưa API nghiệp vụ riêng của Client vào Admin hoặc ngược lại.
- **KHÔNG** nhúng các header i18n phức tạp vì hệ thống sử dụng một ngôn ngữ thống nhất.
