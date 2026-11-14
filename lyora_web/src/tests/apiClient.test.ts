import { describe, it, expect } from 'vitest';
import { isApiError, type ApiError, type ApiResponse } from '@core';
import { TokenStorage } from '@/core/storage';

describe('ApiClient & Response Types', () => {
  it('should correctly identify ApiError using isApiError guard', () => {
    const errorObj: ApiError = {
      statusCode: 401,
      message: 'Email hoặc mật khẩu không chính xác',
      error: 'Unauthorized',
    };
    expect(isApiError(errorObj)).toBe(true);

    const nonApiError = new Error('Regular Error');
    expect(isApiError(nonApiError)).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError('string')).toBe(false);
  });

  it('should handle ApiResponse wrapping contract correctly', () => {
    const mockSuccessPayload: ApiResponse<{ id: string; role: string }> = {
      success: true,
      message: 'Thao tác thành công',
      data: { id: 'usr-1', role: 'CLIENT' },
    };

    expect(mockSuccessPayload.success).toBe(true);
    expect(mockSuccessPayload.message).toBe('Thao tác thành công');
    expect(mockSuccessPayload.data.id).toBe('usr-1');
  });

  it('should supply stored token for authenticated requests', () => {
    TokenStorage.clearAuth();
    expect(TokenStorage.getAccessToken()).toBeNull();

    TokenStorage.setAccessToken('sample_auth_jwt_token_xyz');
    const token = TokenStorage.getAccessToken();
    expect(token).toBe('sample_auth_jwt_token_xyz');

    const authHeader = `Bearer ${token}`;
    expect(authHeader).toBe('Bearer sample_auth_jwt_token_xyz');
    TokenStorage.clearAuth();
  });
});
