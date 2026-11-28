import type { AdminUsersQueryParams } from '../types/user.types';

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
  adminList: (params: AdminUsersQueryParams = {}) =>
    [...userKeys.all, 'admin-list', params] as const,
  onlineStatuses: (idsKey: string) =>
    [...userKeys.all, 'online-status', idsKey] as const,
  adminDetail: (id: string) => [...userKeys.all, 'admin-detail', id] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profilePage: (userId: string = 'me') => [...userKeys.all, 'profile-page', userId] as const,
  profileActivity: (userId: string = 'me') => [...userKeys.all, 'profile-activity', userId] as const,
  friendsDirectory: () => [...userKeys.all, 'friends-directory'] as const,
};

