import type { PaginationMeta } from '@/core';
import {
  flagPostViolationSchema,
  hidePostModerationSchema,
  rejectPostAppealSchema,
  removeModerationReasonSchema,
  suggestPostContentSchema,
  updatePostSchema,
} from '../models/post.model';
import { postRepository, type IPostRepository } from '../repositories/post.repository';
import type {
  AdminPostAppealHistoryQueryParams,
  AdminPostAppealItem,
  AdminPostAppealsQueryParams,
  AdminPostDetail,
  AdminPostsQueryParams,
  AdminPostStatistics,
  CreatePostAppealPayload,
  CreatePostPayload,
  PaginatedAdminPostAppealHistoryResult,
  PaginatedAdminPostAppealsResult,
  PaginatedAdminPostsResult,
  PaginatedPostCommentsResult,
  PaginatedPostReactionsResult,
  PaginatedPostSharesResult,
  PaginatedPostsResult,
  Post,
  PostAppealSummary,
  PostAuthor,
  PostComment,
  PostCommentsQueryParams,
  PostMediaItem,
  PostReactionsQueryParams,
  PostSharesQueryParams,
  PostsQueryParams,
  PostSuggestionsResult,
  ReactionBreakdown,
  ReactionType,
  SuggestPostContentPayload,
  UpdatePostPayload,
} from '../types/post.types';

export interface IPostService {
  getPosts(params: PostsQueryParams): Promise<PaginatedPostsResult>;
  getPostById(postId: string): Promise<Post>;
  getPostComments(
    postId: string,
    params: PostCommentsQueryParams,
  ): Promise<PaginatedPostCommentsResult>;
  createPostAppeal(payload: CreatePostAppealPayload): Promise<PostAppealSummary>;
  getFriends(): Promise<PostAuthor[]>;
  uploadMedia(files: File[]): Promise<PostMediaItem[]>;
  createPost(payload: CreatePostPayload): Promise<Post>;
  updatePost(payload: UpdatePostPayload): Promise<Post>;
  suggestContent(payload: SuggestPostContentPayload): Promise<PostSuggestionsResult>;
  reactPost(postId: string, reactionType: ReactionType): Promise<Post>;
  getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<PaginatedPostReactionsResult>;
  getPostShares(
    postId: string,
    params: PostSharesQueryParams,
  ): Promise<PaginatedPostSharesResult>;
  toggleBookmark(postId: string): Promise<Post>;
  sharePost(postId: string): Promise<Post>;
  hidePost(postId: string): Promise<{ hidden: boolean }>;
  unhidePost(postId: string): Promise<{ hidden: boolean }>;
  addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<PostComment>;
  getAdminPostStatistics(): Promise<AdminPostStatistics>;
  getAdminPosts(params: AdminPostsQueryParams): Promise<PaginatedAdminPostsResult>;
  getAdminPostDetail(postId: string): Promise<AdminPostDetail>;
  hidePostAsAdmin(postId: string, reason: string): Promise<AdminPostDetail>;
  restorePostAsAdmin(postId: string): Promise<AdminPostDetail>;
  flagPostViolationAsAdmin(postId: string, reason: string): Promise<AdminPostDetail>;
  unflagPostViolationAsAdmin(postId: string): Promise<AdminPostDetail>;
  removePostAsAdmin(postId: string, reason?: string): Promise<void>;
  removeCommentAsAdmin(
    postId: string,
    commentId: string,
    reason?: string,
  ): Promise<void>;
  getAdminPostAppeals(
    params?: AdminPostAppealsQueryParams,
  ): Promise<PaginatedAdminPostAppealsResult>;
  getAdminPostAppealsHistory(
    postId: string,
    params?: AdminPostAppealHistoryQueryParams,
  ): Promise<PaginatedAdminPostAppealHistoryResult>;
  restorePostAppealAsAdmin(appealId: string): Promise<AdminPostAppealItem>;
  rejectPostAppealAsAdmin(
    appealId: string,
    evidence: string,
  ): Promise<AdminPostAppealItem>;
}

function createEmptyBreakdown(): ReactionBreakdown {
  return { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 };
}

export class PostService implements IPostService {
  private repository: IPostRepository;

  constructor(repository: IPostRepository = postRepository) {
    this.repository = repository;
  }

