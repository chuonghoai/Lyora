import type { QueryClient } from '@tanstack/react-query';
import {
  localStorageService,
  memoryStorageService,
  sessionStorageService,
} from './storageService';
import { TokenStorage } from './tokenStorage';
import { webSocketService } from '../websocket/WebSocketService';

/**
 * Xóa toàn bộ Browser Cache Storage (best-effort) khi kết thúc phiên đăng nhập.
 */
async function clearBrowserCaches(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    !('caches' in window) ||
    !window.caches ||
    typeof window.caches.keys !== 'function'
  ) {
    return;
  }

  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
  } catch {
    // Bỏ qua lỗi trong môi trường bị hạn chế quyền truy cập Cache Storage
  }
}

/**
 * Xóa toàn bộ dữ liệu phiên client (storage có prefix `lyora:`, thuộc tính DOM và kết nối realtime)
 * mà không phát lại sự kiện `TokenStorage.clearAuth()` để tránh lặp vô hạn.
 */
export function clearClientSessionArtifacts(): void {
  localStorageService.clear();
  sessionStorageService.clear();
  memoryStorageService.clear();

  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = '';
    document.documentElement.classList.remove('motion-reduce');
  }

  webSocketService.disconnect();
  void clearBrowserCaches();
}

export interface ClearClientSessionOptions {
  queryClient?: QueryClient;
}

/**
 * Xóa sạch toàn bộ cache TanStack Query, storage trình duyệt, trạng thái DOM,
 * kết nối WebSocket và thông tin xác thực khi người dùng đăng xuất.
 */
export async function clearClientSessionData(
  options?: ClearClientSessionOptions,
): Promise<void> {
  if (options?.queryClient) {
    await options.queryClient.cancelQueries();
    options.queryClient.clear();
  }

  clearClientSessionArtifacts();
  await clearBrowserCaches();
  TokenStorage.clearAuth();
}
