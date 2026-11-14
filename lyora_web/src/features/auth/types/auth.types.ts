import type { UserProfile } from '@/core';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
  otp: string;
}

export interface SendOtpPayload {
  email: string;
}

export interface OtpSentResponse {
  email: string;
  cooldownSeconds: number;
}

export interface VerifyForgotOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyForgotOtpResponse {
  resetToken: string;
}

export interface ResetPasswordPayload {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}
