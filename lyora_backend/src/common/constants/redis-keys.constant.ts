export const REDIS_KEYS = {
  tokenBlacklist: (token: string): string => `blacklist:token:${token}`,
  userSession: (userId: string, sessionId: string): string =>
    `session:${userId}:${sessionId}`,
  userSessionIndex: (userId: string): string => `user:sessions:${userId}`,
  otp: (action: string, identifier: string): string =>
    `otp:${action}:${identifier}`,
  otpAttempts: (action: string, identifier: string): string =>
    `otp:attempts:${action}:${identifier}`,
  otpCooldown: (action: string, identifier: string): string =>
    `cooldown:otp:${action}:${identifier}`,
  resetPasswordToken: (email: string): string => `reset_token:${email}`,
  aiDailyQuota: (userId: string, dateKey: string): string =>
    `ai:quota:${userId}:${dateKey}`,
} as const;

export const REDIS_TTL = {
  OTP_SECONDS: 300,
  OTP_COOLDOWN_SECONDS: 60,
  MAX_OTP_ATTEMPTS: 5,
  RESET_PASSWORD_TOKEN_SECONDS: 300,
  DEFAULT_ACCESS_TOKEN_SECONDS: 7 * 24 * 3600,
  DEFAULT_REFRESH_TOKEN_SECONDS: 30 * 24 * 3600,
  AI_DAILY_QUOTA_SECONDS: 24 * 3600,
} as const;
