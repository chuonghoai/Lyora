/**
 * Query Key Factory for User Feature
 */
export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  statistics: (roleFilter: string = 'ALL') =>
    roleFilter === 'ALL'
      ? ([...userKeys.all, 'statistics'] as const)
      : ([...userKeys.all, 'statistics', roleFilter] as const),
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

