import { describe, expect, it, vi, beforeEach } from 'vitest';
import { type ApiError, sessionStorageService, localStorageService } from '@/core';
import { TokenStorage } from '@/core/storage/tokenStorage';
import { resolveRoleAccess } from '@/core/guards/RoleRoute';
import { SystemService } from '@/features/system/services/system.service';
import type { ISystemRepository } from '@/features/system/repositories/system.repository';
import { PostService, type IPostRepository } from '@/features/posts';
import { ProfileService, type IProfileRepository } from '@/features/user';
import { ROUTES } from '@/routes/paths';

describe('Empty, Error States & Real Failure Propagation', () => {
  beforeEach(() => {
    TokenStorage.clearAuth();
  });

  it('SystemService propagates /health network errors instead of returning fake offline success', async () => {
    const networkError: ApiError = {
      statusCode: 0,
      message: 'Network Error',
      error: 'NetworkError',
    };
    const mockRepo: ISystemRepository = {
      checkHealth: vi.fn().mockRejectedValue(networkError),
    };

    const service = new SystemService(mockRepo);
    await expect(service.getHealthStatus()).rejects.toMatchObject({
      statusCode: 0,
      message: 'Network Error',
    });
  });

  it('resolveRoleAccess redirects to login when userRole is missing even if isAuthenticated is true', () => {
    const decision = resolveRoleAccess({
      isAuthenticated: true,
      userRole: null,
      allowedRoles: ['CLIENT'],
      requireAuth: true,
    });

    expect(decision).toEqual({
      allowed: false,
      redirectTo: ROUTES.AUTH.LOGIN,
      reason: 'UNAUTHENTICATED',
    });
  });

  it('TokenStorage stores tokens in sessionStorage when rememberMe=false, localStorage when true, and clears both', () => {
    const user = {
      id: 'user-1',
      email: 'user1@lyora.vn',
      fullName: 'Người dùng Lyora',
      role: 'CLIENT' as const,
    };

    TokenStorage.saveAuthSession('acc-session', 'ref-session', user, {
      rememberMe: false,
    });
    expect(sessionStorageService.getItem<string>('access_token')).toBe('acc-session');
    expect(localStorageService.getItem<string>('access_token')).toBeNull();
    expect(TokenStorage.getAccessToken()).toBe('acc-session');

    TokenStorage.saveAuthSession('acc-local', 'ref-local', user, {
      rememberMe: true,
    });
    expect(localStorageService.getItem<string>('access_token')).toBe('acc-local');
    expect(sessionStorageService.getItem<string>('access_token')).toBeNull();

    TokenStorage.clearAuth();
    expect(localStorageService.getItem<string>('access_token')).toBeNull();
    expect(sessionStorageService.getItem<string>('access_token')).toBeNull();
    expect(TokenStorage.getUser()).toBeNull();
  });

  it('PostService & ProfileService return real empty arrays cleanly and reject on API failure', async () => {
    const emptyPostRepo = {
      getPosts: vi.fn().mockResolvedValue({
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
    } as unknown as IPostRepository;

    const postService = new PostService(emptyPostRepo);
    const feed = await postService.getPosts({ page: 1, limit: 10 });
    expect(feed.items).toEqual([]);
    expect(feed.meta.totalItems).toBe(0);

    const serverError: ApiError = {
      statusCode: 503,
      message: 'Service Unavailable',
      error: 'ServiceUnavailable',
    };
    const failingProfileRepo: IProfileRepository = {
      getMyProfile: vi.fn().mockRejectedValue(serverError),
      updateMyProfile: vi.fn().mockRejectedValue(serverError),
      getAcceptedFriends: vi.fn().mockResolvedValue({ success: true, data: [] }),
    };

    const profileService = new ProfileService(failingProfileRepo);
    await expect(profileService.getProfileById('me')).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});
