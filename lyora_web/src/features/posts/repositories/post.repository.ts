import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
import type {
  AdminPostAppealHistoryItem,
  AdminPostAppealHistoryQueryParams,
  AdminPostAppealItem,
  AdminPostAppealsQueryParams,
  AdminPostDetail,
  AdminPostItem,
  AdminPostsQueryParams,
  AdminPostStatistics,
  CreatePostAppealPayload,
  CreatePostPayload,
  Post,
  PostAppealSummary,
  PostAuthor,
  PostComment,
  PostCommentsQueryParams,
  PostMediaItem,
  PostReactionUser,
  PostReactionsQueryParams,
  PostShareUser,
  PostSharesQueryParams,
  PostsQueryParams,
  PostSuggestionsResult,
  ReactionType,
  SuggestPostContentPayload,
  UpdatePostPayload,
} from '../types/post.types';

export interface IPostRepository {
  getPosts(params: PostsQueryParams): Promise<ApiResponse<Post[]>>;
  getPostById(postId: string): Promise<ApiResponse<Post>>;
  getPostComments(
    postId: string,
    params: PostCommentsQueryParams,
  ): Promise<ApiResponse<PostComment[]>>;
  createPostAppeal(
    payload: CreatePostAppealPayload,
  ): Promise<ApiResponse<PostAppealSummary>>;
  getFriends(): Promise<ApiResponse<PostAuthor[]>>;
  uploadMedia(files: File[]): Promise<ApiResponse<PostMediaItem[]>>;
  createPost(payload: CreatePostPayload): Promise<ApiResponse<Post>>;
  updatePost(
    postId: string,
    payload: Omit<UpdatePostPayload, 'postId'>,
  ): Promise<ApiResponse<Post>>;
  suggestContent(
    payload: SuggestPostContentPayload,
  ): Promise<ApiResponse<PostSuggestionsResult>>;
  reactPost(postId: string, reactionType: ReactionType): Promise<ApiResponse<Post>>;
  getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<ApiResponse<PostReactionUser[]>>;
  getPostShares(
    postId: string,
    params: PostSharesQueryParams,
  ): Promise<ApiResponse<PostShareUser[]>>;
  toggleBookmark(postId: string): Promise<ApiResponse<Post>>;
  sharePost(postId: string): Promise<ApiResponse<Post>>;
  hidePost(postId: string): Promise<ApiResponse<{ hidden: boolean }>>;
  unhidePost(postId: string): Promise<ApiResponse<{ hidden: boolean }>>;
  addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<ApiResponse<PostComment>>;
  getAdminPostStatistics(): Promise<ApiResponse<AdminPostStatistics>>;
  getAdminPosts(params: AdminPostsQueryParams): Promise<ApiResponse<AdminPostItem[]>>;
  getAdminPostDetail(postId: string): Promise<ApiResponse<AdminPostDetail>>;
  hideAdminPost(postId: string, reason: string): Promise<ApiResponse<AdminPostDetail>>;
  restoreAdminPost(postId: string): Promise<ApiResponse<AdminPostDetail>>;
  flagAdminPostViolation(
    postId: string,
    reason: string,
  ): Promise<ApiResponse<AdminPostDetail>>;
  unflagAdminPostViolation(postId: string): Promise<ApiResponse<AdminPostDetail>>;
  removeAdminPost(postId: string, reason?: string): Promise<ApiResponse<null>>;
  removeAdminComment(
    postId: string,
    commentId: string,
    reason?: string,
  ): Promise<ApiResponse<null>>;
  getAdminPostAppeals(
    params: AdminPostAppealsQueryParams,
  ): Promise<ApiResponse<AdminPostAppealItem[]>>;
  getAdminPostAppealsHistory(
    postId: string,
    params: AdminPostAppealHistoryQueryParams,
  ): Promise<ApiResponse<AdminPostAppealHistoryItem[]>>;
  restoreAdminPostAppeal(
    appealId: string,
  ): Promise<ApiResponse<AdminPostAppealItem>>;
  rejectAdminPostAppeal(
    appealId: string,
    evidence: string,
  ): Promise<ApiResponse<AdminPostAppealItem>>;
}

export class PostRepository implements IPostRepository {
  async getPosts(params: PostsQueryParams): Promise<ApiResponse<Post[]>> {
    return apiClient.get<ApiResponse<Post[]>, ApiResponse<Post[]>>(
      CORE_CONSTANTS.API_ENDPOINTS.POSTS,
      { params },
    );
  }

