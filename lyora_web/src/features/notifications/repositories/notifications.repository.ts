import { apiClient, CORE_CONSTANTS, type ApiResponse } from "@/core";
import type { AppNotification } from "../types/notification.types";

export class NotificationsRepository {
  getMine(): Promise<ApiResponse<AppNotification[]>> {
    return apiClient.get<
      ApiResponse<AppNotification[]>,
      ApiResponse<AppNotification[]>
    >(CORE_CONSTANTS.API_ENDPOINTS.NOTIFICATIONS);
  }

  markRead(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch<ApiResponse<void>, ApiResponse<void>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.NOTIFICATIONS}/${encodeURIComponent(id)}/read`,
    );
  }

  markAllRead(): Promise<ApiResponse<void>> {
    return apiClient.patch<ApiResponse<void>, ApiResponse<void>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.NOTIFICATIONS}/read-all`,
    );
  }
}

export const notificationsRepository = new NotificationsRepository();
