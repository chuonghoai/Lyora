import {
  apiClient,
  CORE_CONSTANTS,
  type ApiResponse,
  type LoginResponseData,
  type UserProfile,
} from '@/core';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>>;
  register(credentials: RegisterCredentials): Promise<ApiResponse<LoginResponseData>>;
  refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponseData>>;
  logout(): Promise<ApiResponse<{ loggedOut: boolean }>>;
  getMe(): Promise<ApiResponse<UserProfile>>;
}

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    return apiClient.post<ApiResponse<LoginResponseData>, ApiResponse<LoginResponseData>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_LOGIN,
      credentials,
    );
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<LoginResponseData>> {
    return apiClient.post<ApiResponse<LoginResponseData>, ApiResponse<LoginResponseData>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_REGISTER,
      credentials,
    );
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponseData>> {
    return apiClient.post<ApiResponse<LoginResponseData>, ApiResponse<LoginResponseData>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_REFRESH,
      { refreshToken },
    );
  }

  async logout(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    return apiClient.post<ApiResponse<{ loggedOut: boolean }>, ApiResponse<{ loggedOut: boolean }>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_LOGOUT,
    );
  }

  async getMe(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_ME,
    );
  }
}

export const authRepository = new AuthRepository();

