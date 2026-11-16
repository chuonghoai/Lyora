import type { PostReactionsQueryParams, PostsQueryParams } from '../types/post.types';

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
};
