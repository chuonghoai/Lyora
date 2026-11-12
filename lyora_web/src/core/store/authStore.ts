import { create } from 'zustand';
import { TokenStorage } from '@/core/storage';
import type { UserProfile } from '../types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen to multi-tab storage events
  if (typeof window !== 'undefined') {
    TokenStorage.onAuthChange((event) => {
      if (event === 'logout') {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      } else if (event === 'login' || event === 'token_updated') {
        const token = TokenStorage.getAccessToken();
        const refreshToken = TokenStorage.getRefreshToken();
        const user = TokenStorage.getUser();
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: Boolean(token),
        });
      }
    });
  }

  // Initial read from TokenStorage
  const initialToken = typeof window !== 'undefined' ? TokenStorage.getAccessToken() : null;
  const initialRefreshToken = typeof window !== 'undefined' ? TokenStorage.getRefreshToken() : null;
  const initialUser = typeof window !== 'undefined' ? TokenStorage.getUser() : null;

  return {
    token: initialToken,
    refreshToken: initialRefreshToken,
    user: initialUser,
    isAuthenticated: Boolean(initialToken),
    isLoading: false,

    setAuth: (tokens, user) => {
      TokenStorage.saveAuthSession(tokens.accessToken, tokens.refreshToken, user);
      set({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    },

    updateUser: (user) => {
      TokenStorage.setUser(user);
      set({ user });
    },

    logout: () => {
      TokenStorage.clearAuth();
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    initAuth: () => {
      const token = TokenStorage.getAccessToken();
      const refreshToken = TokenStorage.getRefreshToken();
      const user = TokenStorage.getUser();
      set({
        token,
        refreshToken,
        user,
        isAuthenticated: Boolean(token),
      });
    },
  };
});
