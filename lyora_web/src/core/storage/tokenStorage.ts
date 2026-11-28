import { localStorageService, sessionStorageService } from './storageService';
import type { UserProfile } from '../types';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
} as const;

export class TokenStorage {
  private static listeners: Array<(event: 'login' | 'logout' | 'token_updated') => void> = [];
  private static isListeningToStorage = false;

  private static getActiveStorage() {
    if (localStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN)) {
      return localStorageService;
    }
    if (sessionStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN)) {
      return sessionStorageService;
    }
    return localStorageService;
  }

  private static ensureStorageListener(): void {
    if (this.isListeningToStorage || typeof window === 'undefined') return;
    this.isListeningToStorage = true;

    window.addEventListener('storage', (event) => {
      if (event.key === null) {
        if (!this.hasToken()) {
          this.notifyListeners('logout');
        }
        return;
      }

      if (event.key.includes(STORAGE_KEYS.ACCESS_TOKEN)) {
        if (!event.newValue) {
          this.notifyListeners('logout');
        } else {
          this.notifyListeners('token_updated');
        }
      }
    });
  }

  private static notifyListeners(event: 'login' | 'logout' | 'token_updated'): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[TokenStorage] Error in storage listener:', err);
      }
    }
  }

  static onAuthChange(callback: (event: 'login' | 'logout' | 'token_updated') => void): () => void {
    this.ensureStorageListener();
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  static getAccessToken(): string | null {
    return (
      localStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN) ??
      sessionStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN)
    );
  }

  static setAccessToken(token: string, rememberMe?: boolean): void {
    if (rememberMe === false) {
      localStorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      return;
    }
    if (rememberMe === true) {
      sessionStorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      return;
    }
    this.getActiveStorage().setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static removeAccessToken(): void {
    localStorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    return (
      localStorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN) ??
      sessionStorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN)
    );
  }

  static setRefreshToken(token: string, rememberMe?: boolean): void {
    if (rememberMe === false) {
      localStorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      return;
    }
    if (rememberMe === true) {
      sessionStorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      return;
    }
    this.getActiveStorage().setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  static removeRefreshToken(): void {
    localStorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static getUser(): UserProfile | null {
    return (
      localStorageService.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE) ??
      sessionStorageService.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE)
    );
  }

  static setUser(user: UserProfile, rememberMe?: boolean): void {
    if (rememberMe === false) {
      localStorageService.removeItem(STORAGE_KEYS.USER_PROFILE);
      sessionStorageService.setItem(STORAGE_KEYS.USER_PROFILE, user);
      return;
    }
    if (rememberMe === true) {
      sessionStorageService.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorageService.setItem(STORAGE_KEYS.USER_PROFILE, user);
      return;
    }
    this.getActiveStorage().setItem(STORAGE_KEYS.USER_PROFILE, user);
  }

  static removeUser(): void {
    localStorageService.removeItem(STORAGE_KEYS.USER_PROFILE);
    sessionStorageService.removeItem(STORAGE_KEYS.USER_PROFILE);
  }

  static saveAuthSession(
    accessToken: string,
    refreshToken: string,
    user: UserProfile,
    options?: { rememberMe?: boolean },
  ): void {
    const rememberMe = options?.rememberMe ?? true;
    this.setAccessToken(accessToken, rememberMe);
    this.setRefreshToken(refreshToken, rememberMe);
    this.setUser(user, rememberMe);
    this.notifyListeners('login');
  }

  static clearAuth(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
    this.notifyListeners('logout');
  }

  static hasToken(): boolean {
    const token = this.getAccessToken();
    return Boolean(token && token.trim().length > 0);
  }
}
