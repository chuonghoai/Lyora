import { apiClient, CORE_CONSTANTS, type ApiResponse, type UserProfile } from '@/core';

export interface IUserRepository {
  getProfile(): Promise<ApiResponse<UserProfile>>;
}

export class UserRepository implements IUserRepository {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
    );
  }
}

export const userRepository = new UserRepository();

