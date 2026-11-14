export const CORE_CONSTANTS = {
  APP_NAME: 'Lyora Platform',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DATE_FORMAT: 'DD/MM/YYYY',
  SUPPORT_PHONE: '1900-6868',
  STORAGE_KEYS: {
    TOKEN: 'lyora_token',
    REFRESH_TOKEN: 'lyora_refresh_token',
    USER: 'lyora_user_profile',
  },
  API_ENDPOINTS: {
    HEALTH: '/health',
    AUTH_LOGIN: '/auth/login',
    AUTH_REGISTER: '/auth/register',
    AUTH_REGISTER_SEND_OTP: '/auth/register/send-otp',
    AUTH_FORGOT_PASSWORD_SEND_OTP: '/auth/forgot-password/send-otp',
    AUTH_FORGOT_PASSWORD_VERIFY_OTP: '/auth/forgot-password/verify-otp',
    AUTH_FORGOT_PASSWORD_RESET: '/auth/forgot-password/reset',
    AUTH_REFRESH: '/auth/refresh',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',
    USERS: '/users',
    USERS_STATISTICS: '/users/statistics',
  },
} as const;

export const SHARED_CONSTANTS = CORE_CONSTANTS;
