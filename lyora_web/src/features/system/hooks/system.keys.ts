/**
 * Query Key Factory for System Feature
 */
export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
};

