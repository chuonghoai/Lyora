import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { FriendsService } from '../friends/friends.service';
import { User } from '../users/entities/user.entity';
import { ConversationsService } from './conversations.service';
import { ConversationMember } from './entities/conversation-member.entity';
import { Conversation } from './entities/conversation.entity';
import { IdempotencyRecord } from './entities/idempotency-record.entity';
import { ConversationMemberRole } from './enums/conversation-member-role.enum';
import { ConversationType } from './enums/conversation-type.enum';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let convRepo: jest.Mocked<Partial<Repository<Conversation>>>;
  let memberRepo: jest.Mocked<Partial<Repository<ConversationMember>>>;
  let idempotencyRepo: jest.Mocked<Partial<Repository<IdempotencyRecord>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let friendsService: jest.Mocked<Partial<FriendsService>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  const currentUserId = 'user-current-id';
  const targetFriendId = 'user-friend-id';

  beforeEach(() => {
    convRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    memberRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    idempotencyRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
    };
    friendsService = {
      areFriends: jest.fn(),
      validateAllAreFriends: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(),
    };

    service = new ConversationsService(
      convRepo as Repository<Conversation>,
      memberRepo as Repository<ConversationMember>,
      idempotencyRepo as Repository<IdempotencyRecord>,
      userRepo as Repository<User>,
      friendsService as FriendsService,
      dataSource as DataSource,
    );
  });

  describe('createDirectConversation', () => {
    it('chặn tự tạo cuộc hội thoại trực tiếp với chính mình', async () => {
      await expect(
        service.createDirectConversation(currentUserId, {
          targetUserId: currentUserId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi NotFoundException nếu người dùng đích không tồn tại hoặc không phải CLIENT', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createDirectConversation(currentUserId, {
          targetUserId: 'invalid-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném lỗi ForbiddenException nếu hai người dùng chưa phải bạn bè', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        id: targetFriendId,
        role: UserRole.CLIENT,
        isActive: true,
      });
      (friendsService.areFriends as jest.Mock).mockResolvedValue(false);

      await expect(
        service.createDirectConversation(currentUserId, {
          targetUserId: targetFriendId,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('trả về cuộc hội thoại hiện có nếu đã tồn tại (Idempotent)', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        id: targetFriendId,
        role: UserRole.CLIENT,
        isActive: true,
      });
      (friendsService.areFriends as jest.Mock).mockResolvedValue(true);

      const existingConv = {
        id: 'existing-conv-id',
        type: ConversationType.DIRECT,
        directUserKey: [currentUserId, targetFriendId].sort().join(':'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Conversation;

      (convRepo.findOne as jest.Mock).mockResolvedValue(existingConv);
      (memberRepo.findOne as jest.Mock).mockResolvedValue({
        userId: targetFriendId,
        user: {
          id: targetFriendId,
          fullName: 'Nguyễn Văn Bạn',
          avatarUrl: null,
          isActive: true,
        },
      });

      const result = await service.createDirectConversation(currentUserId, {
        targetUserId: targetFriendId,
      });

      expect(result.id).toBe('existing-conv-id');
      expect(result.title).toBe('Nguyễn Văn Bạn');
      expect(result.memberCount).toBe(2);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('tạo thành công hội thoại trực tiếp mới và gán quyền MEMBER cho cả hai (không có OWNER)', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        id: targetFriendId,
        fullName: 'Trần Thị Bạn',
        avatarUrl: null,
        role: UserRole.CLIENT,
        isActive: true,
      });
      (friendsService.areFriends as jest.Mock).mockResolvedValue(true);
      (convRepo.findOne as jest.Mock).mockResolvedValue(null);

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback: (manager: unknown) => Promise<unknown>) => {
          const managerMock = {
            create: jest
              .fn()
              .mockImplementation(
                (_entityClass: unknown, data: unknown) => data,
              ),
            save: jest.fn().mockImplementation((data: unknown) => {
              if (Array.isArray(data)) {
                // Kiểm tra gán role MEMBER cho cả 2 người
                expect(data).toHaveLength(2);
                expect((data[0] as ConversationMember).role).toBe(
                  ConversationMemberRole.MEMBER,
                );
                expect((data[1] as ConversationMember).role).toBe(
                  ConversationMemberRole.MEMBER,
                );
                return Promise.resolve(data);
              }
              return Promise.resolve({
                ...(data as object),
                id: 'new-conv-id',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          };
          return callback(managerMock);
        },
      );

      const result = await service.createDirectConversation(currentUserId, {
        targetUserId: targetFriendId,
      });

      expect(result.id).toBe('new-conv-id');
      expect(result.title).toBe('Trần Thị Bạn');
      expect(result.memberCount).toBe(2);
    });

    it('bắt mã lỗi xung đột khóa duy nhất PostgreSQL 23505 và trả về an toàn cuộc hội thoại vừa tạo song song', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({
        id: targetFriendId,
        fullName: 'Lê Văn Bạn',
        avatarUrl: null,
        role: UserRole.CLIENT,
        isActive: true,
      });
      (friendsService.areFriends as jest.Mock).mockResolvedValue(true);

      // Lần đầu check chưa thấy
      (convRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Transaction ném lỗi vi phạm khóa duy nhất 23505
      const pgUniqueError = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        {
          code: '23505',
          constraint: 'UQ_conversations_direct_user_key',
        },
      );
      (dataSource.transaction as jest.Mock).mockRejectedValue(pgUniqueError);

      // Lần thứ 2 tìm lại sau xung đột thì tìm thấy
      const existingAfterRace = {
        id: 'race-winner-id',
        type: ConversationType.DIRECT,
        directUserKey: [currentUserId, targetFriendId].sort().join(':'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Conversation;

      (convRepo.findOne as jest.Mock).mockResolvedValueOnce(existingAfterRace);
      (memberRepo.findOne as jest.Mock).mockResolvedValue({
        userId: targetFriendId,
        user: {
          id: targetFriendId,
          fullName: 'Lê Văn Bạn',
          avatarUrl: null,
          isActive: true,
        },
      });

      const result = await service.createDirectConversation(currentUserId, {
        targetUserId: targetFriendId,
      });

      expect(result.id).toBe('race-winner-id');
      expect(result.title).toBe('Lê Văn Bạn');
    });
  });

  describe('createGroupConversation', () => {
    it('chặn tạo nhóm nếu tên nhóm dưới 2 ký tự hoặc trên 100 ký tự', async () => {
      await expect(
        service.createGroupConversation(currentUserId, {
          title: ' a ',
          memberIds: ['f-1', 'f-2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('chặn tạo nhóm nếu tổng thành viên dưới 3', async () => {
      await expect(
        service.createGroupConversation(currentUserId, {
          title: 'Nhóm Test',
          memberIds: ['f-1'], // Chỉ có 1 bạn bè + 1 creator = 2 (< 3)
        }),
      ).rejects.toThrow('Hội thoại nhóm cần tối thiểu 2 người bạn');
    });

    it('chặn tạo nhóm nếu bạn bè được chọn không hợp lệ', async () => {
      (friendsService.validateAllAreFriends as jest.Mock).mockRejectedValue(
        new BadRequestException('Thành viên không phải bạn bè'),
      );

      await expect(
        service.createGroupConversation(currentUserId, {
          title: 'Nhóm Hợp Lệ',
          memberIds: ['f-1', 'stranger-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('tạo thành công nhóm với người tạo là OWNER và các bạn bè là MEMBER', async () => {
      (friendsService.validateAllAreFriends as jest.Mock).mockResolvedValue(
        undefined,
      );

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback: (manager: unknown) => Promise<unknown>) => {
          const managerMock = {
            create: jest
              .fn()
              .mockImplementation(
                (_entityClass: unknown, data: unknown) => data,
              ),
            save: jest.fn().mockImplementation((data: unknown) => {
              if (Array.isArray(data)) {
                expect((data[0] as ConversationMember).userId).toBe(
                  currentUserId,
                );
                expect((data[0] as ConversationMember).role).toBe(
                  ConversationMemberRole.OWNER,
                );
                expect((data[1] as ConversationMember).role).toBe(
                  ConversationMemberRole.MEMBER,
                );
                expect((data[2] as ConversationMember).role).toBe(
                  ConversationMemberRole.MEMBER,
                );
                return Promise.resolve(data);
              }
              return Promise.resolve({
                ...(data as object),
                id: 'group-id-1',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          };
          return callback(managerMock);
        },
      );

      // Giả lập findById
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: 'group-id-1',
        type: ConversationType.GROUP,
        title: 'Nhóm Dự Án Mới',
        avatarUrl: null,
        creatorId: currentUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [],
      });

      const result = await service.createGroupConversation(currentUserId, {
        title: ' Nhóm Dự Án Mới ',
        memberIds: ['friend-1', 'friend-2'],
      });

      expect(result.id).toBe('group-id-1');
      expect(result.type).toBe(ConversationType.GROUP);
      expect(result.title).toBe('Nhóm Dự Án Mới');
    });
  });

  describe('findById (IDOR Security)', () => {
    it('ném lỗi NotFoundException nếu người dùng không thuộc hội thoại (ngăn chặn IDOR)', async () => {
      (memberRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('hacker-id', 'conv-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('trả về chi tiết hội thoại nếu người dùng là thành viên hợp lệ', async () => {
      (memberRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'm-1',
        userId: currentUserId,
        conversationId: 'conv-123',
      });

      (convRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'conv-123',
        type: ConversationType.GROUP,
        title: 'Nhóm Teamwork',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (memberRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 'm-1',
          userId: currentUserId,
          role: ConversationMemberRole.OWNER,
          joinedAt: new Date(),
          user: {
            id: currentUserId,
            fullName: 'Tôi',
            avatarUrl: null,
            isActive: true,
          },
        },
      ] as ConversationMember[]);

      const detail = await service.findById(currentUserId, 'conv-123');
      expect(detail.id).toBe('conv-123');
      expect(detail.title).toBe('Nhóm Teamwork');
      expect(detail.members).toHaveLength(1);
    });
  });
});
