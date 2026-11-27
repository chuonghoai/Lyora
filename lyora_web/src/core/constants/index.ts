export const CORE_CONSTANTS = {
  APP_NAME: "Lyora Platform",
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DATE_FORMAT: "DD/MM/YYYY",
  SUPPORT_PHONE: "1900-6868",
  STORAGE_KEYS: {
    TOKEN: "lyora_token",
    REFRESH_TOKEN: "lyora_refresh_token",
    USER: "lyora_user_profile",
  },
  API_ENDPOINTS: {
    HEALTH: "/health",
    AUTH_LOGIN: "/auth/login",
    AUTH_REGISTER: "/auth/register",
    AUTH_REGISTER_SEND_OTP: "/auth/register/send-otp",
    AUTH_FORGOT_PASSWORD_SEND_OTP: "/auth/forgot-password/send-otp",
    AUTH_FORGOT_PASSWORD_VERIFY_OTP: "/auth/forgot-password/verify-otp",
    AUTH_FORGOT_PASSWORD_RESET: "/auth/forgot-password/reset",
    AUTH_REFRESH: "/auth/refresh",
    AUTH_LOGOUT: "/auth/logout",
    AUTH_ME: "/auth/me",
    USERS: "/users",
    USERS_STATISTICS: "/users/statistics",
    POSTS: "/posts",
    FRIENDS: "/friends",
    NOTIFICATIONS: "/notifications",
    CONVERSATIONS: "/conversations",
  },
} as const;

export const SHARED_CONSTANTS = CORE_CONSTANTS;

export const ICON_SCALE_ANIMATION =
  "transition-colors " +
  "motion-safe:transition-[scale,color] motion-safe:duration-200 motion-safe:ease-out " +
  "motion-safe:group-hover:scale-[1.18] motion-safe:group-focus-visible:scale-[1.18] " +
  "motion-safe:active:scale-[0.94] motion-safe:group-active:scale-[0.94] " +
  "motion-reduce:scale-100 motion-reduce:transform-none motion-reduce:transition-none";
