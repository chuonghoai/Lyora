import { apiClient, CORE_CONSTANTS, type ApiResponse, type UserProfile } from '@/core';
import type { UpdateUserProfilePayload } from '../types/user.types';

export interface BackendFriendSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface IProfileRepository {
  getMyProfile(): Promise<ApiResponse<UserProfile>>;
  updateMyProfile(payload: UpdateUserProfilePayload): Promise<ApiResponse<UserProfile>>;
  getAcceptedFriends(): Promise<ApiResponse<BackendFriendSummary[]>>;
}

export class ProfileRepository implements IProfileRepository {
  async getMyProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
    );
  }

  async updateMyProfile(payload: UpdateUserProfilePayload): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
      payload,
    );
  }

  async getAcceptedFriends(): Promise<ApiResponse<BackendFriendSummary[]>> {
    return apiClient.get<ApiResponse<BackendFriendSummary[]>, ApiResponse<BackendFriendSummary[]>>(
      CORE_CONSTANTS.API_ENDPOINTS.FRIENDS,
    );
  }
}

export const profileRepository = new ProfileRepository();
