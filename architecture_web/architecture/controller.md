# UI Controller Layer (Custom Hooks)

Trong dự án ReactJS Web Client, vai trò **UI Controller** được hiện thực hóa dưới dạng các **Custom Hooks chuyên trách** (ví dụ: `useHomeController.ts`, `useLoginController.ts`, `useSettingsController.ts`).

## Trách nhiệm (Responsibility)
- Quản lý **Local UI State** (ví dụ: cờ `isModalOpen`, error message tạm thời, active tab, bộ lọc client-side).
- Đóng gói và điều phối các hành động từ người dùng (sự kiện click button, submit form, trigger refresh).
- Kết nối giữa UI Component và tầng dữ liệu (gọi TanStack Query hooks, Zustand actions hoặc API Services).
- Giữ cho Component (TSX) ở trạng thái "nguyên tử và hiển thị" (declarative UI), không bị nhồi nhét hàng chục hàm xử lý logic hay state vụn vặt.

## Cấu trúc chuẩn của một UI Controller Hook

```typescript
// src/features/reports/hooks/useReportController.ts
import { useState, useCallback } from 'react';
import { useReportsQuery, useCreateReportMutation } from './useReportQueries';
import { useNotificationStore } from '@/features/notifications/store';
import type { CreateReportDto } from '../types';

export function useReportController() {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const { data: reports, isLoading, isError, refetch } = useReportsQuery(selectedFilter);
  const createMutation = useCreateReportMutation();

  const handleOpenDialog = useCallback(() => setIsDialogOpen(true), []);
  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleCreateReport = useCallback(async (dto: CreateReportDto) => {
    try {
      await createMutation.mutateAsync(dto);
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling UI feedback
    }
  }, [createMutation]);

  return {
    state: {
      reports: reports ?? [],
      isLoading,
      isError,
      isSubmitting: createMutation.isPending,
      selectedFilter,
      isDialogOpen,
    },
    actions: {
      setSelectedFilter,
      handleOpenDialog,
      handleCloseDialog,
      handleCreateReport,
      refresh: refetch,
    },
  };
}
```

## Quy tắc DO / DON'T

**DO:**
- Đặt tên hook theo chuẩn `use<Feature>Controller` hoặc `use<ScreenName>`.
- Trả về đối tượng có cấu trúc rõ ràng (thường chia thành `{ state, actions }` hoặc explicit properties) để component dễ destructure.
- Sử dụng `useCallback` hoặc `useMemo` cho các hàm xử lý truyền sâu xuống nhiều cấp component con.
- Sử dụng React Hook Form (`useForm`) bên trong Controller hook hoặc form component chuyên biệt để quản lý form validation.

**DON'T:**
- **KHÔNG** gọi trực tiếp HTTP Client (`apiClient.get(...)`) bên trong Controller hook mà phải thông qua Service/Query hook.
- **KHÔNG** render hoặc trả về JSX/HTML từ Controller hook. Controller chỉ xử lý logic và cung cấp state/handler.
- **KHÔNG** duplicate server cache vào `useState` cục bộ nếu dữ liệu đã được TanStack Query quản lý.
- **KHÔNG** nhét toàn bộ logic của cả ứng dụng vào một hook khổng lồ. Hãy chia nhỏ theo từng màn hình hoặc tính năng cụ thể.
