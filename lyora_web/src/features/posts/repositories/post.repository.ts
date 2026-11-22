import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
import type {
  CreatePostPayload,
  Post,
  PostAuthor,
  PostComment,
  PostMediaItem,
  PostReactionUser,
  PostReactionsQueryParams,
  PostsQueryParams,
  PostSuggestionsResult,
  ReactionType,
  SuggestPostContentPayload,
} from '../types/post.types';

export interface IPostRepository {
  getPosts(params: PostsQueryParams): Promise<ApiResponse<Post[]>>;
  getFriends(): Promise<ApiResponse<PostAuthor[]>>;
  uploadMedia(files: File[]): Promise<ApiResponse<PostMediaItem[]>>;
  createPost(payload: CreatePostPayload): Promise<ApiResponse<Post>>;
  suggestContent(
    payload: SuggestPostContentPayload,
  ): Promise<ApiResponse<PostSuggestionsResult>>;
  reactPost(postId: string, reactionType: ReactionType): Promise<ApiResponse<Post>>;
  getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<ApiResponse<PostReactionUser[]>>;
  toggleBookmark(postId: string): Promise<ApiResponse<Post>>;
  sharePost(postId: string): Promise<ApiResponse<Post>>;
  hidePost(postId: string): Promise<ApiResponse<{ hidden: boolean }>>;
  unhidePost(postId: string): Promise<ApiResponse<{ hidden: boolean }>>;
  addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<ApiResponse<PostComment>>;
}

export class PostRepository implements IPostRepository {
  async getPosts(params: PostsQueryParams): Promise<ApiResponse<Post[]>> {
    return apiClient.get<ApiResponse<Post[]>, ApiResponse<Post[]>>(
      CORE_CONSTANTS.API_ENDPOINTS.POSTS,
      { params },
    );
  }

  async getFriends(): Promise<ApiResponse<PostAuthor[]>> {
    return apiClient.get<ApiResponse<PostAuthor[]>, ApiResponse<PostAuthor[]>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/friends`,
    );
  }

  async uploadMedia(files: File[]): Promise<ApiResponse<PostMediaItem[]>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return apiClient.post<ApiResponse<PostMediaItem[]>, ApiResponse<PostMediaItem[]>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 },
    );
  }

  async createPost(payload: CreatePostPayload): Promise<ApiResponse<Post>> {
    return apiClient.post<ApiResponse<Post>, ApiResponse<Post>>(
      CORE_CONSTANTS.API_ENDPOINTS.POSTS,
      payload,
    );
  }

  async suggestContent(
    payload: SuggestPostContentPayload,
  ): Promise<ApiResponse<PostSuggestionsResult>> {
    return apiClient.post<
      ApiResponse<PostSuggestionsResult>,
      ApiResponse<PostSuggestionsResult>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/ai-suggestions`, payload, {
      timeout: 30000,
    });
  }

  async reactPost(postId: string, reactionType: ReactionType): Promise<ApiResponse<Post>> {
    return apiClient.post<ApiResponse<Post>, ApiResponse<Post>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/reactions`,
      { reactionType },
    );
  }

  async getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<ApiResponse<PostReactionUser[]>> {
    return apiClient.get<ApiResponse<PostReactionUser[]>, ApiResponse<PostReactionUser[]>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/reactions`,
      { params },
    );
  }

  async toggleBookmark(postId: string): Promise<ApiResponse<Post>> {
    return apiClient.post<ApiResponse<Post>, ApiResponse<Post>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/bookmark`,
    );
  }

  async sharePost(postId: string): Promise<ApiResponse<Post>> {
    return apiClient.post<ApiResponse<Post>, ApiResponse<Post>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/share`,
    );
  }

  async hidePost(postId: string): Promise<ApiResponse<{ hidden: boolean }>> {
    return apiClient.post<ApiResponse<{ hidden: boolean }>, ApiResponse<{ hidden: boolean }>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/hide`,
    );
  }

  async unhidePost(postId: string): Promise<ApiResponse<{ hidden: boolean }>> {
    return apiClient.delete<ApiResponse<{ hidden: boolean }>, ApiResponse<{ hidden: boolean }>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/hide`,
    );
  }

  async addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<ApiResponse<PostComment>> {
    return apiClient.post<ApiResponse<PostComment>, ApiResponse<PostComment>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/comments`,
      { content, ...(media ? { media } : {}) },
    );
  }
}

export const postRepository = new PostRepository();
