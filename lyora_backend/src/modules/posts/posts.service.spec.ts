import { NotFoundException, NotImplementedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import { User } from '../users/entities/user.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { Post } from './entities/post.entity';
import {
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
    };
    commentRepo = {
      find: jest.fn().mockResolvedValue([]),
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

    const createSpy = jest.fn((payload: Partial<Post>) => payload as Post);
    const saveSpy = jest.fn().mockResolvedValue(createdEntity);
    postRepo.create = createSpy;
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
});
