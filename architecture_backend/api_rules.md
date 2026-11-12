# API Rules (Layer Responsibilities & Conventions)

## 1. Controller Layer (`*.controller.ts`)
**Nhiệm vụ:** Là cửa ngõ giao tiếp HTTP, tiếp nhận request và định tuyến.

**DO (Nên làm):**
- Sử dụng decorator `@Controller('endpoint')` và các HTTP methods (`@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`).
- Sử dụng DTO được định kiểu rõ ràng và bật xác thực dữ liệu qua `@UsePipes(new ValidationPipe({ whitelist: true }))` (hoặc cấu hình toàn cục).
- Trích xuất thông tin người dùng xác thực thông qua Custom Decorator `@CurrentUser()` hoặc `@Req() req.user`.
- Trích xuất tham số qua `@Param('id')`, `@Query()`, `@Body()`.
- Chỉ gọi duy nhất 1 (hoặc rất ít) method của Service tương ứng.
- Để Response Interceptor tự động bọc dữ liệu trả về theo chuẩn `ApiResponse<T>`.

**DON'T (Tuyệt đối KHÔNG):**
- **KHÔNG** chứa Business Logic trong Controller.
- **KHÔNG** inject hoặc gọi trực tiếp Repository, DB Query, hay Redis Client từ Controller.
- **KHÔNG** thao tác trực tiếp với đối tượng response thuần của Express (`res.status().json()`).

```typescript
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.createReport(dto, user.id);
  }

  @Get(':id')
  async getReportById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getReportById(id);
  }
}
```

---

## 2. Service Layer (`*.service.ts`)
**Nhiệm vụ:** Nơi chứa toàn bộ Business Logic và các quy tắc xử lý nghiệp vụ của hệ thống.

**DO:**
- Đánh dấu class bằng decorator `@Injectable()`.
- Xử lý tính toán, phân tích dữ liệu, kiểm tra ràng buộc nghiệp vụ.
- Giao tiếp với nhiều Repository (DB, Cache) để hoàn thành một use-case trọn vẹn.
- Quản lý Database Transactions (sử dụng `DataSource.transaction` của TypeORM hoặc `$transaction` của Prisma) đối với các thao tác ghi đa bảng để đảm bảo tính toàn vẹn (ACID).
- Ném ra các NestJS Built-in HttpExceptions phù hợp (như `BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`) với thông báo lỗi tiếng Việt rõ ràng, nhất quán.

**DON'T:**
- **KHÔNG** nhận hoặc thao tác trực tiếp với các object liên quan đến HTTP transport (như `Request`, `Response` của Express) trong Service.
- **KHÔNG** sử dụng logic đa ngôn ngữ phức tạp. Thông báo lỗi và message trả về dùng tiếng Việt thống nhất.

```typescript
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    private readonly dataSource: DataSource,
  ) {}

  async createReport(dto: CreateReportDto, userId: string): Promise<Report> {
    return this.dataSource.transaction(async (manager) => {
      const report = manager.create(Report, { ...dto, userId });
      return manager.save(report);
    });
  }
}
```

---

## 3. Data Access Layer (`Repository` / `Entity`)
**Nhiệm vụ:** Tương tác trực tiếp với cơ sở dữ liệu.

**DO:**
- Sử dụng TypeORM `@Entity()` và Repository pattern (`@InjectRepository()`) hoặc Prisma Client model queries.
- Sử dụng QueryBuilder cho các truy vấn phức tạp, lọc nhiều điều kiện.
- Định nghĩa quan hệ rõ ràng (`@ManyToOne`, `@OneToMany`) kèm theo chỉ mục (`@Index`) cho các trường khóa ngoại hoặc tìm kiếm thường xuyên.

**DON'T:**
- **KHÔNG** xử lý business logic trong repository.
- **KHÔNG** ném trực tiếp lỗi HTTP từ repository.

---

## 4. Push Notification Rules (WebSocket & FCM)

Khi Backend phát đi các thông báo thời gian thực qua WebSocket (Socket.IO) hoặc Firebase Cloud Messaging (FCM), phải tuân thủ đúng chuẩn format `Action Data`:
- Bắt buộc chứa `type` (Action Type định danh sự kiện).
- Bắt buộc chứa `payload` (JSON string hoặc object chứa ID/dữ liệu thực thể).

**WebSocket (`NotificationGateway` qua Socket.IO):**
```typescript
this.server.to(`user:${userId}`).emit('notification', {
  type: 'REPORT_DETAIL',
  payload: { reportId: report.id },
  title: 'Cập nhật trạng thái phản ánh',
  message: 'Phản ánh của bạn đã được tiếp nhận xử lý',
  createdAt: new Date().toISOString(),
});
```

---

## 5. Coding Convention Rules (TypeScript / NestJS)

**DO:**
- Đặt tên file theo chuẩn kebab-case của NestJS: `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.module.ts`, `create-<feature>.dto.ts`.
- Luôn khai báo kiểu dữ liệu trả về cho các hàm (ReturnType) và định nghĩa interface đầy đủ.
- Inject dependencies thông qua constructor với access modifier `private readonly`.

**DON'T:**
- **KHÔNG** sử dụng kiểu `any` bừa bãi.
- **KHÔNG** đặt secrets vào code hoặc shared library; luôn lấy từ `ConfigService`.
