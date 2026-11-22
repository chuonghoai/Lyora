import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FriendsService } from '../src/modules/friends/friends.service';
import { User } from '../src/modules/users/entities/user.entity';
import { ConversationsService } from '../src/modules/conversations/conversations.service';
import { ConversationMember } from '../src/modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../src/modules/conversations/entities/idempotency-record.entity';
import { ConversationMemberRole } from '../src/modules/conversations/enums/conversation-member-role.enum';
import { ConversationType } from '../src/modules/conversations/enums/conversation-type.enum';

describe('Group Management Tests (Backend)', () => {
  let service: ConversationsService;
  let convRepo: jest.Mocked<Partial<Repository<Conversation>>>;
  let memberRepo: jest.Mocked<Partial<Repository<ConversationMember>>>;
  let idempotencyRepo: jest.Mocked<Partial<Repository<IdempotencyRecord>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let friendsService: jest.Mocked<Partial<FriendsService>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let mockEntityManager: jest.Mocked<Partial<EntityManager>>;

  const ownerId = 'user-owner-uuid';
  const memberId1 = 'user-member-1-uuid';
  const memberId2 = 'user-member-2-uuid';
  const outsiderId = 'user-outsider-uuid';
  const groupConvId = 'group-conv-uuid';
  const directConvId = 'direct-conv-uuid';

  const mockGroupConv: Partial<Conversation> = {
    id: groupConvId,
    type: ConversationType.GROUP,
    title: 'Nhóm Test Lyora',
    creatorId: ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockOwnerMembership: Partial<ConversationMember> = {
    id: 'mem-owner-id',
    conversationId: groupConvId,
    userId: ownerId,
    role: ConversationMemberRole.OWNER,
    joinedAt: new Date(),
    deletedAt: null,
  };

  const mockMember1Membership: Partial<ConversationMember> = {
    id: 'mem-1-id',
    conversationId: groupConvId,
    userId: memberId1,
    role: ConversationMemberRole.MEMBER,
    joinedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    convRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    memberRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
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

    mockEntityManager = {
      find: jest.fn().mockImplementation((_entity: unknown, opts: unknown) => {
        return memberRepo.find!(opts);
      }),
      findOne: jest
        .fn()
        .mockImplementation((_entity: unknown, opts: unknown) => {
          return memberRepo.findOne!(opts);
        }),
      save: jest
        .fn()
        .mockImplementation((data: unknown) => Promise.resolve(data)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest
        .fn()
        .mockImplementation((_entity: unknown, data: object): object => data),
      createQueryBuilder: jest.fn(),
      getRepository: jest.fn().mockImplementation((entity: unknown) => {
        if (entity === Conversation) {
          return convRepo;
        }
        return memberRepo;
      }),
    };
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (cb: (em: EntityManager) => Promise<unknown>) => {
            return cb(mockEntityManager as unknown as EntityManager);
          },
        ),
    };

    service = new ConversationsService(
      convRepo as Repository<Conversation>,
      memberRepo as Repository<ConversationMember>,
      idempotencyRepo as Repository<IdempotencyRecord>,
      userRepo as Repository<User>,
      friendsService as FriendsService,
      dataSource as DataSource,
    );

    // Mock findById for responses
    jest.spyOn(service, 'findById').mockImplementation(async (_userId, id) => {
      await Promise.resolve();
      return {
        id,
        type: ConversationType.GROUP,
        title: 'Nhóm Test Lyora',
        avatarUrl: null,
        creatorId: ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 'mem-owner-id',
            userId: ownerId,
            role: ConversationMemberRole.OWNER,
            joinedAt: new Date(),
            user: {
              id: ownerId,
              fullName: 'Chủ Nhóm',
              avatarUrl: null,
              isOnline: false,
            },
          },
          {
            id: 'mem-1-id',
            userId: memberId1,
            role: ConversationMemberRole.MEMBER,
            joinedAt: new Date(),
            user: {
              id: memberId1,
              fullName: 'Thành Viên 1',
              avatarUrl: null,
              isOnline: false,
            },
          },
        ],
      };
    });
  });

  describe('assertGroupMembership & IDOR Protection', () => {
    it('ném lỗi NotFoundException nếu hội thoại không tồn tại', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateGroupTitle(ownerId, 'non-existent-id', {
          title: 'Tên Mới',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném lỗi BadRequestException nếu hội thoại là DIRECT', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({
        id: directConvId,
        type: ConversationType.DIRECT,
        deletedAt: null,
      });

      await expect(
        service.updateGroupTitle(ownerId, directConvId, {
          title: 'Tên Mới',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi NotFoundException nếu người gọi không thuộc nhóm (IDOR Safe)', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue(mockGroupConv);
      (memberRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateGroupTitle(outsiderId, groupConvId, {
          title: 'Tên Mới',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateGroupTitle', () => {
    it('cho phép OWNER đổi tên nhóm thành công', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (convRepo.save as jest.Mock).mockResolvedValue({
        ...mockGroupConv,
        title: 'Tên Nhóm Đã Đổi',
      });

      const res = await service.updateGroupTitle(ownerId, groupConvId, {
        title: 'Tên Nhóm Đã Đổi',
      });

      expect(convRepo.save).toHaveBeenCalled();
      expect(res.id).toBe(groupConvId);
    });

    it('từ chối MEMBER đổi tên nhóm với lỗi ForbiddenException (403)', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(
        mockMember1Membership,
      );

      await expect(
        service.updateGroupTitle(memberId1, groupConvId, {
          title: 'MEMBER cố đổi tên',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('từ chối tên nhóm ngắn hơn 2 ký tự hoặc dài hơn 100 ký tự', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);

      await expect(
        service.updateGroupTitle(ownerId, groupConvId, {
          title: ' ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addGroupMembers', () => {
    it('cho phép OWNER thêm bạn bè thành công vào nhóm', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (friendsService.validateAllAreFriends as jest.Mock).mockResolvedValue(
        true,
      );

      (mockEntityManager.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
        mockMember1Membership,
      ]);
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null); // chưa từng vào nhóm

      await service.addGroupMembers(ownerId, groupConvId, {
        memberIds: [memberId2],
      });

      expect(friendsService.validateAllAreFriends).toHaveBeenCalledWith(
        ownerId,
        [memberId2],
      );
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('từ chối MEMBER thêm người vào nhóm với lỗi ForbiddenException (403)', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(
        mockMember1Membership,
      );
      (friendsService.validateAllAreFriends as jest.Mock).mockResolvedValue(
        true,
      );

      await expect(
        service.addGroupMembers(memberId1, groupConvId, {
          memberIds: [memberId2],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('khôi phục bản ghi soft-deleted khi thành viên cũ được thêm lại', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (friendsService.validateAllAreFriends as jest.Mock).mockResolvedValue(
        true,
      );

      (mockEntityManager.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
      ]);

      const softDeletedRecord = {
        id: 'old-mem-id',
        conversationId: groupConvId,
        userId: memberId1,
        deletedAt: new Date(),
        role: ConversationMemberRole.MEMBER,
      };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(
        softDeletedRecord,
      );

      await service.addGroupMembers(ownerId, groupConvId, {
        memberIds: [memberId1],
      });

      expect(softDeletedRecord.deletedAt).toBeNull();
      expect(softDeletedRecord.role).toBe(ConversationMemberRole.MEMBER);
      expect(mockEntityManager.save).toHaveBeenCalledWith(softDeletedRecord);
    });

    it('từ chối thêm nếu người được chọn đã là thành viên đang hoạt động', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (friendsService.validateAllAreFriends as jest.Mock).mockResolvedValue(
        true,
      );

      (mockEntityManager.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
        mockMember1Membership,
      ]);

      await expect(
        service.addGroupMembers(ownerId, groupConvId, {
          memberIds: [memberId1],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối thêm nếu số lượng vượt quá 100 thành viên', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (friendsService.validateAllAreFriends as jest.Mock).mockResolvedValue(
        true,
      );

      const ninetyNineMembers = Array.from({ length: 99 }, (_, i) => ({
        id: `mem-${i}`,
        userId: `user-${i}`,
      }));
      (mockEntityManager.find as jest.Mock).mockResolvedValue(
        ninetyNineMembers,
      );

      await expect(
        service.addGroupMembers(ownerId, groupConvId, {
          memberIds: ['user-extra-1', 'user-extra-2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember (Kick)', () => {
    it('cho phép OWNER xóa một MEMBER ra khỏi nhóm', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(
        mockMember1Membership,
      );

      await service.removeMember(ownerId, groupConvId, memberId1);

      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        ConversationMember,
        mockMember1Membership.id,
      );
    });

    it('từ chối MEMBER xóa thành viên khác với lỗi ForbiddenException (403)', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(
        mockMember1Membership,
      );

      await expect(
        service.removeMember(memberId1, groupConvId, memberId2),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ngăn chặn OWNER tự xóa chính mình qua endpoint kick', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);

      await expect(
        service.removeMember(ownerId, groupConvId, ownerId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('transferOwnership', () => {
    it('cho phép OWNER chuyển quyền cho một MEMBER hợp lệ', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      const callerOwner = { ...mockOwnerMembership };
      const targetMember = { ...mockMember1Membership };
      (memberRepo.findOne as jest.Mock).mockImplementation(
        (opts?: { where?: { userId?: string } }) => {
          if (opts?.where?.userId === ownerId)
            return Promise.resolve(callerOwner);
          if (opts?.where?.userId === memberId1)
            return Promise.resolve(targetMember);
          return Promise.resolve(null);
        },
      );

      await service.transferOwnership(ownerId, groupConvId, {
        newOwnerId: memberId1,
      });

      expect(callerOwner.role).toBe(ConversationMemberRole.MEMBER);
      expect(targetMember.role).toBe(ConversationMemberRole.OWNER);
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('từ chối chuyển quyền cho chính mình', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);

      await expect(
        service.transferOwnership(ownerId, groupConvId, {
          newOwnerId: ownerId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối chuyển quyền cho người ngoài nhóm', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockImplementation(
        (opts?: { where?: { userId?: string } }) => {
          if (opts?.where?.userId === ownerId)
            return Promise.resolve(mockOwnerMembership);
          return Promise.resolve(null);
        },
      );

      await expect(
        service.transferOwnership(ownerId, groupConvId, {
          newOwnerId: outsiderId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('leaveGroup', () => {
    it('cho phép MEMBER thường tự do rời nhóm', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(
        mockMember1Membership,
      );
      (memberRepo.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
        mockMember1Membership,
      ]);

      const res = await service.leaveGroup(memberId1, groupConvId, {});

      expect(res.success).toBe(true);
      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        ConversationMember,
        mockMember1Membership.id,
      );
    });

    it('bắt buộc OWNER phải chỉ định người kế nhiệm nếu nhóm còn nhiều thành viên', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (memberRepo.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
        mockMember1Membership,
      ]);

      await expect(
        service.leaveGroup(ownerId, groupConvId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('cho phép OWNER rời nhóm khi đã chỉ định người kế nhiệm hợp lệ', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      const successor = { ...mockMember1Membership };
      (memberRepo.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
        successor,
      ]);

      const res = await service.leaveGroup(ownerId, groupConvId, {
        newOwnerId: memberId1,
      });

      expect(res.success).toBe(true);
      expect(successor.role).toBe(ConversationMemberRole.OWNER);
      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        ConversationMember,
        mockOwnerMembership.id,
      );
    });

    it('tự động giải tán nhóm nếu thành viên cuối cùng rời nhóm', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (memberRepo.find as jest.Mock).mockResolvedValue([mockOwnerMembership]);

      const res = await service.leaveGroup(ownerId, groupConvId, {});

      expect(res.success).toBe(true);
      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        Conversation,
        groupConvId,
      );
    });
  });

  describe('dissolveGroup', () => {
    it('cho phép OWNER giải tán nhóm thành công', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(mockOwnerMembership);
      (memberRepo.find as jest.Mock).mockResolvedValue([
        mockOwnerMembership,
        mockMember1Membership,
      ]);

      const res = await service.dissolveGroup(ownerId, groupConvId);

      expect(res.success).toBe(true);
      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        Conversation,
        groupConvId,
      );
      expect(mockEntityManager.softDelete).toHaveBeenCalledWith(
        ConversationMember,
        [mockOwnerMembership.id, mockMember1Membership.id],
      );
    });

    it('từ chối MEMBER giải tán nhóm với lỗi ForbiddenException (403)', async () => {
      (convRepo.findOne as jest.Mock).mockResolvedValue({ ...mockGroupConv });
      (memberRepo.findOne as jest.Mock).mockResolvedValue(
        mockMember1Membership,
      );

      await expect(
        service.dissolveGroup(memberId1, groupConvId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