  async getPosts(params: PostsQueryParams): Promise<PaginatedPostsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 5;

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
    };
  }

  async getPostById(postId: string): Promise<Post> {
    const response = await this.repository.getPostById(postId);
    return response.data;
  }

  async getPostComments(
    postId: string,
    params: PostCommentsQueryParams = {},
  ): Promise<PaginatedPostCommentsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = await this.repository.getPostComments(postId, {
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
    };
  }

  async createPostAppeal(
    payload: CreatePostAppealPayload,
  ): Promise<PostAppealSummary> {
    const response = await this.repository.createPostAppeal(payload);
    return response.data;
  }

  async getFriends(): Promise<PostAuthor[]> {
    const response = await this.repository.getFriends();
    return response.data ?? [];
  }

  async uploadMedia(files: File[]): Promise<PostMediaItem[]> {
    if (files.length === 0) return [];
    const response = await this.repository.uploadMedia(files);
    return response.data ?? [];
  }

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const response = await this.repository.createPost(payload);
    return response.data;
  }

  async updatePost(payload: UpdatePostPayload): Promise<Post> {
    const parsed = updatePostSchema.safeParse({
      content: payload.content,
      visibility: payload.visibility,
      media: payload.media,
    });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Nội dung bài viết chưa hợp lệ',
      );
    }

    const response = await this.repository.updatePost(payload.postId, {
      content: parsed.data.content,
      visibility: parsed.data.visibility,
      media: parsed.data.media,
      taggedUserIds: payload.taggedUserIds ?? [],
    });
    return response.data;
  }

  async suggestContent(
    payload: SuggestPostContentPayload,
  ): Promise<PostSuggestionsResult> {
    const parsed = suggestPostContentSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Thông tin gợi ý chưa hợp lệ',
      );
    }

    const taggedUserNames = (parsed.data.taggedUserNames ?? [])
      .map((name) => name.trim())
      .filter(Boolean);
    const mediaItems = parsed.data.mediaItems ?? [];
    const mediaFiles = parsed.data.mediaFiles ?? [];

    const cleanPayload: SuggestPostContentPayload = {
      tone: parsed.data.tone,
      ...(parsed.data.topic ? { topic: parsed.data.topic } : {}),
      ...(parsed.data.currentContent
        ? { currentContent: parsed.data.currentContent }
        : {}),
      ...(parsed.data.visibility ? { visibility: parsed.data.visibility } : {}),
      ...(taggedUserNames.length > 0 ? { taggedUserNames } : {}),
      ...(mediaItems.length > 0 ? { mediaItems } : {}),
      ...(mediaFiles.length > 0 ? { mediaFiles } : {}),
    };

    const response = await this.repository.suggestContent(cleanPayload);
    return response.data;
  }

  async reactPost(postId: string, reactionType: ReactionType): Promise<Post> {
    const response = await this.repository.reactPost(postId, reactionType);
    return response.data;
  }

  async getPostReactions(
    postId: string,
    params: PostReactionsQueryParams,
  ): Promise<PaginatedPostReactionsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 6;
    const response = await this.repository.getPostReactions(postId, {
      ...params,
      page,
      limit,
    });
    const items = response.data ?? [];
    const breakdown = createEmptyBreakdown();
    for (const item of items) {
      breakdown[item.reactionType] = (breakdown[item.reactionType] ?? 0) + 1;
    }
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
      breakdown,
    };
  }

  async getPostShares(
    postId: string,
    params: PostSharesQueryParams,
  ): Promise<PaginatedPostSharesResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = await this.repository.getPostShares(postId, {
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
    };
  }

  async toggleBookmark(postId: string): Promise<Post> {
    const response = await this.repository.toggleBookmark(postId);
    return response.data;
  }

  async sharePost(postId: string): Promise<Post> {
    const response = await this.repository.sharePost(postId);
    return response.data;
  }

  async hidePost(postId: string): Promise<{ hidden: boolean }> {
    const response = await this.repository.hidePost(postId);
    return response.data;
  }

  async unhidePost(postId: string): Promise<{ hidden: boolean }> {
    const response = await this.repository.unhidePost(postId);
    return response.data;
  }

  async addComment(
    postId: string,
    content: string,
    media?: PostMediaItem | null,
  ): Promise<PostComment> {
    const response = await this.repository.addComment(postId, content, media);
    return response.data;
  }

  async getAdminPostStatistics(): Promise<AdminPostStatistics> {
    const response = await this.repository.getAdminPostStatistics();
    return response.data;
  }

  async getAdminPosts(
    params: AdminPostsQueryParams = {},
  ): Promise<PaginatedAdminPostsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const cleanParams: AdminPostsQueryParams = {
      page,
      limit,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.status && params.status !== 'ALL'
        ? { status: params.status }
        : {}),
      ...(params.visibility ? { visibility: params.visibility } : {}),
      ...(params.authorRole ? { authorRole: params.authorRole } : {}),
      ...(params.hasMedia ? { hasMedia: params.hasMedia } : {}),
    };

    const response = await this.repository.getAdminPosts(cleanParams);
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
    };
  }

  async getAdminPostDetail(postId: string): Promise<AdminPostDetail> {
    const response = await this.repository.getAdminPostDetail(postId);
    return response.data;
  }

  async hidePostAsAdmin(
    postId: string,
    reason: string,
  ): Promise<AdminPostDetail> {
    const parsed = hidePostModerationSchema.safeParse({ reason });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Lý do ẩn bài viết chưa hợp lệ',
      );
    }
    const response = await this.repository.hideAdminPost(
      postId,
      parsed.data.reason,
    );
    return response.data;
  }

  async restorePostAsAdmin(postId: string): Promise<AdminPostDetail> {
    const response = await this.repository.restoreAdminPost(postId);
    return response.data;
  }

  async flagPostViolationAsAdmin(
    postId: string,
    reason: string,
  ): Promise<AdminPostDetail> {
    const parsed = flagPostViolationSchema.safeParse({ reason });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ??
          'Lý do đánh dấu vi phạm chưa hợp lệ',
      );
    }
    const response = await this.repository.flagAdminPostViolation(
      postId,
      parsed.data.reason,
    );
    return response.data;
  }

  async unflagPostViolationAsAdmin(postId: string): Promise<AdminPostDetail> {
    const response = await this.repository.unflagAdminPostViolation(postId);
    return response.data;
  }

  async removePostAsAdmin(postId: string, reason?: string): Promise<void> {
    const parsed = removeModerationReasonSchema.safeParse({ reason });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Lý do gỡ bỏ chưa hợp lệ',
      );
    }
    const cleanReason = parsed.data.reason?.trim() || undefined;
    await this.repository.removeAdminPost(postId, cleanReason);
  }

  async removeCommentAsAdmin(
    postId: string,
    commentId: string,
    reason?: string,
  ): Promise<void> {
    const parsed = removeModerationReasonSchema.safeParse({ reason });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Lý do gỡ bình luận chưa hợp lệ',
      );
    }
    const cleanReason = parsed.data.reason?.trim() || undefined;
    await this.repository.removeAdminComment(postId, commentId, cleanReason);
  }

  async getAdminPostAppeals(
    params: AdminPostAppealsQueryParams = {},
  ): Promise<PaginatedAdminPostAppealsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const cleanParams: AdminPostAppealsQueryParams = {
      page,
      limit,
      ...(params.status && params.status !== 'ALL'
        ? { status: params.status }
        : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    };

    const response = await this.repository.getAdminPostAppeals(cleanParams);
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
    };
  }

  async getAdminPostAppealsHistory(
    postId: string,
    params: AdminPostAppealHistoryQueryParams = {},
  ): Promise<PaginatedAdminPostAppealHistoryResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = await this.repository.getAdminPostAppealsHistory(postId, {
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
    };
  }

  async restorePostAppealAsAdmin(
    appealId: string,
  ): Promise<AdminPostAppealItem> {
    const response = await this.repository.restoreAdminPostAppeal(appealId);
    return response.data;
  }

  async rejectPostAppealAsAdmin(
    appealId: string,
    evidence: string,
  ): Promise<AdminPostAppealItem> {
    const parsed = rejectPostAppealSchema.safeParse({ evidence });
    if (!parsed.success) {
      throw new Error(
        parsed.error.issues[0]?.message ?? 'Minh chứng chưa hợp lệ',
      );
    }
    const response = await this.repository.rejectAdminPostAppeal(
      appealId,
      parsed.data.evidence,
    );
    return response.data;
  }
}

export const postService = new PostService();
