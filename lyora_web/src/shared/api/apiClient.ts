import axios, { type AxiosInstance } from 'axios';
import type { ApiError } from '../types/api.types';
import { SHARED_CONSTANTS } from '../constants';

export function createApiClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem(SHARED_CONSTANTS.STORAGE_KEYS.TOKEN)
        : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const apiError: ApiError = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          error.message ||
          'Lỗi kết nối mạng không xác định',
        error: error.response?.data?.error,
        timestamp: error.response?.data?.timestamp,
        path: error.config?.url,
      };
      return Promise.reject(apiError);
    },
  );

  return client;
}

export const apiClient = createApiClient();
