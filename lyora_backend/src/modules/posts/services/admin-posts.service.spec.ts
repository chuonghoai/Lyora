import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../../common/enums/role.enum';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { User } from '../../users/entities/user.entity';
import { PostComment } from '../entities/post-comment.entity';
import { PostReaction } from '../entities/post-reaction.entity';
import { Post } from '../entities/post.entity';
import { PostModerationStatus, PostVisibility } from '../enums/post.enums';
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

    const service = new AdminPostsService(
      postRepo,
      reactionRepo,
      commentRepo,
      userRepo,
      dataSource,
      notificationsService,
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
    };
  }

  it('getStatistics aggregates real counts and visibility breakdown', async () => {
    const { service, createPostQb } = setupService();
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

    const stats = await service.getStatistics();
    expect(stats).toEqual({
      totalPosts: 15,
      activePosts: 13,
      hiddenPosts: 2,
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

  it('hidePost sets HIDDEN status, stores reason, and notifies member author (but not self)', async () => {
    const { service, findOnePost, savePost, createModerationNotice } =
      setupService();
    const memberPost = createFixture(memberId);
    findOnePost.mockResolvedValue(memberPost);
    savePost.mockImplementation((entity: Post) => Promise.resolve(entity));

    const hidden = await service.hidePost(adminUser, postId, {
      reason: 'Ngôn từ thiếu chuẩn mực cộng đồng',
    });

    expect(savePost).toHaveBeenCalledTimes(1);
    expect(hidden.moderationStatus).toBe(PostModerationStatus.HIDDEN);
    expect(hidden.moderationReason).toBe('Ngôn từ thiếu chuẩn mực cộng đồng');
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: memberId,
        actorId: adminUser.id,
        type: NotificationType.POST_HIDDEN,
      }),
    );

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
      }),
    );
  });
});
