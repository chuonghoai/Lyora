export const ROUTES = {
  CLIENT: {
    ROOT: '/',
    SEARCH: '/search',
    FRIENDS: '/friends',
    MESSAGES: '/messages',
    PROFILE: '/me',
    PROFILE_DETAIL: '/:userId',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
    POSTS: '/admin/posts',
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },
} as const;

export function getClientProfilePath(userId?: string, selfId?: string): string {
  const trimmed = userId?.trim();
  if (trimmed && trimmed !== 'me') {
    return `/${encodeURIComponent(trimmed)}`;
  }

  const normalizedSelfId = selfId?.trim();
  if (normalizedSelfId && normalizedSelfId !== 'me') {
    return `/${encodeURIComponent(normalizedSelfId)}`;
  }

  return ROUTES.CLIENT.PROFILE;
}

const RESERVED_TOP_LEVEL_PATHS = new Set<string>([
  ROUTES.CLIENT.ROOT,
  ROUTES.CLIENT.SEARCH,
  ROUTES.CLIENT.FRIENDS,
  ROUTES.CLIENT.MESSAGES,
  ROUTES.ADMIN.ROOT,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
]);

export function isClientProfilePathname(pathname: string): boolean {
  if (RESERVED_TOP_LEVEL_PATHS.has(pathname) || pathname.startsWith(`${ROUTES.ADMIN.ROOT}/`)) {
    return false;
  }
  return /^\/[^/]+$/.test(pathname) || /^\/profile(\/[^/]+)?$/.test(pathname);
}
