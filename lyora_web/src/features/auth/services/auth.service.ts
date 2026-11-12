import { TokenStorage } from '@/core';
import { authRepository, type IAuthRepository } from '../repositories/auth.repository';
import type { LoginCredentials, RegisterCredentials, AuthSession } from '../types/auth.types';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<AuthSession>;
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

    // Save tokens and profile in Core storage
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

  async logout(): Promise<void> {
    try {
      if (TokenStorage.hasToken()) {
        await this.repository.logout();
      }
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

