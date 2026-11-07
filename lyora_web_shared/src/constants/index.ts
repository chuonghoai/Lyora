export const SHARED_CONSTANTS = {
  APP_NAME: 'Lyora Platform',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DATE_FORMAT: 'DD/MM/YYYY',
  SUPPORT_PHONE: '1900-xxxx',
  STORAGE_KEYS: {
    TOKEN: 'lyora_auth_token',
    USER: 'lyora_user_profile',
  },
  API_ENDPOINTS: {
    AUTH_LOGIN: '/auth/login',
    REPORTS: '/reports',
    NOTIFICATIONS: '/notifications',
  },
} as const;
