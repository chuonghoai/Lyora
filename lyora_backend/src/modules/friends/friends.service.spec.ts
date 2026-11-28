import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';
import { FriendsService } from './friends.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('FriendsService', () => {
  let service: FriendsService;
  let friendshipRepo: jest.Mocked<Partial<Repository<Friendship>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let notificationsService: jest.Mocked<
    Pick<
      NotificationsService,
      'createFriendRequest' | 'createFriendRequestAccepted'
    >
  >;
  let realtimeGateway: jest.Mocked<Pick<RealtimeGateway, 'emitToUser'>>;

  beforeEach(() => {
    friendshipRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    userRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    notificationsService = {
      createFriendRequest: jest.fn(),
      createFriendRequestAccepted: jest.fn(),
    };
    realtimeGateway = { emitToUser: jest.fn() };

    service = new FriendsService(
      friendshipRepo as Repository<Friendship>,
      userRepo as Repository<User>,
      notificationsService as NotificationsService,
      realtimeGateway as RealtimeGateway,
    );
  });

  describe('areFriends', () => {
    it('trả về false nếu userA và userB trùng nhau (không thể tự kết bạn)', async () => {
      const result = await service.areFriends('user-1', 'user-1');
      expect(result).toBe(false);
    });

    it('trả về true nếu có bản ghi friendship ACCEPTED', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.areFriends('user-1', 'user-2');
      expect(result).toBe(true);
      expect(qb.getCount).toHaveBeenCalled();
    });

    it('trả về false nếu không tìm thấy bản ghi friendship nào', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.areFriends('user-1', 'user-stranger');
      expect(result).toBe(false);
    });
  });

  describe('getAcceptedFriends', () => {
    it('trả về mảng rỗng nếu không có bạn bè', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.getAcceptedFriends('user-1');
      expect(result).toEqual([]);
    });

    it('trả về danh sách bạn bè an toàn kèm thông tin hiển thị (không email)', async () => {
      const mockFriendships = [
        {
          id: 'f-1',
          userId: 'user-1',
          friendId: 'user-2',
          status: FriendshipStatus.ACCEPTED,
        },
      ] as Friendship[];

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockFriendships),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const mockUsers = [
        {
          id: 'user-2',
          fullName: 'Nguyễn Văn An',
          avatarUrl: 'https://avatar.com/an.png',
          workplace: 'Lyora',
          location: 'TP. Hồ Chí Minh',
          email: 'friend1@gmail.com',
          isActive: true,
        },
      ] as User[];

      (userRepo.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.getAcceptedFriends('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'user-2',
        fullName: 'Nguyễn Văn An',
        avatarUrl: 'https://avatar.com/an.png',
        workplace: 'Lyora',
        location: 'TP. Hồ Chí Minh',
        friendshipStatus: 'FRIEND',
        mutualFriendsCount: 0,
        isOnline: false,
      });
      expect(result[0]).not.toHaveProperty('email');
    });
  });

  describe('getSuggestions', () => {
    it('ưu tiên thành viên có bạn chung và loại trừ quan hệ hiện có', async () => {
      const currentRelationships = [
        {
          userId: 'user-1',
          friendId: 'friend-1',
          status: FriendshipStatus.ACCEPTED,
        },
        {
          userId: 'user-1',
          friendId: 'pending-user',
          status: FriendshipStatus.PENDING,
        },
      ] as Friendship[];
      const friendRelationships = [
        {
          userId: 'friend-1',
          friendId: 'mutual-user',
          status: FriendshipStatus.ACCEPTED,
        },
      ] as Friendship[];
      const currentQuery = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(currentRelationships),
      };
      const mutualQuery = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(friendRelationships),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce(currentQuery)
        .mockReturnValueOnce(mutualQuery);
      (userRepo.find as jest.Mock).mockResolvedValue([
        { id: 'friend-1', fullName: 'Bạn trực tiếp' },
        { id: 'pending-user', fullName: 'Đang chờ' },
        { id: 'platform-user', fullName: 'An Nhiên' },
        { id: 'mutual-user', fullName: 'Bạn chung' },
      ]);

      const result = await service.getSuggestions('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'mutual-user',
          friendshipStatus: 'NONE',
          mutualFriendsCount: 1,
        }),
        expect.objectContaining({
          id: 'platform-user',
          friendshipStatus: 'NONE',
          mutualFriendsCount: 0,
        }),
      ]);
    });
  });

  describe('validateAllAreFriends', () => {
    it('ném lỗi BadRequestException nếu danh sách rỗng sau khi loại bỏ chính mình', async () => {
      await expect(
        service.validateAllAreFriends('user-1', ['user-1']),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi nếu một người dùng không tồn tại hoặc inactive', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue([]); // Không tìm thấy

      await expect(
        service.validateAllAreFriends('user-1', ['missing-user']),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi nếu một người dùng không phải là bạn bè', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue([{ id: 'stranger-id' }]);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // Không có friendship
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await expect(
        service.validateAllAreFriends('user-1', ['stranger-id']),
      ).rejects.toThrow(BadRequestException);
    });

    it('thành công khi tất cả thành viên đều hợp lệ và là bạn bè', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue([
        { id: 'friend-1' },
        { id: 'friend-2' },
      ]);
      const mockFriendships = [
        {
          id: 'f-1',
          userId: 'user-1',
          friendId: 'friend-1',
          status: FriendshipStatus.ACCEPTED,
        },
        {
          id: 'f-2',
          userId: 'user-1',
          friendId: 'friend-2',
          status: FriendshipStatus.ACCEPTED,
        },
      ] as Friendship[];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockFriendships),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await expect(
        service.validateAllAreFriends('user-1', ['friend-1', 'friend-2']),
      ).resolves.toBeUndefined();
    });
  });

  describe('friend request actions', () => {
    it('tạo lời mời PENDING cho thành viên hợp lệ', async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'user-2', role: 'CLIENT' })
        .mockResolvedValueOnce({ id: 'user-1', fullName: 'Người gửi' });
      const qb = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      const pendingRequest = {
        userId: 'user-1',
        friendId: 'user-2',
        status: FriendshipStatus.PENDING,
      };
      (friendshipRepo.create as jest.Mock).mockReturnValue(pendingRequest);

      await service.sendRequest('user-1', 'user-2');

      expect(friendshipRepo.create).toHaveBeenCalledWith(pendingRequest);
      expect(friendshipRepo.save).toHaveBeenCalledWith(pendingRequest);
      expect(notificationsService.createFriendRequest).toHaveBeenCalledWith(
        'user-2',
        'Người gửi',
        'user-1',
      );
      expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
        'user-1',
        'friendship.updated',
        { userId: 'user-2', friendshipStatus: 'REQUEST_SENT' },
      );
    });

    it('chỉ chấp nhận lời mời PENDING gửi đến người dùng hiện tại', async () => {
      const request = {
        userId: 'user-2',
        friendId: 'user-1',
        status: FriendshipStatus.PENDING,
      } as Friendship;
      (friendshipRepo.findOne as jest.Mock).mockResolvedValue(request);
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'user-1',
        fullName: 'Người chấp nhận',
      });

      await service.acceptRequest('user-1', 'user-2');

      expect(request.status).toBe(FriendshipStatus.ACCEPTED);
      expect(friendshipRepo.save).toHaveBeenCalledWith(request);
      expect(
        notificationsService.createFriendRequestAccepted,
      ).toHaveBeenCalledWith('user-2', 'Người chấp nhận', 'user-1');
      expect(realtimeGateway.emitToUser).toHaveBeenCalledWith(
        'user-1',
        'friendship.updated',
        { userId: 'user-2', friendshipStatus: 'FRIEND' },
      );
    });

    it('vẫn hoàn tất lời mời khi lưu thông báo thất bại', async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'user-2', role: 'CLIENT' })
        .mockResolvedValueOnce({ id: 'user-1', fullName: 'Người gửi' });
      const qb = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      (friendshipRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      const pendingRequest = {
        userId: 'user-1',
        friendId: 'user-2',
        status: FriendshipStatus.PENDING,
      };
      (friendshipRepo.create as jest.Mock).mockReturnValue(pendingRequest);
      (notificationsService.createFriendRequest as jest.Mock).mockRejectedValue(
        new Error('notifications table is unavailable'),
      );

      await expect(
        service.sendRequest('user-1', 'user-2'),
      ).resolves.toBeUndefined();
      expect(friendshipRepo.save).toHaveBeenCalledWith(pendingRequest);
    });
  });
});
