import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../../common/enums/role.enum';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { User } from '../../users/entities/user.entity';
import { PostAppeal } from '../entities/post-appeal.entity';
import { PostComment } from '../entities/post-comment.entity';
import { PostReaction } from '../entities/post-reaction.entity';
import { Post } from '../entities/post.entity';
import {
  PostAppealStatus,
  PostModerationStatus,
  PostVisibility,
} from '../enums/post.enums';
import { AdminPostsService } from './admin-posts.service';

describe('AdminPostsService (Post Supervision & Moderation)', () => {
  const adminUser: AuthenticatedUser = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    email: 'admin@lyora.vn',
    role: UserRole.ADMIN,
  };
  const adminFullName = 'Quản Trị Viên';

  const memberId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const postId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const commentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  function createFixture(authorId = memberId): Post {
    return {
      id: postId,
      authorId,
      author: {
        id: authorId,
        fullName: 'Lê Minh Thư',
        email: 'minhthu@lyora.vn',
        avatarUrl: null,
        role: authorId === adminUser.id ? UserRole.ADMIN : UserRole.CLIENT,
      } as User,
      content: 'Nội dung bài viết cần kiểm duyệt trên cộng đồng',
      visibility: PostVisibility.PUBLIC,
      media: [],
      taggedUserIds: [],
      moderationStatus: PostModerationStatus.ACTIVE,
      moderationReason: null,
      moderatedAt: null,
      moderatedById: null,
      reactionsCount: 4,
      commentsCount: 2,
      sharesCount: 1,
      createdAt: new Date('2026-11-28T01:00:00.000Z'),
      updatedAt: new Date('2026-11-28T01:00:00.000Z'),
    };
  }

  function setupService() {
    const findOnePost = jest.fn();
    const savePost = jest.fn();
    const softDeletePost = jest.fn().mockResolvedValue(undefined);
    const createPostQb = jest.fn();

    const postRepo = {
      findOne: findOnePost,
      save: savePost,
      softDelete: softDeletePost,
      createQueryBuilder: createPostQb,
    } as unknown as Repository<Post>;

    const findReactions = jest.fn().mockResolvedValue([]);
    const reactionRepo = {
      find: findReactions,
    } as unknown as Repository<PostReaction>;

    const findComments = jest.fn().mockResolvedValue([]);
    const findOneComment = jest.fn();
    const commentRepo = {
      find: findComments,
      findOne: findOneComment,
    } as unknown as Repository<PostComment>;

    const findUsers = jest.fn().mockResolvedValue([
      {
        id: adminUser.id,
        fullName: adminFullName,
        email: adminUser.email,
      },
    ]);
    const userRepo = {
      find: findUsers,
    } as unknown as Repository<User>;

    const txSoftDelete = jest.fn().mockResolvedValue(undefined);
    const txUpdateExecute = jest.fn().mockResolvedValue(undefined);
    const txManager = {
      softDelete: txSoftDelete,
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: txUpdateExecute,
      }),
    };

    const transactionFn = jest.fn((cb: (mgr: typeof txManager) => unknown) =>
      cb(txManager),
    );
    const dataSource = {
      transaction: transactionFn,
    } as unknown as DataSource;

    const createModerationNotice = jest.fn().mockResolvedValue(undefined);
    const notificationsService = {
      createModerationNotice,
    } as unknown as NotificationsService;

    const appealFindOne = jest.fn();
    const appealFind = jest.fn().mockResolvedValue([]);
    const appealFindAndCount = jest.fn().mockResolvedValue([[], 0]);
    const appealSave = jest.fn((entity: PostAppeal) => Promise.resolve(entity));
    const appealUpdate = jest.fn().mockResolvedValue(undefined);
    const appealSoftDelete = jest.fn().mockResolvedValue(undefined);
    const appealCount = jest.fn().mockResolvedValue(2);
    const appealCreateQb = jest.fn();
    const appealRepo = {
      findOne: appealFindOne,
      find: appealFind,
      findAndCount: appealFindAndCount,
      save: appealSave,
      update: appealUpdate,
      softDelete: appealSoftDelete,
      count: appealCount,
      createQueryBuilder: appealCreateQb,
    } as unknown as Repository<PostAppeal>;

    const service = new AdminPostsService(
      postRepo,
      reactionRepo,
      commentRepo,
      userRepo,
      dataSource,
      notificationsService,
      appealRepo,
    );

    return {
      service,
      findOnePost,
      savePost,
      softDeletePost,
      createPostQb,
      findComments,
      findOneComment,
      txSoftDelete,
      txUpdateExecute,
      createModerationNotice,
      appealFindOne,
      appealFind,
      appealFindAndCount,
      appealSave,
      appealUpdate,
      appealSoftDelete,
      appealCount,
      appealCreateQb,
    };
  }

  it('getStatistics aggregates real counts and visibility breakdown', async () => {
    const { service, createPostQb, appealCreateQb } = setupService();
    const qbMock = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalPosts: '15',
        activePosts: '13',
        hiddenPosts: '2',
        postsToday: '3',
        postsThisMonth: '11',
        withMediaCount: '6',
        adminPostsCount: '2',
        publicCount: '10',
        friendsCount: '3',
        privateCount: '2',
      }),
    };
    createPostQb.mockReturnValue(qbMock);
    appealCreateQb.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ pendingCount: '2' }),
    });

    const stats = await service.getStatistics();
    expect(stats).toEqual({
      totalPosts: 15,
      activePosts: 13,
      hiddenPosts: 2,
      pendingAppealsCount: 2,
      postsToday: 3,
      postsThisMonth: 11,
      withMediaCount: 6,
      adminPostsCount: 2,
      visibilityBreakdown: {
        PUBLIC: 10,
        FRIENDS: 3,
        PRIVATE: 2,
      },
    });
  });

  it('findAllPaginated applies filters and maps author email/role for Admin', async () => {
    const { service, createPostQb } = setupService();
    const post = createFixture();
    const andWhere = jest.fn().mockReturnThis();
    const qbMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere,
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[post], 1]),
    };
    createPostQb.mockReturnValue(qbMock);

    const res = await service.findAllPaginated({
      page: 1,
      limit: 10,
      status: PostModerationStatus.ACTIVE,
      visibility: PostVisibility.PUBLIC,
      authorRole: UserRole.CLIENT,
      hasMedia: 'false',
      search: 'kiểm duyệt',
    });

    expect(andWhere).toHaveBeenCalledTimes(5);
    expect(res.meta.totalItems).toBe(1);
    expect(res.items[0]?.author.email).toBe('minhthu@lyora.vn');
    expect(res.items[0]?.author.role).toBe(UserRole.CLIENT);
  });

  it('hidePost sets HIDDEN status, resets prior appeals on new cycle, stores reason, and notifies member author', async () => {
    const {
      service,
      findOnePost,
      savePost,
      appealSoftDelete,
      createModerationNotice,
    } = setupService();
    const memberPost = createFixture(memberId);
    findOnePost.mockResolvedValue(memberPost);
    savePost.mockImplementation((entity: Post) => Promise.resolve(entity));

    const hidden = await service.hidePost(adminUser, postId, {
      reason: 'Ngôn từ thiếu chuẩn mực cộng đồng',
    });

    expect(savePost).toHaveBeenCalledTimes(1);
    expect(appealSoftDelete).toHaveBeenCalledWith({ postId });
    expect(hidden.moderationStatus).toBe(PostModerationStatus.HIDDEN);
    expect(hidden.moderationReason).toBe('Ngôn từ thiếu chuẩn mực cộng đồng');
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        actorId: adminUser.id,
        type: NotificationType.POST_HIDDEN,
        targetPath: `/post/${postId}`,
      }),
    );

    appealSoftDelete.mockClear();
    createModerationNotice.mockClear();
    const alreadyHiddenPost = createFixture(memberId);
    alreadyHiddenPost.moderationStatus = PostModerationStatus.HIDDEN;
    findOnePost.mockResolvedValue(alreadyHiddenPost);
    await service.hidePost(adminUser, postId, {
      reason: 'Cập nhật lý do ẩn bổ sung',
    });
    expect(appealSoftDelete).not.toHaveBeenCalled();

    createModerationNotice.mockClear();
    const adminOwnPost = createFixture(adminUser.id);
    findOnePost.mockResolvedValue(adminOwnPost);
    await service.hidePost(adminUser, postId, {
      reason: 'Tạm ẩn thông báo cũ',
    });
    expect(createModerationNotice).not.toHaveBeenCalled();
  });

  it('restorePost sets ACTIVE status, clears reason, and sends POST_RESTORED notice', async () => {
    const { service, findOnePost, savePost, createModerationNotice } =
      setupService();
    const post = createFixture(memberId);
    post.moderationStatus = PostModerationStatus.HIDDEN;
    post.moderationReason = 'Lý do cũ';
    findOnePost.mockResolvedValue(post);
    savePost.mockImplementation((entity: Post) => Promise.resolve(entity));

    const restored = await service.restorePost(adminUser, postId);
    expect(restored.moderationStatus).toBe(PostModerationStatus.ACTIVE);
    expect(restored.moderationReason).toBeNull();
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        type: NotificationType.POST_RESTORED,
        targetPath: `/post/${postId}`,
      }),
    );
  });

  it('removePost soft-deletes post and sends POST_REMOVED notice', async () => {
    const { service, findOnePost, softDeletePost, createModerationNotice } =
      setupService();
    findOnePost.mockResolvedValue(createFixture(memberId));

    await service.removePost(adminUser, postId, {
      reason: 'Quảng cáo trái phép lặp lại',
    });

    expect(softDeletePost).toHaveBeenCalledWith(postId);
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        type: NotificationType.POST_REMOVED,
        targetPath: `/post/${postId}`,
      }),
    );
  });

  it('removeComment deletes comment in transaction, updates count, and notifies commenter', async () => {
    const {
      service,
      findOnePost,
      findOneComment,
      txSoftDelete,
      txUpdateExecute,
      createModerationNotice,
    } = setupService();

    findOnePost.mockResolvedValue(createFixture(memberId));
    findOneComment.mockResolvedValueOnce(null);

    await expect(
      service.removeComment(adminUser, postId, commentId),
    ).rejects.toThrow(NotFoundException);

    findOneComment.mockResolvedValueOnce({
      id: commentId,
      postId,
      authorId: memberId,
      content: 'Bình luận vi phạm',
    });

    await service.removeComment(adminUser, postId, commentId, {
      reason: 'Công kích cá nhân',
    });

    expect(txSoftDelete).toHaveBeenCalledWith(PostComment, commentId);
    expect(txUpdateExecute).toHaveBeenCalledTimes(1);
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        type: NotificationType.COMMENT_REMOVED,
        targetPath: `/post/${postId}`,
      }),
    );
  });

  it('supports getStatistics pendingAppealsCount, grouped getAppeals, getPostAppealsHistory, restoreAppeal and rejectAppeal with evidence', async () => {
    const {
      service,
      createPostQb,
      findOnePost,
      savePost,
      createModerationNotice,
      appealCreateQb,
      appealFindOne,
      appealFind,
      appealFindAndCount,
      appealSave,
      appealUpdate,
    } = setupService();

    const statsQb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalPosts: '5',
        activePosts: '3',
        hiddenPosts: '2',
        postsToday: '1',
        postsThisMonth: '5',
        withMediaCount: '2',
        adminPostsCount: '1',
        publicCount: '3',
        friendsCount: '1',
        privateCount: '1',
      }),
    };
    createPostQb.mockReturnValue(statsQb);
    appealCreateQb.mockReturnValueOnce({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ pendingCount: '3' }),
    });
    const stats = await service.getStatistics();
    expect(stats.pendingAppealsCount).toBe(3);

    const appealId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    const appealOlderId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const restoredPostId = '11111111-1111-4111-8111-111111111111';
    const hiddenPost = createFixture(memberId);
    hiddenPost.moderationStatus = PostModerationStatus.HIDDEN;
    hiddenPost.moderationReason = 'Spam';
    const restoredWithEvidencePost = {
      ...createFixture(memberId),
      id: restoredPostId,
      moderationStatus: PostModerationStatus.ACTIVE,
      moderationReason: null,
    } as Post;

    const appealFixture = {
      id: appealId,
      postId,
      post: hiddenPost,
      appellantId: memberId,
      appellant: hiddenPost.author,
      reasonCategory: 'Nhầm lẫn',
      reasonDetail: 'Bài viết chia sẻ kinh nghiệm học tập',
      status: PostAppealStatus.PENDING,
      adminEvidence: null,
      resolvedById: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date('2026-11-28T02:00:00.000Z'),
      updatedAt: new Date('2026-11-28T02:00:00.000Z'),
    } as PostAppeal;

    const olderRejectedRound = {
      ...appealFixture,
      id: appealOlderId,
      status: PostAppealStatus.REJECTED,
      adminEvidence: 'Minh chứng lần 1 cho bài viết',
      createdAt: new Date('2026-11-28T01:00:00.000Z'),
      updatedAt: new Date('2026-11-28T01:30:00.000Z'),
      resolvedAt: new Date('2026-11-28T01:30:00.000Z'),
    } as PostAppeal;

    const restoredPostEvidenceAppeal = {
      ...appealFixture,
      id: '22222222-2222-4222-8222-222222222222',
      postId: restoredPostId,
      post: restoredWithEvidencePost,
      status: PostAppealStatus.REJECTED,
      adminEvidence: 'Minh chứng cũ trước khi khôi phục',
      createdAt: new Date('2026-11-28T01:45:00.000Z'),
      updatedAt: new Date('2026-11-28T01:50:00.000Z'),
      resolvedAt: new Date('2026-11-28T01:50:00.000Z'),
    } as PostAppeal;

    const appealsQb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest
        .fn()
        .mockResolvedValue([
          appealFixture,
          olderRejectedRound,
          restoredPostEvidenceAppeal,
        ]),
    };
    appealCreateQb.mockReturnValueOnce(appealsQb);
    const listRes = await service.getAppeals({ page: 1, limit: 10 });
    expect(listRes.items).toHaveLength(2);
    expect(listRes.items[0]?.id).toBe(appealId);
    expect(listRes.items[0]?.totalAppealsCount).toBe(2);
    expect(listRes.items[0]?.hasEvidence).toBe(true);
    expect(listRes.items[0]?.recentAppeals).toHaveLength(2);
    expect(listRes.items[0]?.recentAppeals[0]?.adminEvidence).toBeNull();
    expect(listRes.items[0]?.recentAppeals[1]?.adminEvidence).toBe(
      'Minh chứng lần 1 cho bài viết',
    );

    // Filter RESTORED includes post that had evidence sent and was later restored
    appealCreateQb.mockReturnValueOnce(appealsQb);
    const restoredOnly = await service.getAppeals({
      page: 1,
      limit: 10,
      status: PostAppealStatus.RESTORED,
    });
    expect(restoredOnly.items.map((item) => item.postId)).toEqual([
      restoredPostId,
    ]);
    expect(restoredOnly.items[0]?.hasEvidence).toBe(true);

    // Filter REJECTED excludes posts that have already been restored
    appealCreateQb.mockReturnValueOnce(appealsQb);
    const rejectedOnly = await service.getAppeals({
      page: 1,
      limit: 10,
      status: PostAppealStatus.REJECTED,
    });
    expect(rejectedOnly.items).toHaveLength(0);

    // Paginated post appeal history includes accurate roundNumber
    findOnePost.mockResolvedValueOnce(hiddenPost);
    appealFindAndCount.mockResolvedValueOnce([
      [appealFixture, olderRejectedRound],
      2,
    ]);
    const historyRes = await service.getPostAppealsHistory(postId, {
      page: 1,
      limit: 10,
    });
    expect(historyRes.items.map((item) => item.roundNumber)).toEqual([2, 1]);

    // Reject with concrete evidence
    appealFindOne
      .mockResolvedValueOnce({ ...appealFixture })
      .mockResolvedValueOnce({
        ...appealFixture,
        status: PostAppealStatus.REJECTED,
        adminEvidence: 'Nội dung chứa liên kết quảng cáo trái phép ở đoạn 2.',
        resolvedAt: new Date('2026-11-28T03:00:00.000Z'),
        resolvedBy: {
          id: adminUser.id,
          fullName: adminFullName,
          email: adminUser.email,
        },
      });
    appealFind.mockResolvedValueOnce([
      {
        ...appealFixture,
        status: PostAppealStatus.REJECTED,
        adminEvidence: 'Nội dung chứa liên kết quảng cáo trái phép ở đoạn 2.',
      },
    ]);
    const rejected = await service.rejectAppeal(adminUser, appealId, {
      evidence: 'Nội dung chứa liên kết quảng cáo trái phép ở đoạn 2.',
    });
    expect(appealSave).toHaveBeenCalledTimes(1);
    expect(rejected.status).toBe(PostAppealStatus.REJECTED);
    expect(rejected.adminEvidence).toBe(
      'Nội dung chứa liên kết quảng cáo trái phép ở đoạn 2.',
    );
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        type: NotificationType.POST_APPEAL_REJECTED,
        targetPath: `/post/${postId}`,
      }),
    );

    // Rejecting non-pending appeal fails
    appealFindOne.mockResolvedValueOnce({
      ...appealFixture,
      status: PostAppealStatus.REJECTED,
    });
    await expect(
      service.rejectAppeal(adminUser, appealId, {
        evidence: 'Thử gửi lại lần hai không hợp lệ',
      }),
    ).rejects.toThrow(BadRequestException);

    // Restore from appeal (even after REJECTED evidence was sent, preserving evidence)
    appealFindOne
      .mockResolvedValueOnce({
        ...appealFixture,
        status: PostAppealStatus.REJECTED,
        adminEvidence: 'Minh chứng cũ',
      })
      .mockResolvedValueOnce({
        ...appealFixture,
        status: PostAppealStatus.RESTORED,
        adminEvidence: 'Minh chứng cũ',
        resolvedAt: new Date('2026-11-28T04:00:00.000Z'),
      });
    appealFind.mockResolvedValueOnce([
      {
        ...appealFixture,
        status: PostAppealStatus.RESTORED,
        adminEvidence: 'Minh chứng cũ',
      },
    ]);
    findOnePost.mockResolvedValueOnce({ ...hiddenPost });
    savePost.mockImplementation((entity: Post) => Promise.resolve(entity));

    const restored = await service.restoreAppeal(adminUser, appealId);
    expect(appealUpdate).toHaveBeenCalledTimes(2);
    expect(restored.status).toBe(PostAppealStatus.RESTORED);
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        type: NotificationType.POST_RESTORED,
        targetPath: `/post/${postId}`,
      }),
    );
  });
});
