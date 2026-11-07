# Development Workflow (API Lifecycle & NestJS Standards)

Tài liệu này hướng dẫn các bước tiêu chuẩn để khởi tạo mới một API hoặc sửa chữa logic trong hệ thống Backend NestJS (`lyora_backend`).

---

## 1. Quy trình 6 bước tạo mới API

### Bước 1: Khởi tạo Request / Response DTOs
- Đặt tại thư mục: `src/modules/<feature>/dto/` (ví dụ: `create-report.dto.ts`, `report-response.dto.ts`).
- Sử dụng các decorator từ `class-validator` và `class-transformer`:
  ```typescript
  import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

  export class CreateReportDto {
    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    @IsString()
    title: string;

    @IsNotEmpty({ message: 'Mô tả không được để trống' })
    @IsString()
    description: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;
  }
  ```

### Bước 2: Khởi tạo / Cập nhật Entity & Repository
- Đặt tại `src/modules/<feature>/entities/<feature>.entity.ts`.
- Khai báo các cột, kiểu dữ liệu, quan hệ (`@ManyToOne`, `@OneToMany`) và Index cần thiết.
- Đăng ký Entity vào `TypeOrmModule.forFeature([Report])` bên trong Feature Module.

### Bước 3: Triển khai Business Logic ở Service
- Viết logic vào class `<Feature>Service` (ví dụ `ReportsService`):
  - Đánh dấu class bằng `@Injectable()`.
  - Inject Repository và các Service phụ thuộc qua constructor.
  - Sử dụng Transaction nếu có nhiều thao tác ghi dữ liệu liên quan.
  - Kiểm tra điều kiện nghiệp vụ và ném ngoại lệ chuẩn của NestJS (`BadRequestException`, `NotFoundException`, `ForbiddenException`).

### Bước 4: Tạo Controller Endpoint
- Đặt tại `src/modules/<feature>/<feature>.controller.ts`:
  - Khai báo routing với `@Controller('<feature>')`.
  - Gắn Guards bảo vệ (`@UseGuards(JwtAuthGuard, RolesGuard)`).
  - Sử dụng DTO với Pipe xác thực: `@Body() dto: CreateReportDto`.
  - Trích xuất thông tin người dùng xác thực: `@CurrentUser() user: UserEntity`.
  - Gọi method tương ứng từ Service và trả về kết quả.

### Bước 5: Đăng ký vào Feature Module
- Gom nhóm Controller, Service, Entities vào `<feature>.module.ts`:
  ```typescript
  @Module({
    imports: [TypeOrmModule.forFeature([Report])],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
  })
  export class ReportsModule {}
  ```
- Import `<Feature>Module` vào `AppModule` (`src/app.module.ts`).

### Bước 6: Viết Test tự động (Testing)
- Viết Unit Test cho Service: `<feature>.service.spec.ts` (sử dụng Jest mocks).
- Viết E2E / Integration Test: `test/<feature>.e2e-spec.ts` (sử dụng Supertest).
- Chạy kiểm thử: `npm run backend:test`.

---

## 2. Quy trình xử lý lỗi và Fix Bug (Debugging Trace)

1. **Trace Request & Validation (Controller / DTO):** Kiểm tra request payload và `ValidationPipe`.
2. **Trace Service Logic:** Kiểm tra các điều kiện rẽ nhánh và exception.
3. **Trace Data Access (Repository / Database):** Kiểm tra câu lệnh SQL / Query ORM.
4. **Trace Redis / Cache & Session:** Kiểm tra key TTL và cấu trúc dữ liệu trong Redis.
