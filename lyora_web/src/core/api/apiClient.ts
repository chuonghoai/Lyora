import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, ApiResponse } from '../types/api.types';
import { TokenStorage } from '../storage';
import { toast } from '../toast';
import { logger } from '../utils/logger';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedPromise {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

function resolveApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '/api';
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http') && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/health',
];

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((p) => url === p || url.includes(p));
}

export function createApiClient(customBaseURL?: string): AxiosInstance {
  const baseURL = resolveApiBaseUrl(
    customBaseURL || import.meta.env.VITE_API_BASE_URL,
  );
  const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
  });

  let isRefreshing = false;
  let failedQueue: QueuedPromise[] = [];
  let refreshCount = 0;
  let lastRefreshTime = Date.now();

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  // 1. Request Interceptor: Attach Bearer Token
  client.interceptors.request.use(
    (config) => {
      const token = TokenStorage.getAccessToken();
      const path = config.url || '';

      if (token && !isPublicEndpoint(path)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // 2. Response & Error Interceptors
  client.interceptors.response.use(
    (response) => {
      return response.data;
    },
    async (error: AxiosError<{ message?: string | string[]; error?: string; timestamp?: string }>) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
      const status = error.response?.status;
      const url = originalRequest?.url || '';

      // Handle 401 Unauthorized with token refresh mutex
      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !url.includes('/auth/login') &&
        !url.includes('/auth/refresh')
      ) {
        const now = Date.now();
        if (now - lastRefreshTime <= 3000) {
          refreshCount++;
        } else {
          refreshCount = 1;
          lastRefreshTime = now;
        }

        if (refreshCount > 5) {
          logger.error('ApiClient', 'Detected runaway token refresh loop. Clearing auth session.');
          TokenStorage.clearAuth();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return Promise.reject(buildApiError(error));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const currentRefreshToken = TokenStorage.getRefreshToken();
        if (!currentRefreshToken) {
          isRefreshing = false;
          TokenStorage.clearAuth();
          return Promise.reject(buildApiError(error));
        }

        try {
          const refreshResponse = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${baseURL}/auth/refresh`,
            { refreshToken: currentRefreshToken },
            { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
          );

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
          TokenStorage.setAccessToken(accessToken);
          if (newRefreshToken) {
            TokenStorage.setRefreshToken(newRefreshToken);
          }

          processQueue(null, accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          TokenStorage.clearAuth();
          toast.error('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
          return Promise.reject(buildApiError(error));
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(buildApiError(error));
    },
  );

  return client;
}

function buildApiError(
  error: AxiosError<{ message?: string | string[]; error?: string; timestamp?: string }>,
): ApiError {
  const statusCode = error.response?.status || 0;
  const data = error.response?.data;
  let message = 'Đã có lỗi xảy ra. Vui lòng thử lại!';

  if (data?.message) {
    if (Array.isArray(data.message) && data.message.length > 0) {
      message = data.message[0];
    } else if (typeof data.message === 'string') {
      message = data.message;
    }
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    message = 'Hết thời gian kết nối đến máy chủ. Vui lòng thử lại!';
  } else if (!error.response && error.request) {
    message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc backend service.';
  } else if (statusCode === 401) {
    message = 'Email hoặc mật khẩu không chính xác hoặc phiên đã hết hạn.';
  } else if (statusCode === 403) {
    message = 'Bạn không có quyền thực hiện thao tác này.';
  } else if (statusCode === 404) {
    message = 'Không tìm thấy dữ liệu yêu cầu.';
  } else if (statusCode === 409) {
    message = 'Dữ liệu đã tồn tại hoặc xảy ra xung đột.';
  } else if (statusCode >= 500) {
    message = 'Hệ thống máy chủ gặp sự cố. Vui lòng thử lại sau.';
  }

  return {
    statusCode,
    message,
    error: data?.error || error.name,
    timestamp: data?.timestamp || new Date().toISOString(),
    path: error.config?.url,
    isNetworkError: !error.response,
  };
}

export const apiClient = createApiClient();

