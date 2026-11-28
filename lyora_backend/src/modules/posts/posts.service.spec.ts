import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { PostAppeal } from './entities/post-appeal.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { PostShare } from './entities/post-share.entity';
import { Post } from './entities/post.entity';
import {
  PostAppealStatus,
  PostMediaType,
  PostModerationStatus,
  PostReactionType,
  PostVisibility,
} from './enums/post.enums';
import { PostsService } from './posts.service';

describe('PostsService (Real DB Data & Empty State)', () => {
  let service: PostsService;
  let postRepo: jest.Mocked<Partial<Repository<Post>>>;
  let reactionRepo: jest.Mocked<Partial<Repository<PostReaction>>>;
  let commentRepo: jest.Mocked<Partial<Repository<PostComment>>>;
  let postShareRepo: jest.Mocked<Partial<Repository<PostShare>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let friendshipRepo: jest.Mocked<Partial<Repository<Friendship>>>;

  const currentUser: AuthenticatedUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'client@lyora.vn',
    role: UserRole.CLIENT,
  };

  beforeEach(() => {
    postRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    reactionRepo = {
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    commentRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    postShareRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    userRepo = {
      find: jest.fn().mockResolvedValue([]),
    };
    friendshipRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    service = new PostsService(
      postRepo as Repository<Post>,
      reactionRepo as Repository<PostReaction>,
      commentRepo as Repository<PostComment>,
      userRepo as Repository<User>,
      friendshipRepo as Repository<Friendship>,
      postShareRepo as Repository<PostShare>,
    );
  });

  it('trả về danh sách rỗng hợp lệ khi DB chưa có bài viết', async () => {
    const qbMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    (postRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

    const result = await service.findAllPaginated(currentUser, {
      page: 1,
      limit: 5,
    });

    expect(result.items).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(reactionRepo.find).not.toHaveBeenCalled();
    expect(commentRepo.find).not.toHaveBeenCalled();
  });

  it('tổng hợp reactionBreakdown, userReaction và comments thật từ DB thay vì stub 0', async () => {
    const postId = '22222222-2222-4222-8222-222222222222';
    const otherAuthorId = '33333333-3333-4333-8333-333333333333';

    const fakePost = {
      id: postId,
      authorId: otherAuthorId,
      author: {
        id: otherAuthorId,
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@lyora.vn',
        avatarUrl: null,
      },
      content: 'Bài viết có tương tác thật',
      visibility: PostVisibility.PUBLIC,
      media: [],
      taggedUserIds: null,
      reactionsCount: 2,
      commentsCount: 1,
      sharesCount: 0,
      createdAt: new Date('2026-11-20T08:00:00.000Z'),
      updatedAt: new Date('2026-11-20T08:00:00.000Z'),
    } as unknown as Post;

    const qbMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[fakePost], 1]),
    };
    (postRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

    (reactionRepo.find as jest.Mock).mockResolvedValue([
      {
        postId,
        userId: currentUser.id,
        type: PostReactionType.LOVE,
      },
      {
        postId,
        userId: otherAuthorId,
        type: PostReactionType.LIKE,
      },
    ]);

    (commentRepo.find as jest.Mock).mockResolvedValue([
      {
        id: 'cmt-1',
        postId,
        authorId: currentUser.id,
        author: {
          id: currentUser.id,
          fullName: 'Hà Trường Giang',
          avatarUrl: null,
        },
        content: 'Bình luận thật từ DB',
        media: null,
        createdAt: new Date('2026-11-20T08:05:00.000Z'),
      },
    ]);

    const result = await service.findAllPaginated(currentUser, {
      page: 1,
      limit: 5,
    });

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.reactionCount).toBe(2);
    expect(item.reactionBreakdown.LOVE).toBe(1);
    expect(item.reactionBreakdown.LIKE).toBe(1);
    expect(item.userReaction).toBe(PostReactionType.LOVE);
    expect(item.commentCount).toBe(1);
    expect(item.comments).toHaveLength(1);
    expect(item.comments[0]?.content).toBe('Bình luận thật từ DB');
    // Bảo vệ quyền riêng tư: không lộ email tác giả khác
    expect(item.author.email).toBeUndefined();
  });

  it('ném NotImplementedException khi gọi filter=saved chưa hỗ trợ', async () => {
    await expect(
      service.findAllPaginated(currentUser, {
        page: 1,
        limit: 5,
        filter: 'saved',
      }),
    ).rejects.toThrow(NotImplementedException);
  });

  it('cho phép bạn bè ACCEPTED xem bài viết FRIENDS và chặn người lạ', async () => {
    const postId = '44444444-4444-4444-8444-444444444444';
    const friendAuthorId = '55555555-5555-4555-8555-555555555555';
    const friendsPost = {
      id: postId,
      authorId: friendAuthorId,
      author: {
        id: friendAuthorId,
        fullName: 'Bạn Bè',
        email: 'friend@lyora.vn',
        avatarUrl: null,
      },
      content: 'Chỉ bạn bè thấy',
      visibility: PostVisibility.FRIENDS,
      media: [],
      taggedUserIds: null,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date('2026-11-20T08:00:00.000Z'),
      updatedAt: new Date('2026-11-20T08:00:00.000Z'),
    } as unknown as Post;

    (postRepo.findOne as jest.Mock).mockResolvedValue(friendsPost);
    (friendshipRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.findOne(currentUser, postId)).rejects.toThrow(
      NotFoundException,
    );

    (friendshipRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: 'fs-1',
      status: FriendshipStatus.ACCEPTED,
    });

    const visible = await service.findOne(currentUser, postId);
    expect(visible.id).toBe(postId);
  });

  it('cho phép ADMIN lọc bài viết của bất kỳ authorId nào mà không bị giới hạn visibility', async () => {
    const adminUser: AuthenticatedUser = {
      id: '99999999-9999-4999-8999-999999999999',
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };
    const targetAuthorId = '77777777-7777-4777-8777-777777777777';

    const qbMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    (postRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

    await service.findAllPaginated(adminUser, {
      page: 1,
      limit: 10,
      authorId: targetAuthorId,
    });

    expect(qbMock.where).toHaveBeenCalledWith('post.authorId = :authorId', {
      authorId: targetAuthorId,
    });
  });

  it('trả về danh sách reactions, shares phân trang và parentId bình luận cho ADMIN xem bài viết PRIVATE', async () => {
    const adminUser: AuthenticatedUser = {
      id: '99999999-9999-4999-8999-999999999999',
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };
    const postId = '88888888-8888-4888-8888-888888888888';
    const privatePost = {
      id: postId,
      authorId: '77777777-7777-4777-8777-777777777777',
      visibility: PostVisibility.PRIVATE,
    } as Post;

    (postRepo.findOne as jest.Mock).mockResolvedValue(privatePost);
    (reactionRepo.findAndCount as jest.Mock).mockResolvedValue([
      [
        {
          id: 'react-1',
          postId,
          userId: 'user-a',
          type: PostReactionType.LOVE,
          createdAt: new Date('2026-11-28T09:00:00.000Z'),
          user: {
            id: 'user-a',
            fullName: 'Lê Thu Hà',
            email: 'thuha@lyora.vn',
            avatarUrl: null,
          },
        },
      ],
      1,
    ]);
    (postShareRepo.findAndCount as jest.Mock).mockResolvedValue([
      [
        {
          id: 'share-1',
          postId,
          userId: 'user-b',
          createdAt: new Date('2026-11-28T09:30:00.000Z'),
          user: {
            id: 'user-b',
            fullName: 'Phạm Hoàng Nam',
            email: 'nam@lyora.vn',
            avatarUrl: null,
          },
        },
      ],
      1,
    ]);

    const reactionsRes = await service.getPostReactions(adminUser, postId, {
      page: 1,
      limit: 10,
      reactionType: PostReactionType.LOVE,
    });
    expect(reactionsRes.items).toHaveLength(1);
    expect(reactionsRes.items[0]?.user.email).toBe('thuha@lyora.vn');
    expect(reactionsRes.items[0]?.reactionType).toBe(PostReactionType.LOVE);
    expect(reactionsRes.meta.totalItems).toBe(1);

    const sharesRes = await service.getPostShares(adminUser, postId, {
      page: 1,
      limit: 10,
    });
    expect(sharesRes.items).toHaveLength(1);
    expect(sharesRes.items[0]?.user.fullName).toBe('Phạm Hoàng Nam');
    expect(sharesRes.items[0]?.user.email).toBe('nam@lyora.vn');
    expect(sharesRes.meta.totalItems).toBe(1);
  });

  it('chặn người lạ xem bài viết đang bị HIDDEN nhưng cho phép chính tác giả và ADMIN xem', async () => {
    const hiddenPostId = '66666666-6666-4666-8666-666666666666';
    const ownerId = '77777777-7777-4777-8777-777777777777';
    const hiddenPost = {
      id: hiddenPostId,
      authorId: ownerId,
      author: {
        id: ownerId,
        fullName: 'Chủ Bài Viết',
        email: 'owner@lyora.vn',
        avatarUrl: null,
      },
      content: 'Bài viết đã bị quản trị ẩn',
      visibility: PostVisibility.PUBLIC,
      moderationStatus: PostModerationStatus.HIDDEN,
      media: [],
      taggedUserIds: null,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date('2026-11-20T08:00:00.000Z'),
      updatedAt: new Date('2026-11-20T08:00:00.000Z'),
    } as unknown as Post;

    (postRepo.findOne as jest.Mock).mockResolvedValue(hiddenPost);

    await expect(service.findOne(currentUser, hiddenPostId)).rejects.toThrow(
      NotFoundException,
    );

    const ownerUser: AuthenticatedUser = {
      id: ownerId,
      email: 'owner@lyora.vn',
      role: UserRole.CLIENT,
    };
    const ownerRes = await service.findOne(ownerUser, hiddenPostId);
    expect(ownerRes.id).toBe(hiddenPostId);

    const adminUser: AuthenticatedUser = {
      id: '88888888-8888-4888-8888-888888888888',
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };
    const adminRes = await service.findOne(adminUser, hiddenPostId);
    expect(adminRes.id).toBe(hiddenPostId);
  });

  it('tài khoản ADMIN khi đăng bài luôn mặc định phạm vi PUBLIC', async () => {
    const adminUser: AuthenticatedUser = {
      id: '88888888-8888-4888-8888-888888888888',
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };
    const postId = '99999999-9999-4999-8999-999999999999';
    const createdEntity = {
      id: postId,
      authorId: adminUser.id,
      author: {
        id: adminUser.id,
        fullName: 'Ban Quản Trị',
        email: adminUser.email,
        avatarUrl: null,
      },
      content: 'Thông báo bảo trì hệ thống',
      visibility: PostVisibility.PUBLIC,
      moderationStatus: PostModerationStatus.ACTIVE,
      media: [],
      taggedUserIds: null,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date('2026-11-28T03:30:00.000Z'),
      updatedAt: new Date('2026-11-28T03:30:00.000Z'),
    } as unknown as Post;

    const createSpy = jest.fn(
      (payload?: Partial<Post>) => (payload ?? {}) as Post,
    );
    const saveSpy = jest.fn().mockResolvedValue(createdEntity);
    postRepo.create = createSpy as unknown as NonNullable<
      typeof postRepo.create
    >;
    postRepo.save = saveSpy;
    (postRepo.findOne as jest.Mock).mockResolvedValue(createdEntity);

    const res = await service.create(adminUser, {
      content: 'Thông báo bảo trì hệ thống',
      visibility: PostVisibility.FRIENDS,
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: PostVisibility.PUBLIC,
      }),
    );
    expect(res.visibility).toBe(PostVisibility.PUBLIC);
  });

  it('findAllPaginated lọc moderation theo bản ghi (ACTIVE hoặc chính chủ) trên feed/hồ sơ và bỏ qua khi ADMIN xem hồ sơ', async () => {
    const createQb = () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn<unknown, unknown[]>().mockReturnThis(),
      andWhere: jest.fn<unknown, unknown[]>().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    });

    const inspectBracket = (bracket: Brackets) => {
      const subQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };
      bracket.whereFactory(subQb as never);
      return subQb;
    };

    // 1. Client A xem Trang chủ (không có authorId): vẫn thấy bài ACTIVE hoặc bài HIDDEN của chính mình
    const homeQb = createQb();
    (postRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(homeQb);
    await service.findAllPaginated(currentUser, { page: 1, limit: 10 });

    const homeBrackets = homeQb.andWhere.mock.calls
      .map((call: unknown[]) => call[0])
      .filter((arg): arg is Brackets => arg instanceof Brackets);
    expect(homeBrackets).toHaveLength(1);
    const homeModSubQb = inspectBracket(homeBrackets[0]);
    expect(homeModSubQb.where).toHaveBeenCalledWith(
      'post.moderationStatus = :activeModerationStatus',
      { activeModerationStatus: PostModerationStatus.ACTIVE },
    );
    expect(homeModSubQb.orWhere).toHaveBeenCalledWith(
      'post.authorId = :moderationOwnerId',
      { moderationOwnerId: currentUser.id },
    );

    // 2. Client B xem hồ sơ của Client A: lọc đúng authorId = A + visibility scope + moderation (ACTIVE hoặc B)
    const authorAId = '77777777-7777-4777-8777-777777777777';
    const profileOtherQb = createQb();
    (postRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(
      profileOtherQb,
    );
    await service.findAllPaginated(currentUser, {
      page: 1,
      limit: 10,
      filter: 'all',
      authorId: authorAId,
    });

    const visibilityBracket = profileOtherQb.where.mock.calls[0]?.[0];
    expect(visibilityBracket).toBeInstanceOf(Brackets);
    const visibilitySubQb = inspectBracket(visibilityBracket as Brackets);
    expect(visibilitySubQb.where).toHaveBeenCalledWith(
      'post.visibility = :publicVisibility',
      { publicVisibility: PostVisibility.PUBLIC },
    );

    const otherModBrackets = profileOtherQb.andWhere.mock.calls
      .map((call: unknown[]) => call[0])
      .filter((arg): arg is Brackets => arg instanceof Brackets);
    expect(otherModBrackets).toHaveLength(1);
    const otherModSubQb = inspectBracket(otherModBrackets[0]);
    expect(otherModSubQb.where).toHaveBeenCalledWith(
      'post.moderationStatus = :activeModerationStatus',
      { activeModerationStatus: PostModerationStatus.ACTIVE },
    );
    expect(otherModSubQb.orWhere).toHaveBeenCalledWith(
      'post.authorId = :moderationOwnerId',
      { moderationOwnerId: currentUser.id },
    );
    expect(profileOtherQb.andWhere).toHaveBeenCalledWith(
      'post.authorId = :authorId',
      { authorId: authorAId },
    );

    // 3. Admin xem hồ sơ người dùng: bỏ qua lọc moderation để xem toàn bộ bài viết
    const adminQb = createQb();
    (postRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(adminQb);
    await service.findAllPaginated(
      {
        id: '99999999-9999-4999-8999-999999999999',
        email: 'admin@lyora.vn',
        role: UserRole.ADMIN,
      },
      { page: 1, limit: 10, authorId: authorAId },
    );
    const adminBrackets = adminQb.andWhere.mock.calls
      .map((call: unknown[]) => call[0])
      .filter((arg): arg is Brackets => arg instanceof Brackets);
    expect(adminBrackets).toHaveLength(0);
  });

  it('getPostComments phân trang theo bình luận gốc kèm phản hồi con và ném 404 nếu bài viết không tồn tại', async () => {
    const missingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    (postRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      service.getPostComments(currentUser, missingId, { page: 1, limit: 10 }),
    ).rejects.toThrow(NotFoundException);

    const targetPostId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    (postRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: targetPostId,
      authorId: currentUser.id,
      visibility: PostVisibility.PUBLIC,
      moderationStatus: PostModerationStatus.ACTIVE,
    });

    const rootId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const replyId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    commentRepo.findAndCount = jest.fn().mockResolvedValue([
      [
        {
          id: rootId,
          postId: targetPostId,
          parentId: null,
          authorId: currentUser.id,
          author: { id: currentUser.id, fullName: 'Minh Anh', avatarUrl: null },
          content: 'Bình luận gốc',
          media: null,
          createdAt: new Date('2026-11-28T10:00:00.000Z'),
        },
      ],
      1,
    ]);
    commentRepo.find = jest.fn().mockResolvedValue([
      {
        id: replyId,
        postId: targetPostId,
        parentId: rootId,
        authorId: currentUser.id,
        author: { id: currentUser.id, fullName: 'Minh Anh', avatarUrl: null },
        content: 'Phản hồi con',
        media: null,
        createdAt: new Date('2026-11-28T10:05:00.000Z'),
      },
    ]);

    const res = await service.getPostComments(currentUser, targetPostId, {
      page: 1,
      limit: 10,
    });
    expect(res.meta.totalItems).toBe(1);
    expect(res.items.map((i) => i.id)).toEqual([rootId, replyId]);
  });

  it('createAppeal lưu khiếu nại cho bài viết bị ẩn của tác giả và gửi thông báo cho tất cả ADMIN hoạt động', async () => {
    const appealRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((payload: Partial<PostAppeal>) => ({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        createdAt: new Date('2026-11-28T11:00:00.000Z'),
        resolvedAt: null,
        adminEvidence: null,
        ...payload,
      })),
      save: jest.fn((entity: PostAppeal) => Promise.resolve(entity)),
    };
    const createModerationNotice = jest.fn().mockResolvedValue({});
    const notificationsMock = {
      createModerationNotice,
    } as unknown as NotificationsService;

    const serviceWithAppeals = new PostsService(
      postRepo as Repository<Post>,
      reactionRepo as Repository<PostReaction>,
      commentRepo as Repository<PostComment>,
      userRepo as Repository<User>,
      friendshipRepo as Repository<Friendship>,
      postShareRepo as Repository<PostShare>,
      appealRepo as unknown as Repository<PostAppeal>,
      notificationsMock,
    );

    const hiddenPostId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    (postRepo.findOne as jest.Mock).mockResolvedValue({
      id: hiddenPostId,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        fullName: 'Minh Anh',
        email: currentUser.email,
      },
      content: 'Bài viết cần xem xét lại',
      moderationStatus: PostModerationStatus.HIDDEN,
    });
    (userRepo.find as jest.Mock).mockResolvedValue([
      { id: '99999999-9999-4999-8999-999999999999' },
    ]);

    const created = await serviceWithAppeals.createAppeal(
      currentUser,
      hiddenPostId,
      {
        reasonCategory: 'Khác',
        reasonDetail: 'Bài viết chỉ chia sẻ kinh nghiệm cá nhân lành mạnh',
      },
    );

    expect(created.status).toBe(PostAppealStatus.PENDING);
    expect(createModerationNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: '99999999-9999-4999-8999-999999999999',
        type: NotificationType.POST_APPEAL_SUBMITTED,
        targetPath: '/admin/posts?tab=appeals',
      }),
    );

    (postRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: hiddenPostId,
      authorId: '77777777-7777-4777-8777-777777777777',
      moderationStatus: PostModerationStatus.HIDDEN,
    });
    await expect(
      serviceWithAppeals.createAppeal(currentUser, hiddenPostId, {
        reasonCategory: 'Khác',
        reasonDetail: 'Không phải tác giả',
      }),
    ).rejects.toThrow(ForbiddenException);

    (postRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: hiddenPostId,
      authorId: currentUser.id,
      moderationStatus: PostModerationStatus.ACTIVE,
    });
    await expect(
      serviceWithAppeals.createAppeal(currentUser, hiddenPostId, {
        reasonCategory: 'Khác',
        reasonDetail: 'Bài đang hiển thị bình thường',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('toResponses trả về toàn bộ lịch sử appeals sắp xếp mới nhất trước cho tác giả/ADMIN và ẩn với người lạ', async () => {
    const ownerId = currentUser.id;
    const postId = '12121212-1212-4121-8121-121212121212';
    const hiddenPost = {
      id: postId,
      authorId: ownerId,
      author: {
        id: ownerId,
        fullName: 'Chủ Bài Viết',
        email: 'owner@lyora.vn',
        avatarUrl: null,
      },
      content: 'Bài viết có nhiều vòng khiếu nại',
      visibility: PostVisibility.PUBLIC,
      moderationStatus: PostModerationStatus.HIDDEN,
      moderationReason: 'Nội dung nhạy cảm',
      moderatedAt: new Date('2026-11-28T09:00:00.000Z'),
      media: [],
      taggedUserIds: null,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date('2026-11-28T08:00:00.000Z'),
      updatedAt: new Date('2026-11-28T09:00:00.000Z'),
    } as unknown as Post;

    const appealNew = {
      id: 'ap-new',
      postId,
      status: PostAppealStatus.PENDING,
      reasonCategory: 'Khiếu nại lần 2',
      reasonDetail: 'Đã chỉnh sửa ngữ cảnh bài viết',
      adminEvidence: null,
      createdAt: new Date('2026-11-28T11:00:00.000Z'),
      resolvedAt: null,
      resolvedBy: null,
    };
    const appealOld = {
      id: 'ap-old',
      postId,
      status: PostAppealStatus.REJECTED,
      reasonCategory: 'Khiếu nại lần 1',
      reasonDetail: 'Tôi nghĩ bài viết không vi phạm',
      adminEvidence: 'Minh chứng vòng 1 từ Quản trị viên',
      createdAt: new Date('2026-11-28T10:00:00.000Z'),
      resolvedAt: new Date('2026-11-28T10:30:00.000Z'),
      resolvedBy: { id: 'admin-1', fullName: 'Quản Trị Viên' },
    };

    const appealRepo = {
      find: jest.fn().mockResolvedValue([appealNew, appealOld]),
    };

    const serviceWithAppeals = new PostsService(
      postRepo as Repository<Post>,
      reactionRepo as Repository<PostReaction>,
      commentRepo as Repository<PostComment>,
      userRepo as Repository<User>,
      friendshipRepo as Repository<Friendship>,
      postShareRepo as Repository<PostShare>,
      appealRepo as unknown as Repository<PostAppeal>,
    );

    (postRepo.findOne as jest.Mock).mockResolvedValue(hiddenPost);
    const ownerRes = await serviceWithAppeals.findOne(currentUser, postId);
    expect(ownerRes.appeal?.id).toBe('ap-new');
    expect(ownerRes.appeals?.map((a) => a.id)).toEqual(['ap-new', 'ap-old']);
    expect(ownerRes.appeals?.[1]?.adminEvidence).toBe(
      'Minh chứng vòng 1 từ Quản trị viên',
    );
  });

  it('update cho phép chính chủ cập nhật đầy đủ nội dung, phạm vi, media, taggedUsers và giữ nguyên moderationStatus', async () => {
    const postId = '34343434-3434-4343-8343-343434343434';
    const taggedFriendId = '56565656-5656-4565-8565-565656565656';

    const existingPost = {
      id: postId,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        fullName: 'Hà Trường Giang',
        email: currentUser.email,
        avatarUrl: null,
      },
      content: 'Nội dung cũ',
      visibility: PostVisibility.PUBLIC,
      moderationStatus: PostModerationStatus.HIDDEN,
      moderationReason: 'Chờ kiểm tra',
      media: [
        {
          id: 'old-img-1',
          type: PostMediaType.IMAGE,
          url: 'https://res.cloudinary.com/demo/image/upload/v1/old.jpg',
        },
      ],
      taggedUserIds: null,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date('2026-11-28T08:00:00.000Z'),
      updatedAt: new Date('2026-11-28T08:00:00.000Z'),
    } as unknown as Post;

    const updatedPostEntity = {
      ...existingPost,
      content: 'Nội dung đã chỉnh sửa cùng @Trần Thị Bình',
      visibility: PostVisibility.FRIENDS,
      media: [
        ...existingPost.media,
        {
          id: 'new-audio-1',
          type: PostMediaType.AUDIO,
          url: 'https://res.cloudinary.com/demo/video/upload/v1/voice.webm',
          duration: 12,
        },
      ],
      taggedUserIds: [taggedFriendId],
      updatedAt: new Date('2026-11-28T09:15:00.000Z'),
    } as unknown as Post;

    postRepo.save = jest.fn().mockResolvedValue(updatedPostEntity);
    (postRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(existingPost)
      .mockResolvedValueOnce(updatedPostEntity);
    (userRepo.find as jest.Mock)
      .mockResolvedValueOnce([{ id: taggedFriendId }])
      .mockResolvedValueOnce([
        { id: taggedFriendId, fullName: 'Trần Thị Bình' },
      ]);

    const res = await service.update(currentUser, postId, {
      content: '  Nội dung đã chỉnh sửa cùng @Trần Thị Bình  ',
      visibility: PostVisibility.FRIENDS,
      media: updatedPostEntity.media,
      taggedUserIds: [taggedFriendId],
    });

    expect(postRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Nội dung đã chỉnh sửa cùng @Trần Thị Bình',
        visibility: PostVisibility.FRIENDS,
        moderationStatus: PostModerationStatus.HIDDEN,
        taggedUserIds: [taggedFriendId],
      }),
    );
    expect(res.content).toBe('Nội dung đã chỉnh sửa cùng @Trần Thị Bình');
    expect(res.visibility).toBe(PostVisibility.FRIENDS);
    expect(res.moderationStatus).toBe(PostModerationStatus.HIDDEN);
    expect(res.media).toHaveLength(2);
    expect(res.taggedUsers).toEqual([
      { id: taggedFriendId, fullName: 'Trần Thị Bình' },
    ]);
  });

  it('update chặn người khác sửa bài (403) và từ chối bài rỗng hoặc có nhiều hơn 1 bản ghi âm (400)', async () => {
    const postId = '78787878-7878-4787-8787-787878787878';

    (postRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: postId,
      authorId: '99999999-9999-4999-8999-999999999999',
      content: 'Bài viết của người khác',
      visibility: PostVisibility.PUBLIC,
      media: [],
    });
    await expect(
      service.update(currentUser, postId, { content: 'Sửa trộm' }),
    ).rejects.toThrow(ForbiddenException);

    (postRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: postId,
      authorId: currentUser.id,
      content: 'Nội dung cũ',
      visibility: PostVisibility.PUBLIC,
      media: [],
    });
    await expect(
      service.update(currentUser, postId, { content: '   ', media: [] }),
    ).rejects.toThrow(BadRequestException);

    (postRepo.findOne as jest.Mock).mockResolvedValueOnce({
      id: postId,
      authorId: currentUser.id,
      content: 'Có 2 bản ghi âm',
      visibility: PostVisibility.PUBLIC,
      media: [],
    });
    await expect(
      service.update(currentUser, postId, {
        content: 'Bài âm thanh',
        media: [
          {
            id: 'a1',
            type: PostMediaType.AUDIO,
            url: 'https://res.cloudinary.com/demo/video/upload/v1/a1.webm',
          },
          {
            id: 'a2',
            type: PostMediaType.AUDIO,
            url: 'https://res.cloudinary.com/demo/video/upload/v1/a2.webm',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
