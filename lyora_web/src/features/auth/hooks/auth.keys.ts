/**
 * Query Key Factory for Auth Feature
 * Centralized key management prevents hardcoded query key strings across the app.
 */
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

