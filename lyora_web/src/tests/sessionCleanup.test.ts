import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  clearClientSessionArtifacts,
  clearClientSessionData,
  localStorageService,
  memoryStorageService,
  sessionStorageService,
  TokenStorage,
  useAuthStore,
  webSocketService,
} from '@/core';

function createMemoryWebStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('Client Session & Cache Cleanup on Logout', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    TokenStorage.clearAuth();
    localStorageService.clear();
    sessionStorageService.clear();
    memoryStorageService.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalDocument === undefined) {
      delete (globalThis as Record<string, unknown>).document;
    } else {
      globalThis.document = originalDocument;
    }
    if (originalWindow === undefined) {
      delete (globalThis as Record<string, unknown>).window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('clearClientSessionArtifacts wipes lyora storage, resets DOM accessibility state, disconnects socket, and clears Browser Cache Storage', async () => {
    localStorageService.setItem('lyora_search_history', ['minh', 'lyora']);
    localStorageService.setItem('post-composer-draft', { content: 'Bản nháp bí mật' });
    localStorageService.setItem('lyora_sent_friend_requests:user-1', [{ targetUserId: 'user-2' }]);
    localStorageService.setItem('lyora_ui_preferences', { fontScale: 'large', reduceMotion: true });
    sessionStorageService.setItem('temp_flag', '1');
    memoryStorageService.setItem('in_mem_key', { cached: true });

    const removeClassMock = vi.fn();
    const documentElementMock = {
      style: { fontSize: '17.5px' },
      classList: {
        remove: removeClassMock,
        toggle: vi.fn(),
      },
    };
    vi.stubGlobal('document', { documentElement: documentElementMock });

    const deleteCacheMock = vi.fn().mockResolvedValue(true);
    const cachesMock = {
      keys: vi.fn().mockResolvedValue(['lyora-runtime-v1', 'lyora-assets-v1']),
      delete: deleteCacheMock,
    };
    vi.stubGlobal('window', { caches: cachesMock });

    const disconnectSpy = vi.spyOn(webSocketService, 'disconnect').mockImplementation(() => {});

    clearClientSessionArtifacts();
    await Promise.resolve();
    await Promise.resolve();

    expect(localStorageService.getItem('lyora_search_history')).toBeNull();
    expect(localStorageService.getItem('post-composer-draft')).toBeNull();
    expect(localStorageService.getItem('lyora_sent_friend_requests:user-1')).toBeNull();
    expect(localStorageService.getItem('lyora_ui_preferences')).toBeNull();
    expect(sessionStorageService.getItem('temp_flag')).toBeNull();
    expect(memoryStorageService.getItem('in_mem_key')).toBeNull();

    expect(documentElementMock.style.fontSize).toBe('');
    expect(removeClassMock).toHaveBeenCalledWith('motion-reduce');
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(cachesMock.keys).toHaveBeenCalledTimes(1);
    expect(deleteCacheMock).toHaveBeenCalledWith('lyora-runtime-v1');
    expect(deleteCacheMock).toHaveBeenCalledWith('lyora-assets-v1');
  });

  it('clearClientSessionData cancels and clears all TanStack Query caches along with auth tokens', async () => {
    TokenStorage.saveAuthSession('acc-1', 'ref-1', {
      id: 'user-1',
      email: 'user1@lyora.vn',
      fullName: 'Người dùng 1',
      role: 'CLIENT',
    });
    localStorageService.setItem('lyora_search_history', ['test']);

    const queryClient = new QueryClient();
    queryClient.setQueryData(['posts', 'list'], [{ id: 'p-1' }]);
    queryClient.setQueryData(['notifications', 'list'], [{ id: 'n-1' }]);
    queryClient.setQueryData(['friends', 'accepted'], [{ id: 'f-1' }]);
    queryClient.setQueryData(['conversations', 'list'], [{ id: 'c-1' }]);
    queryClient.setQueryData(['users', 'statistics'], { totalUsers: 99 });

    const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');
    const clearSpy = vi.spyOn(queryClient, 'clear');

    await clearClientSessionData({ queryClient });

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(TokenStorage.hasToken()).toBe(false);
    expect(TokenStorage.getUser()).toBeNull();
    expect(localStorageService.getItem('lyora_search_history')).toBeNull();
  });

  it('useAuthStore.logout() clears both auth state and client session artifacts', () => {
    TokenStorage.saveAuthSession('acc-store', 'ref-store', {
      id: 'user-store',
      email: 'store@lyora.vn',
      fullName: 'Store User',
      role: 'CLIENT',
    });
    useAuthStore.getState().initAuth();
    localStorageService.setItem('post-composer-draft', { content: 'Nháp chưa đăng' });
    const disconnectSpy = vi.spyOn(webSocketService, 'disconnect').mockImplementation(() => {});

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorageService.getItem('post-composer-draft')).toBeNull();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('preserves non-lyora keys in window.localStorage and window.sessionStorage while wiping all lyora:* keys', async () => {
    vi.resetModules();
    const mockLocal = createMemoryWebStorage();
    const mockSession = createMemoryWebStorage();

    mockLocal.setItem('third_party_setting', 'keep-me');
    mockSession.setItem('third_party_session', 'keep-session');

    vi.stubGlobal('window', {
      localStorage: mockLocal,
      sessionStorage: mockSession,
      addEventListener: vi.fn(),
    });

    const storageModule = await import('@/core/storage');
    storageModule.localStorageService.setItem('lyora_search_history', ['tai khoan cu']);
    storageModule.localStorageService.setItem('post-composer-draft', { content: 'secret draft' });
    storageModule.sessionStorageService.setItem('temp_session_note', 'abc');

    expect(mockLocal.getItem('lyora:lyora_search_history')).not.toBeNull();

    storageModule.clearClientSessionArtifacts();

    expect(mockLocal.getItem('lyora:lyora_search_history')).toBeNull();
    expect(mockLocal.getItem('lyora:post-composer-draft')).toBeNull();
    expect(mockSession.getItem('lyora:temp_session_note')).toBeNull();
    expect(mockLocal.getItem('third_party_setting')).toBe('keep-me');
    expect(mockSession.getItem('third_party_session')).toBe('keep-session');
  });

  it('AppProviders clears all QueryClient queries and lyora storage when TokenStorage.clearAuth() fires (401 or cross-tab logout)', async () => {
    vi.resetModules();
    const capturedEffects: Array<() => void | (() => void)> = [];

    vi.doMock('react', async () => {
      const actual = await vi.importActual<typeof import('react')>('react');
      return {
        ...actual,
        useState: (initial: unknown) => [
          typeof initial === 'function' ? (initial as () => unknown)() : initial,
          vi.fn(),
        ],
        useEffect: (effect: () => void | (() => void)) => {
          capturedEffects.push(effect);
        },
      };
    });

    const storageMod = await import('@/core/storage');
    const providersMod = await import('@/core/providers/AppProviders');
    const wsMod = await import('@/core/websocket/WebSocketService');

    const disconnectSpy = vi.spyOn(wsMod.webSocketService, 'disconnect').mockImplementation(() => {});

    const element = providersMod.AppProviders({ children: null }) as {
      props: {
        children: Array<{
          props: {
            client: QueryClient;
          };
        }>;
      };
    };

    const providerChild = Array.isArray(element.props.children)
      ? element.props.children[0]
      : element.props.children;
    const appQueryClient = providerChild.props.client;

    expect(capturedEffects).toHaveLength(1);
    const cleanupListener = capturedEffects[0]();

    storageMod.TokenStorage.saveAuthSession('acc-a', 'ref-a', {
      id: 'user-a',
      email: 'a@lyora.vn',
      fullName: 'Tài khoản A',
      role: 'CLIENT',
    });
    storageMod.localStorageService.setItem('lyora_search_history', ['secret-query']);
    appQueryClient.setQueryData(['posts', 'feed'], [{ id: 'post-of-a' }]);
    appQueryClient.setQueryData(['notifications'], [{ id: 'notif-of-a' }]);

    expect(appQueryClient.getQueryCache().getAll()).toHaveLength(2);

    // Giả lập auto-logout do 401 hoặc tab khác đăng xuất
    storageMod.TokenStorage.clearAuth();

    expect(appQueryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(storageMod.localStorageService.getItem('lyora_search_history')).toBeNull();
    expect(disconnectSpy).toHaveBeenCalled();

    if (typeof cleanupListener === 'function') {
      cleanupListener();
    }
    vi.doUnmock('react');
  });
});
