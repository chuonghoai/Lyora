import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService - Statistics, Profile Update & Public Profile', () => {
  let usersService: UsersService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let friendshipRepository: jest.Mocked<Partial<Repository<Friendship>>>;

  const selfId = '11111111-1111-4111-8111-111111111111';
  const targetId = '22222222-2222-4222-8222-222222222222';
  const mutualFriendId = '33333333-3333-4333-8333-333333333333';
  const otherFriendId = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    userRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    friendshipRepository = {
      createQueryBuilder: jest.fn(),
    };

    usersService = new UsersService(
      userRepository as Repository<User>,
      friendshipRepository as Repository<Friendship>,
    );
  });

  function createAggregateBuilderMock(
    rawResult: Record<string, string | number>,
  ) {
    return {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawResult),
    };
  }

  function createFriendshipQbMock(result: {
    one?: Friendship | null;
    many?: Friendship[];
  }) {
    return {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result.one ?? null),
      getMany: jest.fn().mockResolvedValue(result.many ?? []),
    };
  }

  it('should compute user statistics with a single aggregate query and limit 4 recent users', async () => {
    const mockQueryBuilder = createAggregateBuilderMock({
      totalUsers: '25',
      clientCount: '22',
      adminCount: '3',
      activeCount: '22',
      inactiveCount: '3',
      newUsersToday: '4',
      newUsersThisMonth: '15',
    });

    (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      mockQueryBuilder,
    );

    const mockRecentUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        fullName: 'User One',
        role: UserRole.CLIENT,
        isActive: true,
        createdAt: new Date(),
      },
    ] as User[];

    (userRepository.find as jest.Mock).mockResolvedValue(mockRecentUsers);

    const stats = await usersService.getStatistics();

    expect(userRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.getRawOne).toHaveBeenCalledTimes(1);
    expect(stats.totalUsers).toBe(25);
    expect(stats.clientCount).toBe(22);
    expect(stats.adminCount).toBe(3);
    expect(stats.activeCount).toBe(22);
    expect(stats.inactiveCount).toBe(3);
    expect(stats.newUsersToday).toBe(4);
    expect(stats.newUsersThisMonth).toBe(15);
    expect(stats.recentUsers).toEqual(mockRecentUsers);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: undefined,
      order: { createdAt: 'DESC' },
      take: 4,
    });
  });

  it('should filter recent users by role while keeping limit at 4', async () => {
    const mockQueryBuilder = createAggregateBuilderMock({
      totalUsers: '1',
      clientCount: '0',
      adminCount: '1',
      activeCount: '1',
      inactiveCount: '0',
      newUsersToday: '0',
      newUsersThisMonth: '0',
    });
    (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      mockQueryBuilder,
    );
    (userRepository.find as jest.Mock).mockResolvedValue([]);

    await usersService.getStatistics(UserRole.ADMIN);

    expect(userRepository.find).toHaveBeenCalledWith({
      where: { role: UserRole.ADMIN },
      order: { createdAt: 'DESC' },
      take: 4,
    });
  });

  it('updates extended profile fields and normalizes empty strings to null', async () => {
    const existingUser = {
      id: selfId,
      email: 'user@lyora.vn',
      fullName: 'Tên Cũ',
      phoneNumber: '0908123456',
      bio: 'Bio cũ',
      location: 'Đà Nẵng',
      hometown: 'Quảng Nam',
      workplace: 'Công ty A',
      education: 'Đại học B',
      website: 'https://old.vn',
      avatarUrl: null,
      coverUrl: null,
      role: UserRole.CLIENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    (userRepository.findOne as jest.Mock).mockResolvedValue(existingUser);
    (userRepository.save as jest.Mock).mockImplementation((u: User) =>
      Promise.resolve(u),
    );

    const updated = await usersService.updateProfile(selfId, {
      fullName: '  Trịnh Đại Nghĩa  ',
      hometown: '  Đà Lạt  ',
      workplace: 'Lyora Team',
      education: '   ',
      website: 'https://lyora.vn',
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
      coverUrl: 'https://res.cloudinary.com/demo/image/upload/cover.jpg',
    });

    expect(updated.fullName).toBe('Trịnh Đại Nghĩa');
    expect(updated.hometown).toBe('Đà Lạt');
    expect(updated.workplace).toBe('Lyora Team');
    expect(updated.education).toBeNull();
    expect(updated.website).toBe('https://lyora.vn');
    expect(updated.avatarUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    );
    expect(updated.coverUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/cover.jpg',
    );
  });

  it('returns private contact fields when viewing own profile via "me"', async () => {
    const selfUser = {
      id: selfId,
      email: 'me@lyora.vn',
      fullName: 'Chủ Tài Khoản',
      phoneNumber: '0908111222',
      bio: 'Giới thiệu bản thân',
      location: 'TP.HCM',
      hometown: 'Đà Lạt',
      workplace: 'Lyora',
      education: 'UTE',
      website: 'https://lyora.vn',
      avatarUrl: null,
      coverUrl: null,
      role: UserRole.CLIENT,
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    } as User;

    (userRepository.findOne as jest.Mock).mockResolvedValue(selfUser);
    (friendshipRepository.createQueryBuilder as jest.Mock).mockReturnValueOnce(
      createFriendshipQbMock({ many: [] }),
    );

    const profile = await usersService.getPublicProfile(
      { id: selfId, email: 'me@lyora.vn', role: UserRole.CLIENT },
      'me',
    );

    expect(profile.id).toBe(selfId);
    expect(profile.email).toBe('me@lyora.vn');
    expect(profile.phoneNumber).toBe('0908111222');
    expect(profile.friendshipStatus).toBe('SELF');
    expect(profile.friendsCount).toBe(0);
    expect(profile.mutualFriendsCount).toBe(0);
  });

  it('masks email and phoneNumber on other user profile and computes mutual friends & status', async () => {
    const targetUser = {
      id: targetId,
      email: 'secret@lyora.vn',
      fullName: 'Nguyễn Minh Anh',
      phoneNumber: '0909999999',
      bio: 'Yêu nhiếp ảnh',
      location: 'TP.HCM',
      hometown: 'Đà Lạt',
      workplace: 'Lyora Studio',
      education: 'Kiến trúc',
      website: 'https://minhanh.vn',
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/ma.png',
      coverUrl: null,
      role: UserRole.CLIENT,
      isActive: true,
      createdAt: new Date('2025-02-01T00:00:00.000Z'),
    } as User;

    (userRepository.findOne as jest.Mock).mockResolvedValue(targetUser);

    const directRel = {
      userId: selfId,
      friendId: targetId,
      status: FriendshipStatus.PENDING,
    } as Friendship;

    const acceptedEdges = [
      {
        userId: selfId,
        friendId: mutualFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
      {
        userId: targetId,
        friendId: mutualFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
      {
        userId: targetId,
        friendId: otherFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
    ] as Friendship[];

    const viewerToPreview = [
      {
        userId: selfId,
        friendId: mutualFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
    ] as Friendship[];

    const previewFriendEdges = [
      {
        userId: selfId,
        friendId: mutualFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
      {
        userId: targetId,
        friendId: mutualFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
      {
        userId: targetId,
        friendId: otherFriendId,
        status: FriendshipStatus.ACCEPTED,
      },
    ] as Friendship[];

    (friendshipRepository.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(createFriendshipQbMock({ one: directRel }))
      .mockReturnValueOnce(createFriendshipQbMock({ many: acceptedEdges }))
      .mockReturnValueOnce(createFriendshipQbMock({ many: viewerToPreview }))
      .mockReturnValueOnce(
        createFriendshipQbMock({ many: previewFriendEdges }),
      );

    (userRepository.find as jest.Mock).mockResolvedValue([
      {
        id: mutualFriendId,
        fullName: 'Bạn Chung',
        avatarUrl: null,
        workplace: 'Designer',
        bio: null,
        location: 'TP.HCM',
      },
      {
        id: otherFriendId,
        fullName: 'Bạn Riêng',
        avatarUrl: null,
        workplace: null,
        bio: 'Dev',
        location: 'Hà Nội',
      },
    ]);

    const profile = await usersService.getPublicProfile(
      { id: selfId, email: 'me@lyora.vn', role: UserRole.CLIENT },
      targetId,
    );

    expect(profile.email).toBeNull();
    expect(profile.phoneNumber).toBeNull();
    expect(profile.friendshipStatus).toBe('REQUEST_SENT');
    expect(profile.friendsCount).toBe(2);
    expect(profile.mutualFriendsCount).toBe(1);
    expect(profile.friendsPreview).toHaveLength(2);
    expect(profile.friendsPreview[0]).toMatchObject({
      id: mutualFriendId,
      friendshipStatus: 'FRIEND',
    });
    expect(profile.friendsPreview[1]).toMatchObject({
      id: otherFriendId,
      friendshipStatus: 'NONE',
    });
  });

  it('throws NotFoundException for invalid UUID, inactive target user, or BLOCKED relation', async () => {
    await expect(
      usersService.getPublicProfile(
        { id: selfId, email: 'me@lyora.vn', role: UserRole.CLIENT },
        'not-a-uuid',
      ),
    ).rejects.toThrow(NotFoundException);

    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: targetId,
      isActive: false,
      role: UserRole.CLIENT,
    });

    await expect(
      usersService.getPublicProfile(
        { id: selfId, email: 'me@lyora.vn', role: UserRole.CLIENT },
        targetId,
      ),
    ).rejects.toThrow(NotFoundException);

    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: targetId,
      isActive: true,
      role: UserRole.CLIENT,
    });
    (friendshipRepository.createQueryBuilder as jest.Mock).mockReturnValueOnce(
      createFriendshipQbMock({
        one: {
          userId: targetId,
          friendId: selfId,
          status: FriendshipStatus.BLOCKED,
        } as Friendship,
      }),
    );

    await expect(
      usersService.getPublicProfile(
        { id: selfId, email: 'me@lyora.vn', role: UserRole.CLIENT },
        targetId,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
