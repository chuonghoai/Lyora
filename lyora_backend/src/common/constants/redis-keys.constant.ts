export const REDIS_KEYS = {
  tokenBlacklist: (token: string): string => `blacklist:token:${token}`,
  userSession: (userId: string, sessionId: string): string =>
    `session:${userId}:${sessionId}`,
  otp: (action: string, identifier: string): string =>
    `otp:${action}:${identifier}`,
  otpCooldown: (action: string, identifier: string): string =>
    `cooldown:otp:${action}:${identifier}`,
} as const;

export const REDIS_TTL = {
  OTP_SECONDS: 300, // 5 phút
  OTP_COOLDOWN_SECONDS: 60, // 60 giây
  DEFAULT_ACCESS_TOKEN_SECONDS: 7 * 24 * 3600, // 7 ngày
  DEFAULT_REFRESH_TOKEN_SECONDS: 30 * 24 * 3600, // 30 ngày
} as const;
