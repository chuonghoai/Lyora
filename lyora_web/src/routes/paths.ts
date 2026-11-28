export const ROUTES = {
  CLIENT: {
    ROOT: '/',
    SEARCH: '/search',
    FRIENDS: '/friends',
    MESSAGES: '/messages',
    POST_DETAIL: '/post/:postId',
    PROFILE: '/me',
    PROFILE_DETAIL: '/:userId',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    USER_DETAIL: '/admin/users/:userId',
    POSTS: '/admin/posts',
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },
} as const;

export function getAdminUserDetailPath(userId: string): string {
  return `/admin/users/${encodeURIComponent(userId.trim())}`;
}

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

export function getClientPostDetailPath(postId: string): string {
  return `/post/${encodeURIComponent(postId.trim())}`;
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
  if (
    RESERVED_TOP_LEVEL_PATHS.has(pathname) ||
    pathname.startsWith(`${ROUTES.ADMIN.ROOT}/`) ||
    pathname === '/post' ||
    pathname.startsWith('/post/') ||
    pathname === '/posts' ||
    pathname.startsWith('/posts/')
  ) {
    return false;
  }
  return /^\/[^/]+$/.test(pathname) || /^\/profile(\/[^/]+)?$/.test(pathname);
}
