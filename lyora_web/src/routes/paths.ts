export const ROUTES = {
  CLIENT: {
    ROOT: '/',
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
