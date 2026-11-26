import { apiClient, CORE_CONSTANTS, type ApiResponse, type UserProfile } from '@/core';
import type {
  ProfileMediaUploadResult,
  PublicUserProfile,
  UpdateExtendedProfilePayload,
} from '../types/user.types';

export interface BackendFriendSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface IProfileRepository {
  getMyProfile(): Promise<ApiResponse<PublicUserProfile | UserProfile>>;
  getPublicProfile?(userId: string): Promise<ApiResponse<PublicUserProfile>>;
  updateMyProfile(
    payload: UpdateExtendedProfilePayload,
  ): Promise<ApiResponse<PublicUserProfile | UserProfile>>;
  uploadProfileMedia?(file: File): Promise<ApiResponse<ProfileMediaUploadResult>>;
  getAcceptedFriends(): Promise<ApiResponse<BackendFriendSummary[]>>;
}

export class ProfileRepository implements IProfileRepository {
  async getMyProfile(): Promise<ApiResponse<PublicUserProfile | UserProfile>> {
    return apiClient.get<
      ApiResponse<PublicUserProfile | UserProfile>,
      ApiResponse<PublicUserProfile | UserProfile>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.USERS}/me/profile`);
  }

  async getPublicProfile(userId: string): Promise<ApiResponse<PublicUserProfile>> {
    return apiClient.get<ApiResponse<PublicUserProfile>, ApiResponse<PublicUserProfile>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.USERS}/${encodeURIComponent(userId)}/profile`,
    );
  }

  async updateMyProfile(
    payload: UpdateExtendedProfilePayload,
  ): Promise<ApiResponse<PublicUserProfile | UserProfile>> {
    return apiClient.patch<
      ApiResponse<PublicUserProfile | UserProfile>,
      ApiResponse<PublicUserProfile | UserProfile>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.USERS}/me/profile`, payload);
  }

  async uploadProfileMedia(file: File): Promise<ApiResponse<ProfileMediaUploadResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<
      ApiResponse<ProfileMediaUploadResult>,
      ApiResponse<ProfileMediaUploadResult>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.USERS}/me/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  }

  async getAcceptedFriends(): Promise<ApiResponse<BackendFriendSummary[]>> {
    return apiClient.get<ApiResponse<BackendFriendSummary[]>, ApiResponse<BackendFriendSummary[]>>(
      CORE_CONSTANTS.API_ENDPOINTS.FRIENDS,
    );
  }
}

export const profileRepository = new ProfileRepository();
