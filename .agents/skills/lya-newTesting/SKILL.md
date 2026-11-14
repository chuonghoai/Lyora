---
name: lya-newTesting
description: >-
  Quy chuẩn tạo file test trong Backend (lyora_backend) để mô phỏng tương tác từ Client/Admin (Realtime & API Integration Test) và chạy qua Jest runner.
---

# lya-newTesting

Mục đích: Quy định chuẩn hóa quy trình tạo file `*.integration.spec.ts` hoặc `*.e2e-spec.ts` trong Backend NestJS (`lyora_backend`) nhằm mô phỏng 100% hành vi thực tế của Client/Admin (kiểm thử luồng CSDL, WebSocket) và thực thi qua Jest runner.

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Workflow](../../rules/shared-workflow.md)

---

## Quy trình thực hiện (Workflow)

### Step 1 — Xác định kịch bản kiểm thử (Test Scenario & Actor)
1. Xác định Controller, API Endpoint và phương thức cần mô phỏng (ví dụ: `AuthController.login`, `UsersController.getProfile`).
2. Xác định Actor thực hiện hành động:
   - **Client** (User thông thường trên Cổng Client): Cần JWT Token chứa claim `userId` và role `CLIENT`.
   - **Admin** (Quản trị viên trên Cổng Admin): Cần JWT Token với role `ADMIN`.
   - **Anonymous / Guest**: Không kèm Authorization header.
3. Thu thập định dạng Payload thực tế:
   - Đọc Request DTO hoặc types từ `lyora_web/src/features/<feature>/types` để đảm bảo payload gửi trong test **100% giống với client thực tế**.

---

### Step 2 — Tạo file Test TypeScript trong Backend NestJS

1. **Vị trí file**: Đặt trong thư mục `lyora_backend/test/integration/` hoặc `lyora_backend/src/modules/<feature>/test/<feature>.integration.spec.ts`.
2. **Quy tắc Kiểm tra Backend Đang Chạy (Health Check)**:
   - Bắt buộc kiểm tra server backend (`http://localhost:3000` hoặc port cấu hình) đang hoạt động trước khi gửi request.
   - Nếu backend chưa chạy, in thông báo hướng dẫn developer khởi động backend bằng `npm run backend:dev` và dừng test ngay.
3. **Quy tắc Thực thi Test**:
   - Chỉ tạo **1 test block duy nhất** cho 1 nghiệp vụ mô phỏng, gọi API đúng **1 lần duy nhất**.
   - Chuẩn bị JWT bearer token hợp lệ với đầy đủ claims (`userId`, `role`, `email`) được ký bằng `JWT_SECRET`.
   - Gửi request qua `axios` hoặc `supertest` với payload JSON khớp 100% Client.
   - Assert HTTP Status 200/201 và response body.

**Mẫu code chuẩn (TypeScript / Jest):**
```typescript
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

describe('Simulate Action Test (Integration)', () => {
  const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
  const JWT_SECRET = process.env.JWT_SECRET || 'your-test-jwt-secret';

  beforeAll(async () => {
    try {
      await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
    } catch (error) {
      throw new Error(`[LỖI] Backend chưa chạy tại ${BASE_URL}! Vui lòng chạy backend (npm run backend:dev) trước khi test.`);
    }
  });

  it('Mô phỏng 1 Client thực hiện hành động ... (gọi API 1 lần duy nhất)', async () => {
    // 1. Tạo JWT Bearer Token hợp lệ
    const token = jwt.sign(
      {
        userId: 'u123',
        email: 'user@example.com',
        role: 'CLIENT',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Gửi Request qua Axios
    const payload = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const response = await axios.post(`${BASE_URL}/auth/login`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // 3. Assert
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('data');
  });
});
```

---

### Step 3 — Thực thi kiểm thử (Verification)

Chạy test thông qua npm script chuẩn của Monorepo:
```bash
npm run backend:test
```
Hoặc chỉ định file cụ thể:
```bash
npm run test --workspace=lyora_backend -- <path-to-spec-file>
```
Xác nhận test chạy thành công (`exitCode == 0`), log hiển thị chi tiết trên hệ thống.
