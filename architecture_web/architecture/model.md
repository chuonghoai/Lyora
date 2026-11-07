# Model & Type Definition Layer

Trong ứng dụng Web Client (ReactJS + TypeScript), Model Layer chịu trách nhiệm định nghĩa cấu trúc dữ liệu, các kiểu dữ liệu (Types/Interfaces), DTOs (Data Transfer Objects), và Zod Schemas để xác thực runtime.

## Trách nhiệm của Model / Type Layer

1. **Định nghĩa Request & Response DTOs:** Mô tả chính xác dữ liệu gửi lên và nhận về từ Backend NestJS (ví dụ: `LoginRequestDto`, `ReportResponseDto`, `ApiResponse<T>`).
2. **Định nghĩa Domain Entities:** Mô tả thực thể nghiệp vụ cốt lõi (ví dụ: `User`, `Report`, `NotificationItem`).
3. **Định nghĩa Enums & Constants:** Chứa các trạng thái hữu hạn của hệ thống (ví dụ: `ReportStatus`, `Role`, `NotificationType`).
4. **Zod Schemas (Runtime Validation):** Sử dụng `zod` để định nghĩa schema xác thực form và tự động suy luận kiểu dữ liệu (`z.infer<typeof schema>`).

## Cấu trúc mẫu chuẩn

### 1. Định nghĩa Interface & DTO
```typescript
// src/features/reports/types/report.types.ts
export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequestDto {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  images?: File[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}
```

### 2. Định nghĩa Zod Schema cho Form Validation
```typescript
// src/features/reports/schemas/report.schema.ts
import { z } from 'zod';

export const createReportSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(100),
  description: z.string().min(10, 'Mô tả chi tiết phải có ít nhất 10 ký tự'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CreateReportFormData = z.infer<typeof createReportSchema>;
```

## Quy tắc quan trọng

- **Bắt buộc tái sử dụng Model/Type:** Nếu một type tương tự hoặc giống hệt đã tồn tại (ví dụ `User` trong `@/types/user.ts`), phải import tái sử dụng, KHÔNG tạo duplicate type trong feature mới.
- **Đồng bộ hóa với Backend NestJS:** Cấu trúc DTO của frontend phải khớp 100% với DTO của backend (cùng tên field, kiểu dữ liệu, định dạng ISO date string, hỗ trợ nullable).
- **Tránh dùng `any`:** Mọi biến, tham số API, response payload đều phải được định kiểu tường minh với TypeScript (`strict: true`). Dùng `unknown` thay vì `any` nếu dữ liệu thực sự chưa rõ ràng trước khi validate.
