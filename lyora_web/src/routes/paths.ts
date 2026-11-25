export const ROUTES = {
  CLIENT: {
    ROOT: '/',
    MESSAGES: '/messages',
    PROFILE: '/profile',
    PROFILE_DETAIL: '/profile/:userId',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },
} as const;

export function getClientProfilePath(userId?: string): string {
  const trimmed = userId?.trim();
  if (!trimmed || trimmed === 'me') {
    return ROUTES.CLIENT.PROFILE;
  }
  return `/profile/${encodeURIComponent(trimmed)}`;
}
