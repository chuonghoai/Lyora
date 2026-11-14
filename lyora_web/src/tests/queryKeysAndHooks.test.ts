import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authKeys, systemKeys, userKeys } from '@/features';
import { AuthService } from '@/features/auth/services/auth.service';
import type { IAuthRepository } from '@/features/auth/repositories/auth.repository';

describe('Query Key Factories & Data Layer Hooks', () => {
  it('authKeys factory produces deterministic hierarchical query keys', () => {
    expect(authKeys.all).toEqual(['auth']);
    expect(authKeys.session()).toEqual(['auth', 'session']);
    expect(authKeys.profile()).toEqual(['auth', 'profile']);
  });

  it('systemKeys factory produces deterministic hierarchical query keys', () => {
    expect(systemKeys.all).toEqual(['system']);
    expect(systemKeys.health()).toEqual(['system', 'health']);
  });

  it('userKeys factory produces deterministic hierarchical query keys', () => {
    expect(userKeys.all).toEqual(['users']);
    expect(userKeys.profile()).toEqual(['users', 'profile']);
    expect(userKeys.detail('user-123')).toEqual(['users', 'detail', 'user-123']);
  });

  describe('AuthService & Mutation Interaction', () => {
    let mockRepo: IAuthRepository;
    let authService: AuthService;

    beforeEach(() => {
      mockRepo = {
        login: vi.fn().mockResolvedValue({
          data: {
            accessToken: 'mock-access',
            refreshToken: 'mock-refresh',
            user: {
              id: 'u-1',
              email: 'test@lyora.com',
              fullName: 'Test User',
              role: 'CLIENT',
            },
          },
        }),
        register: vi.fn(),
        sendRegisterOtp: vi.fn(),
        sendForgotPasswordOtp: vi.fn(),
        verifyForgotPasswordOtp: vi.fn(),
        resetPassword: vi.fn(),
        logout: vi.fn().mockResolvedValue({ data: null }),
        refreshToken: vi.fn(),
        getMe: vi.fn(),
      };
      authService = new AuthService(mockRepo);
    });

    it('successfully calls repository and saves session on login', async () => {
      const session = await authService.login({
        email: 'test@lyora.com',
        password: 'Password123!',
      });

      expect(mockRepo.login).toHaveBeenCalledWith({
        email: 'test@lyora.com',
        password: 'Password123!',
      });
      expect(session.accessToken).toBe('mock-access');
      expect(session.user.fullName).toBe('Test User');
    });

    it('handles logout gracefully through repository', async () => {
      await authService.logout();
      expect(authService.hasActiveSession()).toBe(false);
    });
  });
});
