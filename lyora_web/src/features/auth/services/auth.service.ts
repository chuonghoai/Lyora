import { isApiError, logger, TokenStorage } from '@/core';
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
  refreshSession(force?: boolean): Promise<AuthSession | null>;
  logout(): Promise<void>;
  getCurrentSession(): AuthSession | null;
  hasActiveSession(): boolean;
}

const REFRESH_COOLDOWN_MS = 5000;

export class AuthService implements IAuthService {
  private repository: IAuthRepository;
  private refreshInFlight: Promise<AuthSession | null> | null = null;
  private lastRefreshAt = 0;

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

  async refreshSession(force: boolean = false): Promise<AuthSession | null> {
    const refreshToken = TokenStorage.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const now = Date.now();
    if (!force && now - this.lastRefreshAt < REFRESH_COOLDOWN_MS) {
      return this.getCurrentSession();
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = (async () => {
      try {
        const response = await this.repository.refreshToken(refreshToken);
        const { accessToken, refreshToken: nextRefreshToken, user } = response.data;
        const resolvedRefresh = nextRefreshToken || refreshToken;
        TokenStorage.saveAuthSession(accessToken, resolvedRefresh, user);
        this.lastRefreshAt = Date.now();

        return {
          accessToken,
          refreshToken: resolvedRefresh,
          user,
        };
      } catch (err) {
        if (isApiError(err) && (err.statusCode === 401 || err.statusCode === 403)) {
          TokenStorage.clearAuth();
          return null;
        }
        logger.warn('AuthService', 'Silent token refresh deferred due to network/server unavailability.', err);
        return this.getCurrentSession();
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
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
