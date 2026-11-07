import axios, { type AxiosInstance } from 'axios';
import type { ApiError } from '../types/api.types';

export function createApiClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    // Lay token tu localStorage (dung chung cho web client va admin)
    const token = typeof window !== 'undefined' ? localStorage.getItem('lyora_token') : null;
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
        message: error.response?.data?.message || error.message || 'Lỗi mạng không xác định',
        error: error.response?.data?.error,
        path: error.config?.url,
      };
      return Promise.reject(apiError);
    }
  );

  return client;
}

export const apiClient = createApiClient();
