import { isApiError, type PaginationMeta } from '@/core';
import { postRepository, type IPostRepository } from '../repositories/post.repository';
import type {
  CreatePostPayload,
  PaginatedPostReactionsResult,
  PaginatedPostsResult,
  Post,
  PostAuthor,
  PostComment,
  PostMediaItem,
  PostReactionsQueryParams,
  PostsQueryParams,
  ReactionType,
} from '../types/post.types';
import { postPreviewStore } from './postPreviewStore';

export interface IPostService {
  getPosts(params: PostsQueryParams): Promise<PaginatedPostsResult>;
  getFriends(): Promise<PostAuthor[]>;
  uploadMedia(files: File[]): Promise<PostMediaItem[]>;
  createPost(payload: CreatePostPayload): Promise<Post>;
  reactPost(postId: string, reactionType: ReactionType): Promise<Post>;
  getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<PaginatedPostReactionsResult>;
  toggleBookmark(postId: string): Promise<Post>;
  sharePost(postId: string): Promise<Post>;
  hidePost(postId: string): Promise<{ hidden: boolean }>;
  unhidePost(postId: string): Promise<{ hidden: boolean }>;
  addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<PostComment>;
}

function shouldUsePreviewFallback(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode === 404 || Boolean(error.isNetworkError);
}

export class PostService implements IPostService {
  private repository: IPostRepository;
  private enablePreviewFallback: boolean;

  constructor(
    repository: IPostRepository = postRepository,
    enablePreviewFallback: boolean = true,
  ) {
    this.repository = repository;
    this.enablePreviewFallback = enablePreviewFallback;
  }

  async getPosts(params: PostsQueryParams): Promise<PaginatedPostsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 5;

    try {
      const response = await this.repository.getPosts({
        ...params,
        page,
        limit,
      });

      const items = response.data ?? [];
      const fallbackMeta: PaginationMeta = {
        page,
        limit,
        totalItems: items.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: page > 1,
      };

      return {
        items,
        meta: response.meta ?? fallbackMeta,
        isPreviewFallback: false,
      };
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.getPosts({ ...params, page, limit });
      }
      throw error;
    }
  }

  async getFriends(): Promise<PostAuthor[]> {
    try {
      const response = await this.repository.getFriends();
      return response.data ?? [];
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.getFriends();
      }
      throw error;
    }
  }

  async uploadMedia(files: File[]): Promise<PostMediaItem[]> {
    if (files.length === 0) return [];

    try {
      const response = await this.repository.uploadMedia(files);
      return response.data ?? [];
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.createLocalMedia(files);
      }
      throw error;
    }
  }

  async createPost(payload: CreatePostPayload): Promise<Post> {
    try {
      const response = await this.repository.createPost(payload);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.createPost(payload);
      }
      throw error;
    }
  }

  async reactPost(postId: string, reactionType: ReactionType): Promise<Post> {
    try {
      const response = await this.repository.reactPost(postId, reactionType);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.reactPost(postId, reactionType);
      }
      throw error;
    }
  }

  async getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<PaginatedPostReactionsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 6;
    try {
      const response = await this.repository.getPostReactions(postId, {
        ...params,
        page,
        limit,
      });
      const items = response.data ?? [];
      return {
        items,
        meta: response.meta ?? {
          page,
          limit,
          totalItems: items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
        breakdown: { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
        isPreviewFallback: false,
      };
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.getPostReactions(postId, { ...params, page, limit });
      }
      throw error;
    }
  }

  async toggleBookmark(postId: string): Promise<Post> {
    try {
      const response = await this.repository.toggleBookmark(postId);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.toggleBookmark(postId);
      }
      throw error;
    }
  }

  async sharePost(postId: string): Promise<Post> {
    try {
      const response = await this.repository.sharePost(postId);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.sharePost(postId);
      }
      throw error;
    }
  }

  async hidePost(postId: string): Promise<{ hidden: boolean }> {
    try {
      const response = await this.repository.hidePost(postId);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.hidePost(postId);
      }
      throw error;
    }
  }

  async unhidePost(postId: string): Promise<{ hidden: boolean }> {
    try {
      const response = await this.repository.unhidePost(postId);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.unhidePost(postId);
      }
      throw error;
    }
  }

  async addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<PostComment> {
    try {
      const response = await this.repository.addComment(postId, content, media);
      return response.data;
    } catch (error) {
      if (this.enablePreviewFallback && shouldUsePreviewFallback(error)) {
        return postPreviewStore.addComment(postId, content, media);
      }
      throw error;
    }
  }
}

export const postService = new PostService();
