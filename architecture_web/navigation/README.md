# Quy tắc Điều Hướng (Navigation / React Router)

Cả hai ứng dụng Web Frontend (`lyora_client` và `lyora_admin`) đều sử dụng thư viện `react-router-dom` để quản lý định tuyến độc lập. Mỗi ứng dụng quản lý cây routing và hằng số đường dẫn riêng biệt.

---

## 1. Tính độc lập giữa Client và Admin

- `lyora_client` quản lý các route dành cho người dùng công cộng (Trang chủ, Gửi phản ánh, Theo dõi sự cố, Đăng nhập cư dân).
- `lyora_admin` quản lý các route dành cho quản trị viên (Bảng điều khiển Analytics, Danh sách phản ánh, Phân công xử lý, Cấu hình hệ thống).
- **Ranh giới:** Hai ứng dụng chạy trên hai cổng/tên miền riêng biệt (ví dụ: Client port 5173, Admin port 5174). Không import file routing của ứng dụng này vào ứng dụng kia.

---

## 2. Quy tắc triển khai đường dẫn (Route Path Rules)

### 1. Không hardcode chuỗi URL
- Mọi đường dẫn của ứng dụng phải được định nghĩa tập trung tại file `src/routes/paths.ts` của ứng dụng đó:
  ```typescript
  // lyora_client/src/routes/paths.ts
  export const ROUTES = {
    ROOT: '/',
    REPORTS: '/reports',
    CREATE_REPORT: '/reports/new',
    REPORT_DETAIL: (id: string | number) => `/reports/${id}`,
  } as const;
  ```
- Khi cần điều hướng, luôn import `ROUTES` để sử dụng: `navigate(ROUTES.REPORT_DETAIL(reportId))`.

### 2. Cấu trúc Route tập trung
- Khai báo cấu trúc các route tại `src/routes/AppRoutes.tsx` kết hợp với Layout wrappers (`<Outlet />`):
  ```tsx
  export const router = createBrowserRouter([
    {
      path: ROUTES.ROOT,
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: ROUTES.REPORTS, element: <ReportsPage /> },
      ],
    },
  ]);
  ```
- Chỉ khi một route mới được cấu hình đầy đủ trong `paths.ts` và `AppRoutes.tsx` thì mới được coi là hoàn thiện việc đăng ký route.
