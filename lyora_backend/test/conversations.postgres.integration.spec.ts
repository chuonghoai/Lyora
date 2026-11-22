import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseSafetyGuard } from '../src/database/database-safety.guard';
import { TestAppDataSource } from '../src/database/test-data-source';
import { ConversationsService } from '../src/modules/conversations/conversations.service';
import { ConversationMember } from '../src/modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../src/modules/conversations/entities/idempotency-record.entity';
import { ConversationMemberRole } from '../src/modules/conversations/enums/conversation-member-role.enum';
import { ConversationType } from '../src/modules/conversations/enums/conversation-type.enum';
import { FriendsService } from '../src/modules/friends/friends.service';
import { Friendship } from '../src/modules/friends/entities/friendship.entity';
import { FriendshipStatus } from '../src/modules/friends/enums/friendship-status.enum';
import { UserRole } from '../src/common/enums/role.enum';
import { User } from '../src/modules/users/entities/user.entity';

describe('Real PostgreSQL Integration Tests - Conversation Management (lyora_test_db)', () => {
  let conversationsService: ConversationsService;
  let friendsService: FriendsService;

  let userRepo: Repository<User>;
  let friendshipRepo: Repository<Friendship>;
  let conversationRepo: Repository<Conversation>;
  let memberRepo: Repository<ConversationMember>;
  let idempotencyRepo: Repository<IdempotencyRecord>;

  let creatorUser: User;
  let friend1: User;
  let friend2: User;
  let strangerUser: User;
  const bulkFriends: User[] = [];

  beforeAll(async () => {
    // 1. Khởi tạo kết nối và xác minh Database Safety Guard
    if (!TestAppDataSource.isInitialized) {
      await TestAppDataSource.initialize();
    }
    await DatabaseSafetyGuard.assertTestDatabase(TestAppDataSource);

    userRepo = TestAppDataSource.getRepository(User);
    friendshipRepo = TestAppDataSource.getRepository(Friendship);
    conversationRepo = TestAppDataSource.getRepository(Conversation);
    memberRepo = TestAppDataSource.getRepository(ConversationMember);
    idempotencyRepo = TestAppDataSource.getRepository(IdempotencyRecord);

    friendsService = new FriendsService(friendshipRepo, userRepo);
    conversationsService = new ConversationsService(
      conversationRepo,
      memberRepo,
      idempotencyRepo,
      userRepo,
      friendsService,
      TestAppDataSource,
    );

    // 2. Dọn dẹp dữ liệu test cũ trong lyora_test_db
    await TestAppDataSource.query(
      'TRUNCATE TABLE idempotency_records, conversation_members, conversations, friendships, users CASCADE;',
    );

    const passwordHash = await bcrypt.hash('Test@123456', 10);

    // 3. Tạo các tài khoản kiểm thử chính
    creatorUser = await userRepo.save(
      userRepo.create({
        email: 'creator_test@gmail.com',
        fullName: 'Nguyễn Văn Tạo',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    friend1 = await userRepo.save(
      userRepo.create({
        email: 'friend1_test@gmail.com',
        fullName: 'Trần Văn Bạn 1',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    friend2 = await userRepo.save(
      userRepo.create({
        email: 'friend2_test@gmail.com',
        fullName: 'Lê Thị Bạn 2',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    strangerUser = await userRepo.save(
      userRepo.create({
        email: 'stranger_test@gmail.com',
        fullName: 'Vũ Người Lạ',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    // Tạo quan hệ bạn bè ACCEPTED với friend1 và friend2
    await friendshipRepo.save([
      friendshipRepo.create({
        userId: creatorUser.id,
        friendId: friend1.id,
        status: FriendshipStatus.ACCEPTED,
      }),
      friendshipRepo.create({
        userId: creatorUser.id,
        friendId: friend2.id,
        status: FriendshipStatus.ACCEPTED,
      }),
      friendshipRepo.create({
        userId: friend1.id,
        friendId: friend2.id,
        status: FriendshipStatus.ACCEPTED,
      }),
    ]);

    // Tạo 97 bạn bè bổ sung để đạt tổng 99 bạn bè cho kịch bản nhóm 100 thành viên
    const bulkUsersToCreate = [];
    for (let i = 3; i <= 99; i++) {
      bulkUsersToCreate.push(
        userRepo.create({
          email: `bulk_friend_${i}@gmail.com`,
          fullName: `Bạn Bè Số ${i}`,
          passwordHash,
          role: UserRole.CLIENT,
          isActive: true,
        }),
      );
    }
    const savedBulk = await userRepo.save(bulkUsersToCreate);
    bulkFriends.push(friend1, friend2, ...savedBulk);

    const bulkFriendships = savedBulk.map((u: User) =>
      friendshipRepo.create({
        userId: creatorUser.id,
        friendId: u.id,
        status: FriendshipStatus.ACCEPTED,
      }),
    );
    await friendshipRepo.save(bulkFriendships);
  }, 30000);

  afterAll(async () => {
    if (TestAppDataSource.isInitialized) {
      await TestAppDataSource.destroy();
    }
  });

  describe('1. Direct Conversation Tests', () => {
    it('1.1 Tạo cuộc hội thoại trực tiếp 1-1 hợp lệ', async () => {
      const conv = await conversationsService.createDirectConversation(
        creatorUser.id,
        { targetUserId: friend1.id },
      );

      expect(conv).toBeDefined();
      expect(conv.id).toBeDefined();
      expect(conv.type).toBe(ConversationType.DIRECT);
      expect(conv.memberCount).toBe(2);
      expect(conv.title).toBe(friend1.fullName);

      // Kiểm tra trong PostgreSQL
      const inDb = await conversationRepo.findOne({ where: { id: conv.id } });
      expect(inDb).toBeDefined();
      expect(inDb.type).toBe(ConversationType.DIRECT);
      expect(inDb.directUserKey).toBe(
        [creatorUser.id, friend1.id].sort().join(':'),
      );

      // Kiểm tra 2 members đều có role MEMBER
      const members = await memberRepo.find({
        where: { conversationId: conv.id },
      });
      expect(members.length).toBe(2);
      expect(
        members.every(
          (m: ConversationMember) => m.role === ConversationMemberRole.MEMBER,
        ),
      ).toBe(true);
    });

    it('1.2 Từ chối tạo cuộc hội thoại trực tiếp với chính mình', async () => {
      await expect(
        conversationsService.createDirectConversation(creatorUser.id, {
          targetUserId: creatorUser.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('1.3 Từ chối tạo cuộc hội thoại với người lạ (chưa kết bạn)', async () => {
      await expect(
        conversationsService.createDirectConversation(creatorUser.id, {
          targetUserId: strangerUser.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('1.4 Tái sử dụng hội thoại 1-1 đã tồn tại khi gọi lại', async () => {
      const first = await conversationsService.createDirectConversation(
        creatorUser.id,
        { targetUserId: friend1.id },
      );
      const second = await conversationsService.createDirectConversation(
        creatorUser.id,
        { targetUserId: friend1.id },
      );

      expect(second.id).toBe(first.id);
    });

    it('1.5 Concurrent requests từ cùng một phía trả về cùng một Conversation ID (Race Condition Trap)', async () => {
      const results = await Promise.all([
        conversationsService.createDirectConversation(creatorUser.id, {
          targetUserId: friend2.id,
        }),
        conversationsService.createDirectConversation(creatorUser.id, {
          targetUserId: friend2.id,
        }),
      ]);

      expect(results[0].id).toBe(results[1].id);

      // Kiểm tra trong database chỉ tồn tại duy nhất 1 cuộc trò chuyện
      const key = [creatorUser.id, friend2.id].sort().join(':');
      const count = await conversationRepo.count({
        where: { directUserKey: key },
      });
      expect(count).toBe(1);
    });

    it('1.6 Concurrent requests từ hai phía (A->B và B->A) trả về cùng Conversation ID', async () => {
      // friend1 và friend2 đã là bạn bè
      const results = await Promise.all([
        conversationsService.createDirectConversation(friend1.id, {
          targetUserId: friend2.id,
        }),
        conversationsService.createDirectConversation(friend2.id, {
          targetUserId: friend1.id,
        }),
      ]);

      expect(results[0].id).toBe(results[1].id);
    });
  });

  describe('2. Group Conversation Tests', () => {
    it('2.1 Tạo nhóm 3 thành viên thành công (Creator là OWNER, bạn bè là MEMBER)', async () => {
      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Dự Án Lyora 2026',
          memberIds: [friend1.id, friend2.id],
        },
      );

      expect(group).toBeDefined();
      expect(group.type).toBe(ConversationType.GROUP);
      expect(group.title).toBe('Nhóm Dự Án Lyora 2026');
      expect(group.members.length).toBe(3);

      const owner = group.members.find((m) => m.userId === creatorUser.id);
      expect(owner?.role).toBe(ConversationMemberRole.OWNER);

      const friendMembers = group.members.filter(
        (m) => m.userId !== creatorUser.id,
      );
      expect(friendMembers.length).toBe(2);
      expect(
        friendMembers.every((m) => m.role === ConversationMemberRole.MEMBER),
      ).toBe(true);

      // Kiểm tra trong PostgreSQL
      const inDb = await conversationRepo.findOne({ where: { id: group.id } });
      expect(inDb.type).toBe(ConversationType.GROUP);
      expect(inDb.directUserKey).toBeNull();
      expect(inDb.creatorId).toBe(creatorUser.id);
    });

    it('2.2 Từ chối tạo nhóm chỉ có 2 thành viên (dưới 3 thành viên)', async () => {
      await expect(
        conversationsService.createGroupConversation(creatorUser.id, {
          title: 'Nhóm Ít Người',
          memberIds: [friend1.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('2.3 Tạo nhóm tối đa 100 thành viên thành công (1 Creator + 99 Bạn bè)', async () => {
      const all99FriendIds = bulkFriends.slice(0, 99).map((f) => f.id);
      expect(all99FriendIds.length).toBe(99);

      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Đại Gia Đình Lyora 100 Người',
          memberIds: all99FriendIds,
        },
      );

      expect(group).toBeDefined();
      expect(group.members.length).toBe(100);
    });

    it('2.4 Từ chối tạo nhóm vượt quá 100 thành viên (101 thành viên)', async () => {
      // Tạo thêm 1 bạn bè nữa
      const extraFriend = await userRepo.save(
        userRepo.create({
          email: 'extra_friend@gmail.com',
          fullName: 'Bạn Thứ 100',
          passwordHash: creatorUser.passwordHash,
          role: UserRole.CLIENT,
          isActive: true,
        }),
      );
      await friendshipRepo.save(
        friendshipRepo.create({
          userId: creatorUser.id,
          friendId: extraFriend.id,
          status: FriendshipStatus.ACCEPTED,
        }),
      );

      const all100FriendIds = [
        ...bulkFriends.slice(0, 99).map((f) => f.id),
        extraFriend.id,
      ];
      expect(all100FriendIds.length).toBe(100);

      await expect(
        conversationsService.createGroupConversation(creatorUser.id, {
          title: 'Nhóm Quá Tải',
          memberIds: all100FriendIds,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('2.5 Từ chối người lạ trong danh sách thành viên nhóm', async () => {
      await expect(
        conversationsService.createGroupConversation(creatorUser.id, {
          title: 'Nhóm Có Người Lạ',
          memberIds: [friend1.id, strangerUser.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('2.6 Từ chối tên nhóm không hợp lệ (< 2 ký tự hoặc > 100 ký tự)', async () => {
      await expect(
        conversationsService.createGroupConversation(creatorUser.id, {
          title: 'A',
          memberIds: [friend1.id, friend2.id],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        conversationsService.createGroupConversation(creatorUser.id, {
          title: 'A'.repeat(101),
          memberIds: [friend1.id, friend2.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Transactional Idempotency Tests', () => {
    it('3.1 Retry cùng key và cùng payload trả về đúng hội thoại đã tạo', async () => {
      const idempotencyKey = 'idemp-test-key-001';
      const payload = {
        title: 'Nhóm Idempotency Test',
        memberIds: [friend1.id, friend2.id],
      };

      const firstCall = await conversationsService.createGroupConversation(
        creatorUser.id,
        payload,
        idempotencyKey,
      );

      const retryCall = await conversationsService.createGroupConversation(
        creatorUser.id,
        payload,
        idempotencyKey,
      );

      expect(retryCall.id).toBe(firstCall.id);

      // Xác minh trong bảng idempotency_records
      const record = await idempotencyRepo.findOne({
        where: { userId: creatorUser.id, idempotencyKey },
      });
      expect(record).toBeDefined();
      expect(record.resourceId).toBe(firstCall.id);
    });

    it('3.2 Concurrent requests cùng key và cùng payload xử lý an toàn không trùng lặp', async () => {
      const idempotencyKey = 'idemp-concurrent-key-002';
      const payload = {
        title: 'Nhóm Concurrent Idempotency',
        memberIds: [friend1.id, friend2.id],
      };

      const [res1, res2] = await Promise.all([
        conversationsService.createGroupConversation(
          creatorUser.id,
          payload,
          idempotencyKey,
        ),
        conversationsService.createGroupConversation(
          creatorUser.id,
          payload,
          idempotencyKey,
        ),
      ]);

      expect(res1.id).toBe(res2.id);

      // Chỉ có duy nhất 1 nhóm trong DB
      const groups = await conversationRepo.find({
        where: { title: 'Nhóm Concurrent Idempotency' },
      });
      expect(groups.length).toBe(1);
    });

    it('3.3 Cùng key nhưng payload khác bị từ chối với BadRequestException', async () => {
      const idempotencyKey = 'idemp-mismatch-key-003';

      await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Tên Ban Đầu',
          memberIds: [friend1.id, friend2.id],
        },
        idempotencyKey,
      );

      // Thử dùng lại key với tên khác
      await expect(
        conversationsService.createGroupConversation(
          creatorUser.id,
          {
            title: 'Tên Thay Đổi Khác Biệt',
            memberIds: [friend1.id, friend2.id],
          },
          idempotencyKey,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('3.4 Key khác nhau với cùng tên nhóm và thành viên cho phép tạo nhóm độc lập', async () => {
      const groupA = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Đồng Danh',
          memberIds: [friend1.id, friend2.id],
        },
        'key-distinct-A',
      );

      const groupB = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Đồng Danh',
          memberIds: [friend1.id, friend2.id],
        },
        'key-distinct-B',
      );

      expect(groupA.id).not.toBe(groupB.id);
    });

    it('3.5 Hai người dùng khác nhau sử dụng cùng key được xử lý độc lập', async () => {
      const sharedKey = 'shared-key-across-users';

      const groupCreator = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Của Creator',
          memberIds: [friend1.id, friend2.id],
        },
        sharedKey,
      );

      const groupFriend1 = await conversationsService.createGroupConversation(
        friend1.id,
        {
          title: 'Nhóm Của Friend1',
          memberIds: [creatorUser.id, friend2.id],
        },
        sharedKey,
      );

      expect(groupCreator.id).not.toBe(groupFriend1.id);
    });
  });

  describe('4. Authorization, Persistence & Multi-User Visibility', () => {
    it('4.1 Chống IDOR: Người lạ gọi findById bị từ chối với NotFoundException (404)', async () => {
      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Riêng Tư',
          memberIds: [friend1.id, friend2.id],
        },
      );

      await expect(
        conversationsService.findById(strangerUser.id, group.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('4.2 Thành viên khác nhìn thấy nhóm vừa được tạo trong danh sách của mình', async () => {
      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Chung Với Friend1',
          memberIds: [friend1.id, friend2.id],
        },
      );

      const friend1List = await conversationsService.findAllPaginated(
        friend1.id,
        {},
      );
      const foundInFriend1 = friend1List.items.some((c) => c.id === group.id);
      expect(foundInFriend1).toBe(true);

      const strangerList = await conversationsService.findAllPaginated(
        strangerUser.id,
        {},
      );
      const foundInStranger = strangerList.items.some((c) => c.id === group.id);
      expect(foundInStranger).toBe(false);
    });

    it('4.3 Persistence sau khi disconnect và reconnect kết nối PostgreSQL', async () => {
      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Kiểm Tra Persistence',
          memberIds: [friend1.id, friend2.id],
        },
      );

      // Disconnect và reconnect DataSource
      await TestAppDataSource.destroy();
      await TestAppDataSource.initialize();

      const freshConvRepo = TestAppDataSource.getRepository(Conversation);
      const reconnectedGroup = await freshConvRepo.findOne({
        where: { id: group.id },
      });

      expect(reconnectedGroup).toBeDefined();
      expect(reconnectedGroup.title).toBe('Nhóm Kiểm Tra Persistence');
    });

    it('4.4 Danh sách thành viên trùng lặp (duplicate memberIds) được deduplicate tự động', async () => {
      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Deduplicate IDs',
          memberIds: [friend1.id, friend1.id, friend2.id, friend2.id],
        },
      );

      expect(group.members.length).toBe(3); // Creator (OWNER) + friend1 (MEMBER) + friend2 (MEMBER)
    });

    it('4.5 Cuộc hội thoại đã soft-delete (deletedAt != null) không thể truy cập', async () => {
      const group = await conversationsService.createGroupConversation(
        creatorUser.id,
        {
          title: 'Nhóm Sắp Xóa',
          memberIds: [friend1.id, friend2.id],
        },
      );

      // Thực hiện soft-delete thủ công trong DB
      await conversationRepo.update(group.id, { deletedAt: new Date() });

      // Gọi findById ném NotFoundException
      await expect(
        conversationsService.findById(creatorUser.id, group.id),
      ).rejects.toThrow(NotFoundException);

      // Gọi findAllPaginated không chứa group này
      const list = await conversationsService.findAllPaginated(
        creatorUser.id,
        {},
      );
      expect(list.items.some((c) => c.id === group.id)).toBe(false);
    });

    it('4.6 Transaction rollback: Lỗi bất ngờ trong transaction đảm bảo không lưu conversation mồ côi', async () => {
      const initialCount = await conversationRepo.count();

      // Giả lập lỗi bằng cách ép lỗi trong transaction qua một service gọi dataSource.transaction
      await expect(
        TestAppDataSource.transaction(async (manager) => {
          const conv = manager.create(Conversation, {
            type: ConversationType.GROUP,
            title: 'Nhóm Transaction Rollback',
            creatorId: creatorUser.id,
          });
          await manager.save(conv);
          throw new Error('Simulated failure during member insertion');
        }),
      ).rejects.toThrow('Simulated failure during member insertion');

      // Số lượng conversation trong DB không tăng lên (đã rollback hoàn toàn)
      const finalCount = await conversationRepo.count();
      expect(finalCount).toBe(initialCount);
    });

    it('4.7 Người dùng role ADMIN không được phép tham gia hội thoại trực tiếp', async () => {
      const adminUser = await userRepo.save(
        userRepo.create({
          email: 'admin_test@gmail.com',
          fullName: 'Quản Trị Viên',
          passwordHash: creatorUser.passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
        }),
      );

      // Khi người dùng gửi targetUserId là admin, createDirectConversation từ chối với NotFoundException
      await expect(
        conversationsService.createDirectConversation(creatorUser.id, {
          targetUserId: adminUser.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
