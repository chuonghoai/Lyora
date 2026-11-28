import { describe, expect, it, vi } from 'vitest';
import {
  formatRelativeTime,
  resolveRoleAccess,
  type ApiError,
} from '@/core';
import {
  createCommentSchema,
  createPostSchema,
  getTopReactions,
  hidePostModerationSchema,
  postKeys,
  PostService,
  suggestPostContentSchema,
  type AdminPostDetail,
  type AdminPostStatistics,
  type IPostRepository,
  type Post,
} from '@/features/posts';
import { ROUTES } from '@/routes/paths';

const MOCK_POST: Post = {
  id: 'post-1',
  author: {
    id: 'user-1',
    fullName: 'Nguyễn Minh Anh',
    email: 'minhanh@lyora.vn',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  content: 'Bài viết thử nghiệm từ Backend API',
  visibility: 'PUBLIC',
  media: [],
  reactionCount: 3,
  reactionBreakdown: {
    LIKE: 2,
    LOVE: 1,
    HAHA: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0,
  },
  userReaction: 'LIKE',
  commentCount: 0,
  comments: [],
  shareCount: 1,
  bookmarkCount: 2,
  isBookmarked: false,
  createdAt: new Date().toISOString(),
};

describe('Posts Feature, Schemas & Role Access Guard', () => {
  it('postKeys generates deterministic hierarchical query keys', () => {
    expect(postKeys.all).toEqual(['posts']);
    expect(postKeys.lists()).toEqual(['posts', 'list']);
    expect(postKeys.friends()).toEqual(['posts', 'friends']);
    expect(postKeys.reactions('post-1', { page: 1, limit: 6 })).toEqual([
      'posts',
      'reactions',
      'post-1',
      { page: 1, limit: 6 },
    ]);
    expect(postKeys.list({ filter: 'saved', limit: 5 })).toEqual([
      'posts',
      'list',
      { filter: 'saved', limit: 5 },
    ]);
  });

  it('validates createPostSchema and createCommentSchema with Vietnamese errors', () => {
    const emptyPost = createPostSchema.safeParse({
      content: '   ',
      visibility: 'PUBLIC',
      media: [],
    });
    expect(emptyPost.success).toBe(false);
    if (!emptyPost.success) {
      expect(emptyPost.error.issues[0]?.message).toContain('Vui lòng nhập nội dung');
    }

    const mediaOnlyPost = createPostSchema.safeParse({
      content: '',
      visibility: 'PRIVATE',
      media: [{ url: 'https://example.com/pic.jpg', type: 'IMAGE' }],
    });
    expect(mediaOnlyPost.success).toBe(true);

    const friendsPost = createPostSchema.safeParse({
      content: 'Chia sẻ với bạn bè thân thiết',
      visibility: 'FRIENDS',
      media: [],
    });
    expect(friendsPost.success).toBe(true);

    const emptyComment = createCommentSchema.safeParse({ content: '  ', media: null });
    expect(emptyComment.success).toBe(false);

    const mediaOnlyComment = createCommentSchema.safeParse({
      content: '',
      media: { url: 'blob:http://localhost/video.mp4', type: 'VIDEO' },
    });
    expect(mediaOnlyComment.success).toBe(true);
  });

  it('PostService returns live API data when repository succeeds', async () => {
    const mockRepo: IPostRepository = {
      getPosts: vi.fn().mockResolvedValue({
        success: true,
        data: [MOCK_POST],
        meta: {
          page: 1,
          limit: 5,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
      getFriends: vi.fn().mockResolvedValue({ success: true, data: [] }),
      createPost: vi.fn().mockResolvedValue({ success: true, data: MOCK_POST }),
      suggestContent: vi.fn(),
      uploadMedia: vi.fn(),
      reactPost: vi.fn(),
      getPostReactions: vi.fn(),
      toggleBookmark: vi.fn(),
      sharePost: vi.fn(),
      hidePost: vi.fn(),
      unhidePost: vi.fn(),
      addComment: vi.fn(),
      getAdminPostStatistics: vi.fn(),
      getAdminPosts: vi.fn(),
      getAdminPostDetail: vi.fn(),
      hideAdminPost: vi.fn(),
      restoreAdminPost: vi.fn(),
      removeAdminPost: vi.fn(),
      removeAdminComment: vi.fn(),
    };

    const service = new PostService(mockRepo);
    const result = await service.getPosts({ page: 1, limit: 5 });

    expect(mockRepo.getPosts).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('post-1');
  });

  it('PostService propagates 404 errors without falling back to preview/mock data', async () => {
    const notFoundError: ApiError = {
      statusCode: 404,
      message: 'Cannot GET /posts',
      error: 'NotFound',
    };

    const mockRepo: IPostRepository = {
      getPosts: vi.fn().mockRejectedValue(notFoundError),
      getFriends: vi.fn().mockRejectedValue(notFoundError),
      createPost: vi.fn().mockRejectedValue(notFoundError),
      suggestContent: vi.fn().mockRejectedValue(notFoundError),
      uploadMedia: vi.fn(),
      reactPost: vi.fn().mockRejectedValue(notFoundError),
      getPostReactions: vi.fn().mockRejectedValue(notFoundError),
      toggleBookmark: vi.fn().mockRejectedValue(notFoundError),
      sharePost: vi.fn().mockRejectedValue(notFoundError),
      hidePost: vi.fn().mockRejectedValue(notFoundError),
      unhidePost: vi.fn().mockRejectedValue(notFoundError),
      addComment: vi.fn().mockRejectedValue(notFoundError),
      getAdminPostStatistics: vi.fn().mockRejectedValue(notFoundError),
      getAdminPosts: vi.fn().mockRejectedValue(notFoundError),
      getAdminPostDetail: vi.fn().mockRejectedValue(notFoundError),
      hideAdminPost: vi.fn().mockRejectedValue(notFoundError),
      restoreAdminPost: vi.fn().mockRejectedValue(notFoundError),
      removeAdminPost: vi.fn().mockRejectedValue(notFoundError),
      removeAdminComment: vi.fn().mockRejectedValue(notFoundError),
    };

    const service = new PostService(mockRepo);
    await expect(service.getFriends()).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.getPosts({ page: 1, limit: 5 })).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(
      service.createPost({
        content: 'Bài viết mới trong giao diện Client Home',
        visibility: 'PUBLIC',
        media: [],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.reactPost('post-1', 'LOVE')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(service.toggleBookmark('post-1')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(service.sharePost('post-1')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(
      service.addComment('post-1', 'Bình luận thử nghiệm', {
        url: 'https://example.com/comment.jpg',
        type: 'IMAGE',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      service.getPostReactions('post-1', { page: 1, limit: 6 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('PostService rethrows real non-404 API errors (e.g. 401/500)', async () => {
    const serverError: ApiError = {
      statusCode: 500,
      message: 'Lỗi máy chủ',
      error: 'InternalServerError',
    };
    const mockRepo: IPostRepository = {
      getPosts: vi.fn().mockRejectedValue(serverError),
      getFriends: vi.fn().mockRejectedValue(serverError),
      createPost: vi.fn(),
      suggestContent: vi.fn(),
      uploadMedia: vi.fn(),
      reactPost: vi.fn(),
      getPostReactions: vi.fn(),
      toggleBookmark: vi.fn(),
      sharePost: vi.fn(),
      hidePost: vi.fn(),
      unhidePost: vi.fn(),
      addComment: vi.fn(),
      getAdminPostStatistics: vi.fn(),
      getAdminPosts: vi.fn(),
      getAdminPostDetail: vi.fn(),
      hideAdminPost: vi.fn(),
      restoreAdminPost: vi.fn(),
      removeAdminPost: vi.fn(),
      removeAdminComment: vi.fn(),
    };

    const service = new PostService(mockRepo);
    await expect(service.getPosts({ page: 1, limit: 5 })).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('resolveRoleAccess strictly prevents CLIENT from accessing admin routes', () => {
    const clientToAdmin = resolveRoleAccess({
      isAuthenticated: true,
      userRole: 'CLIENT',
      allowedRoles: ['ADMIN'],
      requireAuth: true,
    });
    expect(clientToAdmin.allowed).toBe(false);
    if (!clientToAdmin.allowed) {
      expect(clientToAdmin.redirectTo).toBe(ROUTES.CLIENT.ROOT);
      expect(clientToAdmin.reason).toBe('FORBIDDEN');
      expect(clientToAdmin.warningMessage).toBeTruthy();
    }

    const guestToClient = resolveRoleAccess({
      isAuthenticated: false,
      userRole: null,
      allowedRoles: ['CLIENT'],
      requireAuth: true,
    });
    expect(guestToClient.allowed).toBe(false);
    if (!guestToClient.allowed) {
      expect(guestToClient.redirectTo).toBe(ROUTES.AUTH.LOGIN);
      expect(guestToClient.reason).toBe('UNAUTHENTICATED');
    }

    const adminToClient = resolveRoleAccess({
      isAuthenticated: true,
      userRole: 'ADMIN',
      allowedRoles: ['CLIENT'],
      requireAuth: true,
    });
    expect(adminToClient.allowed).toBe(false);
    if (!adminToClient.allowed) {
      expect(adminToClient.redirectTo).toBe(ROUTES.ADMIN.DASHBOARD);
    }

    const clientToClient = resolveRoleAccess({
      isAuthenticated: true,
      userRole: 'CLIENT',
      allowedRoles: ['CLIENT'],
      requireAuth: true,
    });
    expect(clientToClient.allowed).toBe(true);
  });

  it('validates AUDIO media and uploads files through the repository', async () => {
    const audioPost = createPostSchema.safeParse({
      content: '',
      visibility: 'PUBLIC',
      media: [
        {
          id: 'audio-1',
          url: 'https://res.cloudinary.com/demo/video/upload/voice.webm',
          type: 'AUDIO',
          duration: 12,
        },
      ],
    });
    expect(audioPost.success).toBe(true);

    const uploaded = [
      { id: 'cld-1', url: 'https://res.cloudinary.com/demo/image/upload/a.jpg', type: 'IMAGE' as const },
    ];
    const mockRepo = {
      uploadMedia: vi.fn().mockResolvedValue({ success: true, data: uploaded }),
    } as unknown as IPostRepository;

    const service = new PostService(mockRepo);
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    expect(await service.uploadMedia([file])).toEqual(uploaded);
    expect(mockRepo.uploadMedia).toHaveBeenCalledWith([file]);
    expect(await service.uploadMedia([])).toEqual([]);
  });

  it('formats relative time and extracts top reactions accurately', () => {
    expect(formatRelativeTime(new Date())).toBe('Vừa xong');
    const top = getTopReactions(MOCK_POST.reactionBreakdown);
    expect(top.map((r) => r.type)).toEqual(['LIKE', 'LOVE']);
  });

  it('validates suggestPostContentSchema with Vietnamese errors and full post context', () => {
    const emptyInput = suggestPostContentSchema.safeParse({
      topic: '   ',
      currentContent: '',
      tone: 'FRIENDLY',
    });
    expect(emptyInput.success).toBe(false);
    if (!emptyInput.success) {
      expect(emptyInput.error.issues[0]?.message).toBe(
        'Vui lòng nhập ý chính, viết vài dòng hoặc đính kèm ảnh/video/ghi âm để AI gợi ý',
      );
    }

    const tooLongTopic = suggestPostContentSchema.safeParse({
      topic: 'a'.repeat(2001),
      tone: 'CONCISE',
    });
    expect(tooLongTopic.success).toBe(false);

    const longTopicOk = suggestPostContentSchema.safeParse({
      topic: 'a'.repeat(2000),
      tone: 'CONCISE',
    });
    expect(longTopicOk.success).toBe(true);

    const topicOnly = suggestPostContentSchema.safeParse({
      topic: '  Đi Đà Lạt cuối tuần  ',
      tone: 'FRIENDLY',
    });
    expect(topicOnly.success).toBe(true);

    const contentOnly = suggestPostContentSchema.safeParse({
      currentContent: 'Hôm nay trời xanh mây trắng',
      tone: 'INSPIRING',
    });
    expect(contentOnly.success).toBe(true);

    const mediaOnly = suggestPostContentSchema.safeParse({
      topic: '',
      currentContent: '',
      tone: 'FRIENDLY',
      mediaItems: [{ type: 'IMAGE', fileName: 'hoang-hon.jpg' }],
    });
    expect(mediaOnly.success).toBe(true);
  });

  it('PostService.suggestContent validates, trims, forwards full context, and does not fallback on 404', async () => {
    const suggestionResult = {
      tone: 'FRIENDLY' as const,
      suggestions: [
        { id: 'sug-1', content: 'Cuối tuần lên Đà Lạt săn mây thôi!' },
        { id: 'sug-2', content: 'Ai đi Đà Lạt hít thở không khí lạnh không?' },
        { id: 'sug-3', content: 'Gói ghém chút bình yên mang về từ Đà Lạt.' },
      ],
    };

    const mockRepo = {
      suggestContent: vi.fn().mockResolvedValue({
        success: true,
        data: suggestionResult,
      }),
    } as unknown as IPostRepository;

    const service = new PostService(mockRepo);
    const data = await service.suggestContent({
      topic: '  Đà Lạt cuối tuần  ',
      currentContent: '   ',
      tone: 'FRIENDLY',
    });

    expect(mockRepo.suggestContent).toHaveBeenCalledWith({
      tone: 'FRIENDLY',
      topic: 'Đà Lạt cuối tuần',
    });
    expect(data).toEqual(suggestionResult);

    const photo = new File(['img-bytes'], 'da-lat.jpg', { type: 'image/jpeg' });
    await service.suggestContent({
      tone: 'INSPIRING',
      visibility: 'FRIENDS',
      taggedUserNames: ['  Minh Anh ', ''],
      mediaItems: [{ type: 'IMAGE', fileName: 'da-lat.jpg' }],
      mediaFiles: [photo],
    });
    expect(mockRepo.suggestContent).toHaveBeenLastCalledWith({
      tone: 'INSPIRING',
      visibility: 'FRIENDS',
      taggedUserNames: ['Minh Anh'],
      mediaItems: [{ type: 'IMAGE', fileName: 'da-lat.jpg' }],
      mediaFiles: [photo],
    });

    await expect(
      service.suggestContent({ topic: '', currentContent: '', tone: 'FRIENDLY' }),
    ).rejects.toThrow(
      'Vui lòng nhập ý chính, viết vài dòng hoặc đính kèm ảnh/video/ghi âm để AI gợi ý',
    );

    const notFoundError: ApiError = {
      statusCode: 404,
      message: 'Cannot POST /posts/ai-suggestions',
      error: 'NotFound',
    };
    const failingRepo = {
      suggestContent: vi.fn().mockRejectedValue(notFoundError),
    } as unknown as IPostRepository;
    const failingService = new PostService(failingRepo);

    await expect(
      failingService.suggestContent({ topic: 'Cà phê sáng', tone: 'FUNNY' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('supports Admin Post Management keys, schemas, and service operations', async () => {
    expect(postKeys.adminAll()).toEqual(['posts', 'admin']);
    expect(postKeys.adminStats()).toEqual(['posts', 'admin', 'statistics']);
    expect(postKeys.adminList({ page: 1, status: 'HIDDEN' })).toEqual([
      'posts',
      'admin',
      'list',
      { page: 1, status: 'HIDDEN' },
    ]);
    expect(postKeys.adminDetail('post-1')).toEqual([
      'posts',
      'admin',
      'detail',
      'post-1',
    ]);

    expect(hidePostModerationSchema.safeParse({ reason: 'abc' }).success).toBe(
      false,
    );
    expect(
      hidePostModerationSchema.safeParse({
        reason: 'Vi phạm quy tắc cộng đồng',
      }).success,
    ).toBe(true);

    const mockStats: AdminPostStatistics = {
      totalPosts: 12,
      activePosts: 10,
      hiddenPosts: 2,
      postsToday: 3,
      postsThisMonth: 9,
      withMediaCount: 5,
      adminPostsCount: 2,
      visibilityBreakdown: { PUBLIC: 8, FRIENDS: 2, PRIVATE: 2 },
    };

    const mockDetail: AdminPostDetail = {
      id: 'post-admin-1',
      author: {
        id: 'user-1',
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@lyora.vn',
        avatarUrl: null,
        role: 'CLIENT',
      },
      content: 'Bài viết cần kiểm duyệt',
      visibility: 'PUBLIC',
      media: [],
      taggedUserIds: [],
      moderationStatus: 'HIDDEN',
      moderationReason: 'Nội dung quảng cáo trái phép',
      moderatedAt: new Date().toISOString(),
      moderatedBy: {
        id: 'admin-1',
        fullName: 'Quản Trị',
        email: 'admin@lyora.vn',
      },
      reactionCount: 0,
      reactionBreakdown: {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      },
      commentCount: 0,
      comments: [],
      shareCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const adminRepo = {
      getAdminPostStatistics: vi
        .fn()
        .mockResolvedValue({ success: true, data: mockStats }),
      getAdminPosts: vi
        .fn()
        .mockResolvedValue({ success: true, data: [mockDetail] }),
      getAdminPostDetail: vi
        .fn()
        .mockResolvedValue({ success: true, data: mockDetail }),
      hideAdminPost: vi
        .fn()
        .mockResolvedValue({ success: true, data: mockDetail }),
      restoreAdminPost: vi.fn().mockResolvedValue({
        success: true,
        data: {
          ...mockDetail,
          moderationStatus: 'ACTIVE',
          moderationReason: null,
        },
      }),
      removeAdminPost: vi
        .fn()
        .mockResolvedValue({ success: true, data: null }),
      removeAdminComment: vi
        .fn()
        .mockResolvedValue({ success: true, data: null }),
    } as unknown as IPostRepository;

    const service = new PostService(adminRepo);
    expect(await service.getAdminPostStatistics()).toEqual(mockStats);

    const listRes = await service.getAdminPosts({
      page: 1,
      limit: 10,
      search: '  kiểm duyệt ',
      status: 'ALL',
    });
    expect(adminRepo.getAdminPosts).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'kiểm duyệt',
    });
    expect(listRes.items).toHaveLength(1);

    await expect(service.hidePostAsAdmin('post-admin-1', '  ')).rejects.toThrow(
      'Vui lòng nhập lý do ẩn bài viết tối thiểu 5 ký tự',
    );

    const hidden = await service.hidePostAsAdmin(
      'post-admin-1',
      '  Nội dung quảng cáo trái phép  ',
    );
    expect(adminRepo.hideAdminPost).toHaveBeenCalledWith(
      'post-admin-1',
      'Nội dung quảng cáo trái phép',
    );
    expect(hidden.moderationStatus).toBe('HIDDEN');

    const restored = await service.restorePostAsAdmin('post-admin-1');
    expect(restored.moderationStatus).toBe('ACTIVE');

    await service.removePostAsAdmin('post-admin-1', '  Vi phạm lặp lại  ');
    expect(adminRepo.removeAdminPost).toHaveBeenCalledWith(
      'post-admin-1',
      'Vi phạm lặp lại',
    );

    await service.removeCommentAsAdmin('post-admin-1', 'cmt-1', '  Spam  ');
    expect(adminRepo.removeAdminComment).toHaveBeenCalledWith(
      'post-admin-1',
      'cmt-1',
      'Spam',
    );
  });
});
