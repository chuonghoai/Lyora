# Realtime & Notification Architecture (`lyora_web/src/core/websocket`)

Khi triển khai tính năng giao tiếp thời gian thực (Realtime Notification, Events) qua WebSocket trong `lyora_web`, bắt buộc tuân thủ các quy tắc dưới đây.

---

## 1. Vị Trí Hạ Tầng: Core Layer

Toàn bộ logic kết nối WebSocket nằm tập trung trong `src/core/websocket/`:
- **`WebSocketService.ts`:** Singleton quản lý vòng đời kết nối socket, tự động reconnect với exponential backoff, heartbeat/ping-pong, và Event Listener Registry.
- **`websocketStore.ts`:** Zustand store theo dõi trạng thái kết nối (`isConnected`, `transport`, `latency`, `error`).

---

## 2. Chuẩn Hóa Payload (Action Data Format)

Khi Backend NestJS phát sự kiện realtime tới Web Client, payload bắt buộc tuân thủ cấu trúc chuẩn:
- `type`: Định danh loại sự kiện.
- `payload`: Dữ liệu đính kèm (Object hoặc JSON string).
- `timestamp`: Thời gian phát sinh sự kiện.

```json
{
  "type": "ORDER_COMPLETED",
  "payload": {
    "orderId": "ord-12345",
    "licenseKey": "XXXX-YYYY-ZZZZ"
  },
  "timestamp": "2026-11-12T05:30:00.000Z"
}
```

---

## 3. Quy Tắc Tích Hợp UI & Controller

- **KHÔNG** kết nối socket trực tiếp trong Presentation Component (TSX).
- UI Controller lắng nghe sự kiện thông qua `WebSocketService.getInstance().on(event, handler)` và hủy đăng ký (unsubscribe) khi component unmount.
- Khi nhận được sự kiện realtime:
  1. Hiển thị thông báo tức thời qua `toast.info(...)` hoặc `toast.success(...)`.
  2. Kích hoạt TanStack Query làm mới dữ liệu liên quan thông qua Query Key Factory:
     ```typescript
     queryClient.invalidateQueries({ queryKey: authKeys.session() });
     ```
