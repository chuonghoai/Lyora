import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';
import { FriendsService } from './friends.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let friendshipRepo: jest.Mocked<Partial<Repository<Friendship>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(() => {
    friendshipRepo = {
      createQueryBuilder: jest.fn(),
    };
    userRepo = {
      find: jest.fn(),
    };

    service = new FriendsService(
      friendshipRepo as Repository<Friendship>,
      userRepo as Repository<User>,
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
        isOnline: false,
      });
      expect(result[0]).not.toHaveProperty('email');
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
});
