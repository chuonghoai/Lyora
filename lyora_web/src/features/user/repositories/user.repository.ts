import { apiClient, CORE_CONSTANTS, type ApiResponse, type UserProfile } from '@/core';
import type { UserStatistics } from '../types/user.types';

export interface IUserRepository {
  getProfile(): Promise<ApiResponse<UserProfile>>;
  getStatistics(): Promise<ApiResponse<UserStatistics>>;
}

export class UserRepository implements IUserRepository {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
    );
  }

  async getStatistics(): Promise<ApiResponse<UserStatistics>> {
    return apiClient.get<ApiResponse<UserStatistics>, ApiResponse<UserStatistics>>(
      CORE_CONSTANTS.API_ENDPOINTS.USERS_STATISTICS,
    );
  }
}

export const userRepository = new UserRepository();