  async getPostById(postId: string): Promise<ApiResponse<Post>> {
    return apiClient.get<ApiResponse<Post>, ApiResponse<Post>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${encodeURIComponent(postId)}`,
    );
  }

  async getPostComments(
    postId: string,
    params: PostCommentsQueryParams,
  ): Promise<ApiResponse<PostComment[]>> {
    return apiClient.get<ApiResponse<PostComment[]>, ApiResponse<PostComment[]>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/comments`,
      { params },
    );
  }

  async createPostAppeal(
    payload: CreatePostAppealPayload,
  ): Promise<ApiResponse<PostAppealSummary>> {
    return apiClient.post<
      ApiResponse<PostAppealSummary>,
      ApiResponse<PostAppealSummary>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${payload.postId}/appeals`, {
      reasonCategory: payload.reasonCategory,
      reasonDetail: payload.reasonDetail,
    });
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

  async updatePost(
    postId: string,
    payload: Omit<UpdatePostPayload, 'postId'>,
  ): Promise<ApiResponse<Post>> {
    return apiClient.patch<ApiResponse<Post>, ApiResponse<Post>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}`,
      payload,
    );
  }

  async suggestContent(
    payload: SuggestPostContentPayload,
  ): Promise<ApiResponse<PostSuggestionsResult>> {
    if (payload.mediaFiles && payload.mediaFiles.length > 0) {
      const formData = new FormData();
      formData.append('tone', payload.tone);
      if (payload.topic) formData.append('topic', payload.topic);
      if (payload.currentContent) {
        formData.append('currentContent', payload.currentContent);
      }
      if (payload.visibility) {
        formData.append('visibility', payload.visibility);
      }
      if (payload.taggedUserNames && payload.taggedUserNames.length > 0) {
        formData.append(
          'taggedUserNames',
          JSON.stringify(payload.taggedUserNames),
        );
      }
      if (payload.mediaItems && payload.mediaItems.length > 0) {
        formData.append('mediaItems', JSON.stringify(payload.mediaItems));
      }
      payload.mediaFiles.forEach((file) => formData.append('files', file));

      return apiClient.post<
        ApiResponse<PostSuggestionsResult>,
        ApiResponse<PostSuggestionsResult>
      >(`${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/ai-suggestions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
    }

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

  async getPostShares(
    postId: string,
    params: PostSharesQueryParams,
  ): Promise<ApiResponse<PostShareUser[]>> {
    return apiClient.get<ApiResponse<PostShareUser[]>, ApiResponse<PostShareUser[]>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.POSTS}/${postId}/shares`,
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

  async getAdminPostStatistics(): Promise<ApiResponse<AdminPostStatistics>> {
    return apiClient.get<
      ApiResponse<AdminPostStatistics>,
      ApiResponse<AdminPostStatistics>
    >(CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS_STATISTICS);
  }

  async getAdminPosts(
    params: AdminPostsQueryParams,
  ): Promise<ApiResponse<AdminPostItem[]>> {
    return apiClient.get<
      ApiResponse<AdminPostItem[]>,
      ApiResponse<AdminPostItem[]>
    >(CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS, { params });
  }

  async getAdminPostDetail(
    postId: string,
  ): Promise<ApiResponse<AdminPostDetail>> {
    return apiClient.get<
      ApiResponse<AdminPostDetail>,
      ApiResponse<AdminPostDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}`);
  }

  async hideAdminPost(
    postId: string,
    reason: string,
  ): Promise<ApiResponse<AdminPostDetail>> {
    return apiClient.patch<
      ApiResponse<AdminPostDetail>,
      ApiResponse<AdminPostDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}/hide`, { reason });
  }

  async restoreAdminPost(
    postId: string,
  ): Promise<ApiResponse<AdminPostDetail>> {
    return apiClient.patch<
      ApiResponse<AdminPostDetail>,
      ApiResponse<AdminPostDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}/restore`);
  }

  async flagAdminPostViolation(
    postId: string,
    reason: string,
  ): Promise<ApiResponse<AdminPostDetail>> {
    return apiClient.patch<
      ApiResponse<AdminPostDetail>,
      ApiResponse<AdminPostDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}/flag-violation`, {
      reason,
    });
  }

  async unflagAdminPostViolation(
    postId: string,
  ): Promise<ApiResponse<AdminPostDetail>> {
    return apiClient.patch<
      ApiResponse<AdminPostDetail>,
      ApiResponse<AdminPostDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}/unflag-violation`);
  }

  async removeAdminPost(
    postId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>, ApiResponse<null>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}`,
      reason ? { data: { reason } } : undefined,
    );
  }

  async removeAdminComment(
    postId: string,
    commentId: string,
    reason?: string,
  ): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>, ApiResponse<null>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}/comments/${commentId}`,
      reason ? { data: { reason } } : undefined,
    );
  }

  async getAdminPostAppeals(
    params: AdminPostAppealsQueryParams,
  ): Promise<ApiResponse<AdminPostAppealItem[]>> {
    return apiClient.get<
      ApiResponse<AdminPostAppealItem[]>,
      ApiResponse<AdminPostAppealItem[]>
    >(CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POST_APPEALS, { params });
  }

  async getAdminPostAppealsHistory(
    postId: string,
    params: AdminPostAppealHistoryQueryParams,
  ): Promise<ApiResponse<AdminPostAppealHistoryItem[]>> {
    return apiClient.get<
      ApiResponse<AdminPostAppealHistoryItem[]>,
      ApiResponse<AdminPostAppealHistoryItem[]>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POSTS}/${postId}/appeals`, {
      params,
    });
  }

  async restoreAdminPostAppeal(
    appealId: string,
  ): Promise<ApiResponse<AdminPostAppealItem>> {
    return apiClient.patch<
      ApiResponse<AdminPostAppealItem>,
      ApiResponse<AdminPostAppealItem>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POST_APPEALS}/${appealId}/restore`);
  }

  async rejectAdminPostAppeal(
    appealId: string,
    evidence: string,
  ): Promise<ApiResponse<AdminPostAppealItem>> {
    return apiClient.patch<
      ApiResponse<AdminPostAppealItem>,
      ApiResponse<AdminPostAppealItem>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.ADMIN_POST_APPEALS}/${appealId}/reject`, {
      evidence,
    });
  }
}

export const postRepository = new PostRepository();
