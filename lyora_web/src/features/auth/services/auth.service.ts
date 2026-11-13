import { logger, TokenStorage } from '@/core';
import { authRepository, type IAuthRepository } from '../repositories/auth.repository';
import type {
  AuthSession,
  LoginCredentials,
  OtpSentResponse,
  RegisterCredentials,
  ResetPasswordPayload,
  SendOtpPayload,
  VerifyForgotOtpPayload,
  VerifyForgotOtpResponse,
} from '../types/auth.types';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<AuthSession>;
  sendRegisterOtp(payload: SendOtpPayload): Promise<OtpSentResponse>;
  sendForgotPasswordOtp(payload: SendOtpPayload): Promise<OtpSentResponse>;
  verifyForgotPasswordOtp(payload: VerifyForgotOtpPayload): Promise<VerifyForgotOtpResponse>;
  resetPassword(payload: ResetPasswordPayload): Promise<void>;
  logout(): Promise<void>;
  getCurrentSession(): AuthSession | null;
  hasActiveSession(): boolean;
}

export class AuthService implements IAuthService {
  private repository: IAuthRepository;

  constructor(repository: IAuthRepository = authRepository) {
    this.repository = repository;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await this.repository.login(credentials);
    const { accessToken, refreshToken, user } = response.data;

    TokenStorage.saveAuthSession(accessToken, refreshToken, user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const response = await this.repository.register(credentials);
    const { accessToken, refreshToken, user } = response.data;

    TokenStorage.saveAuthSession(accessToken, refreshToken, user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async sendRegisterOtp(payload: SendOtpPayload): Promise<OtpSentResponse> {
    const response = await this.repository.sendRegisterOtp(payload);
    return response.data;
  }

  async sendForgotPasswordOtp(payload: SendOtpPayload): Promise<OtpSentResponse> {
    const response = await this.repository.sendForgotPasswordOtp(payload);
    return response.data;
  }

  async verifyForgotPasswordOtp(
    payload: VerifyForgotOtpPayload,
  ): Promise<VerifyForgotOtpResponse> {
    const response = await this.repository.verifyForgotPasswordOtp(payload);
    return response.data;
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await this.repository.resetPassword(payload);
  }

  async logout(): Promise<void> {
    try {
      if (TokenStorage.hasToken()) {
        await this.repository.logout();
      }
    } catch (err) {
      logger.warn('AuthService', 'Logout API request failed, clearing local session.', err);
    } finally {
      TokenStorage.clearAuth();
    }
  }

  getCurrentSession(): AuthSession | null {
    const accessToken = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();
    const user = TokenStorage.getUser();

    if (!accessToken || !refreshToken || !user) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  hasActiveSession(): boolean {
    return TokenStorage.hasToken();
  }
}

export const authService = new AuthService();
