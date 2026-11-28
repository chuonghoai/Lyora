import { apiClient, CORE_CONSTANTS, type ApiResponse, type UserProfile, type UserRole } from '@/core';
import type {
  AdminOnlineStatusResponse,
  AdminUserDetail,
  AdminUsersQueryParams,
  AdminUsersSummaryCounts,
  AdminUserSummaryItem,
  CreateAdminUserPayload,
  LockUserPayload,
  UpdateUserProfilePayload,
  UserStatistics,
} from '../types/user.types';

export interface IUserRepository {
  getProfile(): Promise<ApiResponse<UserProfile>>;
  updateProfile(payload: UpdateUserProfilePayload): Promise<ApiResponse<UserProfile>>;
  getStatistics(role?: UserRole): Promise<ApiResponse<UserStatistics>>;
  getAdminUsers(
    params: AdminUsersQueryParams,
  ): Promise<ApiResponse<{ items: AdminUserSummaryItem[]; summary: AdminUsersSummaryCounts }>>;
  getUsersOnlineStatus(ids: string[]): Promise<ApiResponse<AdminOnlineStatusResponse>>;
  getAdminUserDetail(userId: string): Promise<ApiResponse<AdminUserDetail>>;
  createUser(payload: CreateAdminUserPayload): Promise<ApiResponse<AdminUserSummaryItem>>;
  lockUser(userId: string, payload: LockUserPayload): Promise<ApiResponse<AdminUserSummaryItem>>;
  unlockUser(userId: string): Promise<ApiResponse<AdminUserSummaryItem>>;
}

export class UserRepository implements IUserRepository {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
    );
  }

  async updateProfile(payload: UpdateUserProfilePayload): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
      payload,
    );
  }

  async getStatistics(role?: UserRole): Promise<ApiResponse<UserStatistics>> {
    return apiClient.get<ApiResponse<UserStatistics>, ApiResponse<UserStatistics>>(
      CORE_CONSTANTS.API_ENDPOINTS.USERS_STATISTICS,
      role ? { params: { role } } : undefined,
    );
  }

  async getAdminUsers(
    params: AdminUsersQueryParams,
  ): Promise<ApiResponse<{ items: AdminUserSummaryItem[]; summary: AdminUsersSummaryCounts }>> {
    return apiClient.get<
      ApiResponse<{ items: AdminUserSummaryItem[]; summary: AdminUsersSummaryCounts }>,
      ApiResponse<{ items: AdminUserSummaryItem[]; summary: AdminUsersSummaryCounts }>
    >(CORE_CONSTANTS.API_ENDPOINTS.USERS, { params });
  }

  async getUsersOnlineStatus(ids: string[]): Promise<ApiResponse<AdminOnlineStatusResponse>> {
    return apiClient.get<
      ApiResponse<AdminOnlineStatusResponse>,
      ApiResponse<AdminOnlineStatusResponse>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.USERS}/online-status`, {
      params: { ids: ids.join(',') },
    });
  }

  async getAdminUserDetail(userId: string): Promise<ApiResponse<AdminUserDetail>> {
    return apiClient.get<ApiResponse<AdminUserDetail>, ApiResponse<AdminUserDetail>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.USERS}/${encodeURIComponent(userId)}/admin-profile`,
    );
  }

  async createUser(payload: CreateAdminUserPayload): Promise<ApiResponse<AdminUserSummaryItem>> {
    return apiClient.post<ApiResponse<AdminUserSummaryItem>, ApiResponse<AdminUserSummaryItem>>(
      CORE_CONSTANTS.API_ENDPOINTS.USERS,
      payload,
    );
  }

  async lockUser(
    userId: string,
    payload: LockUserPayload,
  ): Promise<ApiResponse<AdminUserSummaryItem>> {
    return apiClient.patch<
      ApiResponse<AdminUserSummaryItem>,
      ApiResponse<AdminUserSummaryItem>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.USERS}/${encodeURIComponent(userId)}/lock`,
      payload,
    );
  }

  async unlockUser(userId: string): Promise<ApiResponse<AdminUserSummaryItem>> {
    return apiClient.patch<
      ApiResponse<AdminUserSummaryItem>,
      ApiResponse<AdminUserSummaryItem>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.USERS}/${encodeURIComponent(userId)}/unlock`,
    );
  }
}

export const userRepository = new UserRepository();

