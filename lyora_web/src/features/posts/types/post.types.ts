import type { PaginationMeta } from '@/core';

export type PostVisibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export type PostMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export interface PostMediaItem {
  id?: string;
  url: string;
  type: PostMediaType;
  alt?: string;
  duration?: number;
  fileName?: string;
  size?: number;
}

export interface PostAuthor {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface PostComment {
  id: string;
  author: PostAuthor;
  content: string;
  media?: PostMediaItem | null;
  createdAt: string;
}

export type ReactionBreakdown = Record<ReactionType, number>;

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  visibility: PostVisibility;
  media: PostMediaItem[];
  reactionCount: number;
  reactionBreakdown: ReactionBreakdown;
  userReaction: ReactionType | null;
  commentCount: number;
  comments: PostComment[];
  shareCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PostsFeedFilter = 'all' | 'mine' | 'saved';

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: PostsFeedFilter;
  visibility?: PostVisibility;
}

export interface PaginatedPostsResult {
  items: Post[];
  meta: PaginationMeta;
  isPreviewFallback?: boolean;
}

export interface CreatePostPayload {
  content: string;
  visibility: PostVisibility;
  media?: PostMediaItem[];
  taggedUserIds?: string[];
}

export interface ReactPostPayload {
  postId: string;
  reactionType: ReactionType;
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  media?: PostMediaItem | null;
}

export interface PostReactionUser {
  id: string;
  user: PostAuthor;
  reactionType: ReactionType;
  createdAt: string;
}

export interface PostReactionsQueryParams {
  page?: number;
  limit?: number;
  reactionType?: ReactionType;
}

export interface PaginatedPostReactionsResult {
  items: PostReactionUser[];
  meta: PaginationMeta;
  breakdown: ReactionBreakdown;
  isPreviewFallback?: boolean;
}
