import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { RedisService } from '../../redis/redis.service';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService - Statistics, Profile Update & Public Profile', () => {
  let usersService: UsersService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let friendshipRepository: jest.Mocked<Partial<Repository<Friendship>>>;
  let redisServiceMock: jest.Mocked<
    Pick<RedisService, 'revokeAllUserSessions'>
  >;

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
      update: jest.fn().mockResolvedValue(undefined),
    };

    friendshipRepository = {
      createQueryBuilder: jest.fn(),
    };

    redisServiceMock = {
      revokeAllUserSessions: jest.fn().mockResolvedValue(undefined),
    };

    usersService = new UsersService(
      userRepository as Repository<User>,
      friendshipRepository as Repository<Friendship>,
      redisServiceMock as unknown as RedisService,
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

  it('findAllPaginated sorts active accounts before locked accounts and returns SQL summary counts', async () => {
    const listQbMock = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const summaryQbMock = createAggregateBuilderMock({
      allCount: '12',
      clientCount: '10',
      adminCount: '2',
      activeCount: '11',
      lockedCount: '1',
      onlineCount: '4',
    });

    (userRepository.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(listQbMock)
      .mockReturnValueOnce(summaryQbMock);

    const result = await usersService.findAllPaginated({
      page: 1,
      limit: 10,
      role: UserRole.CLIENT,
      status: 'ALL',
      online: 'ONLINE',
      search: 'linh',
      sortBy: 'fullName',
      sortOrder: 'ASC',
    });

    expect(listQbMock.orderBy).toHaveBeenCalledWith('user.isActive', 'DESC');
    expect(listQbMock.addOrderBy).toHaveBeenCalledWith('user.fullName', 'ASC');
    expect(listQbMock.addOrderBy).toHaveBeenCalledWith(
      'user.createdAt',
      'DESC',
    );
    expect(listQbMock.andWhere).toHaveBeenCalledWith(
      'user.role = :roleFilter',
      { roleFilter: UserRole.CLIENT },
    );
    expect(listQbMock.andWhere).toHaveBeenCalledWith('user.isOnline = true');
    expect(result.summary).toEqual({
      all: 12,
      client: 10,
      admin: 2,
      active: 11,
      locked: 1,
      online: 4,
    });
  });

  it('getAdminUserProfile returns full admin detail including email, phoneNumber, isOnline and lock metadata', async () => {
    const lockedDate = new Date('2026-11-27T10:00:00.000Z');
    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: targetId,
      email: 'client@lyora.vn',
      fullName: 'Trần Bảo Ngọc',
      role: UserRole.CLIENT,
      phoneNumber: '0909123456',
      bio: 'Thành viên tích cực',
      location: 'Đà Nẵng',
      hometown: null,
      workplace: null,
      education: null,
      website: null,
      avatarUrl: null,
      coverUrl: null,
      isActive: false,
      isOnline: false,
      lockReason: 'Spam bình luận quảng cáo',
      lockedAt: lockedDate,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    (friendshipRepository.createQueryBuilder as jest.Mock).mockReturnValueOnce(
      createFriendshipQbMock({ many: [] }),
    );

    const detail = await usersService.getAdminUserProfile(
      { id: selfId, email: 'admin@lyora.vn', role: UserRole.ADMIN },
      targetId,
    );

    expect(detail.email).toBe('client@lyora.vn');
    expect(detail.phoneNumber).toBe('0909123456');
    expect(detail.isActive).toBe(false);
    expect(detail.isOnline).toBe(false);
    expect(detail.lockReason).toBe('Spam bình luận quảng cáo');
    expect(detail.lockedAt).toEqual(lockedDate);
  });

  it('lockUser forbids self-lock or locking ADMIN and locks target CLIENT with session revocation', async () => {
    const adminUser = {
      id: selfId,
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };

    await expect(
      usersService.lockUser(adminUser, selfId, {
        reason: 'Không hợp lệ tự khóa',
      }),
    ).rejects.toThrow(BadRequestException);

    (userRepository.findOne as jest.Mock).mockResolvedValueOnce({
      id: targetId,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await expect(
      usersService.lockUser(adminUser, targetId, {
        reason: 'Không hợp lệ khóa admin',
      }),
    ).rejects.toThrow(BadRequestException);

    (userRepository.findOne as jest.Mock).mockResolvedValueOnce({
      id: targetId,
      role: UserRole.CLIENT,
      isActive: true,
      isOnline: true,
      lockReason: null,
      lockedAt: null,
    });
    (userRepository.save as jest.Mock).mockImplementation((u) =>
      Promise.resolve(u),
    );

    const locked = await usersService.lockUser(adminUser, targetId, {
      reason: '  Đăng tải nội dung spam lặp lại  ',
    });

    expect(locked.isActive).toBe(false);
    expect(locked.isOnline).toBe(false);
    expect(locked.lockReason).toBe('Đăng tải nội dung spam lặp lại');
    expect(locked.lockedAt).toBeInstanceOf(Date);
    expect(redisServiceMock.revokeAllUserSessions).toHaveBeenCalledWith(
      targetId,
    );
  });

  it('unlockUser reactivates user and clears lock metadata', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValueOnce({
      id: targetId,
      role: UserRole.CLIENT,
      isActive: false,
      lockReason: 'Lý do cũ',
      lockedAt: new Date(),
    });
    (userRepository.save as jest.Mock).mockImplementation((u) =>
      Promise.resolve(u),
    );

    const unlocked = await usersService.unlockUser(targetId);

    expect(unlocked.isActive).toBe(true);
    expect(unlocked.lockReason).toBeNull();
    expect(unlocked.lockedAt).toBeNull();
  });

  it('setOnlineStatus updates isOnline column in userRepository', async () => {
    await usersService.setOnlineStatus(targetId, true);

    expect(userRepository.update).toHaveBeenCalledWith(targetId, {
      isOnline: true,
    });
  });

  it('getOnlineStatuses filters valid UUIDs and returns active+online map with total onlineCount', async () => {
    (userRepository.find as jest.Mock).mockResolvedValueOnce([
      { id: selfId, isOnline: true, isActive: true },
      { id: targetId, isOnline: true, isActive: false },
    ]);
    (userRepository.count as jest.Mock).mockResolvedValueOnce(5);

    const result = await usersService.getOnlineStatuses(
      `${selfId}, invalid-id, ${targetId}, ${selfId}`,
    );

    expect(userRepository.find).toHaveBeenCalledTimes(1);
    expect(result.statuses).toEqual({
      [selfId]: true,
      [targetId]: false,
    });
    expect(result.onlineCount).toBe(5);
    expect(result.checkedAt).toBeTruthy();
  });
});
