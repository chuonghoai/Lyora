# Push Notification Architecture Rules (WebSocket & Web Push)

Khi triển khai tính năng thông báo thời gian thực (Realtime Notification) qua WebSocket (Socket.IO) hoặc Web Push Notification trên ứng dụng Web ReactJS, bắt buộc tuân thủ các quy tắc sau để đảm bảo Clean Architecture và SOLID:

## 1. Action Data Format (Chuẩn hóa Payload)
Backend NestJS và Web Client phải luôn trao đổi notification payload theo một chuẩn `Action Data` chung:
- Bắt buộc chứa `type` (Action Type định danh loại sự kiện).
- Bắt buộc chứa `payload` (Data object chứa thông tin định danh của thực thể liên quan).

**Ví dụ:**
```json
{
  "type": "REPORT_DETAIL",
  "payload": {
    "reportId": "12345-abcde"
  }
}
```

## 2. Notification Action Router (Client Routing)
Tất cả các logic điều hướng hoặc xử lý khi user click vào một thông báo (từ In-App Toast, Web Notification, hoặc Notification Center) đều phải đi qua `notificationActionRouter`.

- **KHÔNG hardcode** việc check ID (`if (reportId)`) rải rác trong các file socket listener hoặc UI component.
- Khi nhận được raw event từ WebSocket, hệ thống phải map về đối tượng `NotificationAction` và chuyển tiếp cho `notificationActionRouter.handle(action, navigate)`:
  ```typescript
  // src/core/notifications/notificationActionRouter.ts
  import type { NavigateFunction } from 'react-router-dom';

  export interface NotificationAction {
    type: 'REPORT_DETAIL' | 'SYSTEM_ALERT' | 'USER_VERIFIED';
    payload: Record<string, any>;
  }

  export const notificationActionRouter = {
    handle(action: NotificationAction, navigate: NavigateFunction) {
      switch (action.type) {
        case 'REPORT_DETAIL':
          navigate(`/reports/${action.payload.reportId}`);
          break;
        case 'SYSTEM_ALERT':
          navigate('/alerts');
          break;
        default:
          console.warn(`[NotificationRouter] Unhandled action type: ${action.type}`);
      }
    },
  };
  ```

## 3. Separation of Concerns (WebSocket Connection)
- Việc khởi tạo kết nối WebSocket (Socket.IO client) và đăng ký lắng nghe sự kiện (`socket.on('notification', ...)`) phải đặt ở một service hoặc hook riêng biệt (ví dụ: `src/core/socket/notificationSocket.ts` hoặc `useNotificationSocket.ts`).
- **KHÔNG** đặt logic kết nối WebSocket trực tiếp vào bên trong các Presentation Components.
- Khi có sự kiện thông báo mới:
  1. Tăng biến đếm chưa đọc (`useNotificationStore.getState().incrementUnread()`).
  2. Kích hoạt TanStack Query làm mới dữ liệu liên quan (`queryClient.invalidateQueries({ queryKey: ['notifications'] })`).
  3. Hiển thị In-App Toast thông báo với action click dẫn tới `notificationActionRouter`.

## 4. Trách nhiệm của Infrastructure / Providers
- Các file khởi tạo ứng dụng (như `App.tsx` hoặc `SocketProvider.tsx`):
  - Chịu trách nhiệm quản lý vòng đời kết nối WebSocket theo trạng thái đăng nhập (`isAuthenticated`).
  - Tự động ngắt kết nối khi user logout hoặc unmount.
  - **Tuyệt đối KHÔNG** import các đường dẫn trang hoặc xử lý navigation trực tiếp tại tầng kết nối hạ tầng.
