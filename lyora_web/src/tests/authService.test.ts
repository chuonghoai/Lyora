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
      sendRegisterOtp: vi.fn().mockResolvedValue({
        success: true,
        data: { email: 'reg@lyora.com', cooldownSeconds: 60 },
      }),
      sendForgotPasswordOtp: vi.fn().mockResolvedValue({
        success: true,
        data: { email: 'test@lyora.com', cooldownSeconds: 60 },
      }),
      verifyForgotPasswordOtp: vi.fn().mockResolvedValue({
        success: true,
        data: { resetToken: 'mock_reset_token' },
      }),
      resetPassword: vi.fn().mockResolvedValue({
        success: true,
        data: { success: true },
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
      otp: '123456',
    });

    expect(session.accessToken).toBe('reg_access_jwt');
    expect(TokenStorage.getUser()?.fullName).toBe('Registered User');
  });

  it('should send register OTP via sendRegisterOtp()', async () => {
    const res = await authService.sendRegisterOtp({ email: 'reg@lyora.com' });
    expect(res.cooldownSeconds).toBe(60);
    expect(mockRepository.sendRegisterOtp).toHaveBeenCalledWith({ email: 'reg@lyora.com' });
  });

  it('should send forgot password OTP via sendForgotPasswordOtp()', async () => {
    const res = await authService.sendForgotPasswordOtp({ email: 'test@lyora.com' });
    expect(res.cooldownSeconds).toBe(60);
    expect(mockRepository.sendForgotPasswordOtp).toHaveBeenCalledWith({ email: 'test@lyora.com' });
  });

  it('should verify forgot password OTP and return resetToken', async () => {
    const res = await authService.verifyForgotPasswordOtp({
      email: 'test@lyora.com',
      otp: '123456',
    });
    expect(res.resetToken).toBe('mock_reset_token');
    expect(mockRepository.verifyForgotPasswordOtp).toHaveBeenCalledWith({
      email: 'test@lyora.com',
      otp: '123456',
    });
  });

  it('should reset password via resetPassword()', async () => {
    await authService.resetPassword({
      email: 'test@lyora.com',
      resetToken: 'mock_reset_token',
      newPassword: 'newPassword123',
    });
    expect(mockRepository.resetPassword).toHaveBeenCalledWith({
      email: 'test@lyora.com',
      resetToken: 'mock_reset_token',
      newPassword: 'newPassword123',
    });
  });

  it('should clear session on logout()', async () => {
    await authService.login({
      email: 'test@lyora.com',
      password: 'password123',
    });
    expect(authService.hasActiveSession()).toBe(true);

    await authService.logout();
    expect(mockRepository.logout).toHaveBeenCalledTimes(1);
    expect(authService.hasActiveSession()).toBe(false);
    expect(TokenStorage.getAccessToken()).toBeNull();
  });

  it('should still clear local session when logout API fails', async () => {
    await authService.login({
      email: 'test@lyora.com',
      password: 'password123',
    });
    vi.mocked(mockRepository.logout).mockRejectedValueOnce(new Error('Network error'));

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(authService.hasActiveSession()).toBe(false);
    expect(TokenStorage.getAccessToken()).toBeNull();
  });
});
