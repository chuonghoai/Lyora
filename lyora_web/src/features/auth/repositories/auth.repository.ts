import {
  apiClient,
  CORE_CONSTANTS,
  type ApiResponse,
  type LoginResponseData,
  type UserProfile,
} from '@/core';
import type {
  LoginCredentials,
  OtpSentResponse,
  RegisterCredentials,
  ResetPasswordPayload,
  SendOtpPayload,
  VerifyForgotOtpPayload,
  VerifyForgotOtpResponse,
} from '../types/auth.types';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>>;
  register(credentials: RegisterCredentials): Promise<ApiResponse<LoginResponseData>>;
  sendRegisterOtp(payload: SendOtpPayload): Promise<ApiResponse<OtpSentResponse>>;
  sendForgotPasswordOtp(payload: SendOtpPayload): Promise<ApiResponse<OtpSentResponse>>;
  verifyForgotPasswordOtp(payload: VerifyForgotOtpPayload): Promise<ApiResponse<VerifyForgotOtpResponse>>;
  resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<{ success: boolean }>>;
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

  async sendRegisterOtp(payload: SendOtpPayload): Promise<ApiResponse<OtpSentResponse>> {
    return apiClient.post<ApiResponse<OtpSentResponse>, ApiResponse<OtpSentResponse>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_REGISTER_SEND_OTP,
      payload,
    );
  }

  async sendForgotPasswordOtp(payload: SendOtpPayload): Promise<ApiResponse<OtpSentResponse>> {
    return apiClient.post<ApiResponse<OtpSentResponse>, ApiResponse<OtpSentResponse>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_FORGOT_PASSWORD_SEND_OTP,
      payload,
    );
  }

  async verifyForgotPasswordOtp(
    payload: VerifyForgotOtpPayload,
  ): Promise<ApiResponse<VerifyForgotOtpResponse>> {
    return apiClient.post<ApiResponse<VerifyForgotOtpResponse>, ApiResponse<VerifyForgotOtpResponse>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_FORGOT_PASSWORD_VERIFY_OTP,
      payload,
    );
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<ApiResponse<{ success: boolean }>, ApiResponse<{ success: boolean }>>(
      CORE_CONSTANTS.API_ENDPOINTS.AUTH_FORGOT_PASSWORD_RESET,
      payload,
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
