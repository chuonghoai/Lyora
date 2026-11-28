import type {
  AdminPostsQueryParams,
  PostReactionsQueryParams,
  PostsQueryParams,
} from '../types/post.types';

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: Omit<PostsQueryParams, 'page'> = {}) =>
    [...postKeys.lists(), filters] as const,
  friends: () => [...postKeys.all, 'friends'] as const,
  reactions: (postId: string, params: PostReactionsQueryParams = {}) =>
    [...postKeys.all, 'reactions', postId, params] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  adminAll: () => [...postKeys.all, 'admin'] as const,
  adminStats: () => [...postKeys.adminAll(), 'statistics'] as const,
  adminLists: () => [...postKeys.adminAll(), 'list'] as const,
  adminList: (params: AdminPostsQueryParams = {}) =>
    [...postKeys.adminLists(), params] as const,
  adminDetails: () => [...postKeys.adminAll(), 'detail'] as const,
  adminDetail: (id: string) => [...postKeys.adminDetails(), id] as const,
};
