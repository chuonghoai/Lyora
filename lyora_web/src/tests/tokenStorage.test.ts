import { describe, it, expect, beforeEach } from 'vitest';
import { TokenStorage } from '@/core/storage';
import type { UserProfile } from '@core';

describe('TokenStorage', () => {
  beforeEach(() => {
    TokenStorage.clearAuth();
  });

  it('should save and retrieve access token', () => {
    expect(TokenStorage.getAccessToken()).toBeNull();
    TokenStorage.setAccessToken('sample_access_token_123');
    expect(TokenStorage.getAccessToken()).toBe('sample_access_token_123');
    expect(TokenStorage.hasToken()).toBe(true);
  });

  it('should save and retrieve refresh token', () => {
    expect(TokenStorage.getRefreshToken()).toBeNull();
    TokenStorage.setRefreshToken('sample_refresh_token_456');
    expect(TokenStorage.getRefreshToken()).toBe('sample_refresh_token_456');
  });

  it('should save and retrieve user profile', () => {
    const mockUser: UserProfile = {
      id: 'uuid-1234',
      email: 'client@lyora.com',
      fullName: 'Lyora Client',
      role: 'CLIENT',
    };
    TokenStorage.setUser(mockUser);
    expect(TokenStorage.getUser()).toEqual(mockUser);
  });

  it('should save full auth session', () => {
    const mockUser: UserProfile = {
      id: 'uuid-admin-01',
      email: 'admin@lyora.com',
      fullName: 'Quản trị viên',
      role: 'ADMIN',
    };
    TokenStorage.saveAuthSession('acc_token', 'ref_token', mockUser);
    expect(TokenStorage.getAccessToken()).toBe('acc_token');
    expect(TokenStorage.getRefreshToken()).toBe('ref_token');
    expect(TokenStorage.getUser()).toEqual(mockUser);
    expect(TokenStorage.hasToken()).toBe(true);
  });

  it('should clear all auth data on clearAuth()', () => {
    const mockUser: UserProfile = {
      id: 'uuid-02',
      email: 'user@lyora.com',
      fullName: 'Test User',
      role: 'CLIENT',
    };
    TokenStorage.saveAuthSession('acc_token', 'ref_token', mockUser);
    expect(TokenStorage.hasToken()).toBe(true);

    TokenStorage.clearAuth();
    expect(TokenStorage.getAccessToken()).toBeNull();
    expect(TokenStorage.getRefreshToken()).toBeNull();
    expect(TokenStorage.getUser()).toBeNull();
    expect(TokenStorage.hasToken()).toBe(false);
  });

  it('should notify auth listeners when session changes', () => {
    const events: string[] = [];
    const unsubscribe = TokenStorage.onAuthChange((event) => {
      events.push(event);
    });

    const mockUser: UserProfile = {
      id: 'uuid-03',
      email: 'user3@lyora.com',
      fullName: 'User 3',
      role: 'CLIENT',
    };

    TokenStorage.saveAuthSession('token1', 'ref1', mockUser);
    TokenStorage.clearAuth();

    expect(events).toContain('login');
    expect(events).toContain('logout');
    unsubscribe();
  });
});
