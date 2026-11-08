import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SHARED_CONSTANTS, type UserProfile } from '@shared';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem(SHARED_CONSTANTS.STORAGE_KEYS.TOKEN, token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem(SHARED_CONSTANTS.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(SHARED_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'lyora-auth-storage',
    },
  ),
);
