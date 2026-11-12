import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '@/features/auth/services/auth.service';
import type { IAuthRepository } from '@/features/auth/repositories/auth.repository';
import { TokenStorage } from '@/core';

describe('AuthService (Data Layer)', () => {
  let mockRepository: IAuthRepository;
  let authService: AuthService;

  beforeEach(() => {
    TokenStorage.clearAuth();

    mockRepository = {
      login: vi.fn().mockResolvedValue({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'mock_access_jwt',
          refreshToken: 'mock_refresh_jwt',
          user: {
            id: 'u-1',
            email: 'test@lyora.com',
            fullName: 'Test User',
            role: 'CLIENT',
          },
        },
      }),
      register: vi.fn().mockResolvedValue({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          accessToken: 'reg_access_jwt',
          refreshToken: 'reg_refresh_jwt',
          user: {
            id: 'u-2',
            email: 'reg@lyora.com',
            fullName: 'Registered User',
            role: 'CLIENT',
          },
        },
      }),
      refreshToken: vi.fn(),
      logout: vi.fn().mockResolvedValue({
        success: true,
        data: { loggedOut: true },
      }),
      getMe: vi.fn(),
    };

    authService = new AuthService(mockRepository);
  });

  it('should authenticate and store session data on login()', async () => {
    const session = await authService.login({
      email: 'test@lyora.com',
      password: 'password123',
    });

    expect(session.accessToken).toBe('mock_access_jwt');
    expect(session.user.email).toBe('test@lyora.com');
    expect(TokenStorage.getAccessToken()).toBe('mock_access_jwt');
    expect(authService.hasActiveSession()).toBe(true);
  });

  it('should register and store session data on register()', async () => {
    const session = await authService.register({
      email: 'reg@lyora.com',
      password: 'password123',
      fullName: 'Registered User',
    });

    expect(session.accessToken).toBe('reg_access_jwt');
    expect(TokenStorage.getUser()?.fullName).toBe('Registered User');
  });

  it('should clear session on logout()', async () => {
    await authService.login({
      email: 'test@lyora.com',
      password: 'password123',
    });
    expect(authService.hasActiveSession()).toBe(true);

    await authService.logout();
    expect(authService.hasActiveSession()).toBe(false);
    expect(TokenStorage.getAccessToken()).toBeNull();
  });
});

