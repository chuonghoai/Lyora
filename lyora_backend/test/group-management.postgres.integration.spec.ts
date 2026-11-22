import * as bcrypt from 'bcrypt';
import { Repository, IsNull } from 'typeorm';
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

describe('Real PostgreSQL Integration Tests - Group Management (lyora_test_db)', () => {
  let conversationsService: ConversationsService;
  let friendsService: FriendsService;

  let userRepo: Repository<User>;
  let friendshipRepo: Repository<Friendship>;
  let conversationRepo: Repository<Conversation>;
  let memberRepo: Repository<ConversationMember>;
  let idempotencyRepo: Repository<IdempotencyRecord>;

  let ownerUser: User;
  let memberUser1: User;
  let memberUser2: User;
  let memberUser3: User;
  let strangerUser: User;
  const bulkFriends: User[] = [];

  beforeAll(async () => {
    // 1. Khởi tạo kết nối và kiểm tra Database Safety Guard
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

    // 2. Dọn dẹp dữ liệu bảng test
    await TestAppDataSource.query(
      'TRUNCATE TABLE idempotency_records, conversation_members, conversations, friendships, users CASCADE;',
    );

    const passwordHash = await bcrypt.hash('Test@123456', 10);

    // 3. Tạo các tài khoản người dùng
    ownerUser = await userRepo.save(
      userRepo.create({
        email: 'owner_gm@gmail.com',
        fullName: 'Chủ Nhóm Nguyễn',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    memberUser1 = await userRepo.save(
      userRepo.create({
        email: 'member1_gm@gmail.com',
        fullName: 'Thành Viên Một',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    memberUser2 = await userRepo.save(
      userRepo.create({
        email: 'member2_gm@gmail.com',
        fullName: 'Thành Viên Hai',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    memberUser3 = await userRepo.save(
      userRepo.create({
        email: 'member3_gm@gmail.com',
        fullName: 'Thành Viên Ba',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    strangerUser = await userRepo.save(
      userRepo.create({
        email: 'stranger_gm@gmail.com',
        fullName: 'Người Lạ Không Bạn Bè',
        passwordHash,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );

    // 4. Thiết lập quan hệ bạn bè ACCEPTED giữa ownerUser và các members
    await friendshipRepo.save([
      friendshipRepo.create({
        userId: ownerUser.id,
        friendId: memberUser1.id,
        status: FriendshipStatus.ACCEPTED,
      }),
      friendshipRepo.create({
        userId: ownerUser.id,
        friendId: memberUser2.id,
        status: FriendshipStatus.ACCEPTED,
      }),
      friendshipRepo.create({
        userId: ownerUser.id,
        friendId: memberUser3.id,
        status: FriendshipStatus.ACCEPTED,
      }),
    ]);

    // 5. Tạo 102 bạn bè bổ sung để kiểm tra giới hạn 100 thành viên và concurrency
    const bulkUsersToCreate = [];
    for (let i = 4; i <= 105; i++) {
      bulkUsersToCreate.push(
        userRepo.create({
          email: `bulk_gm_${i}@gmail.com`,
          fullName: `Bạn Bè GM Số ${i}`,
          passwordHash,
          role: UserRole.CLIENT,
          isActive: true,
        }),
      );
    }
    const savedBulk = await userRepo.save(bulkUsersToCreate);
    bulkFriends.push(...savedBulk);

    const bulkFriendships = savedBulk.map((u: User) =>
      friendshipRepo.create({
        userId: ownerUser.id,
        friendId: u.id,
        status: FriendshipStatus.ACCEPTED,
      }),
    );
    await friendshipRepo.save(bulkFriendships);
  });

  afterAll(async () => {
    if (TestAppDataSource.isInitialized) {
      await TestAppDataSource.destroy();
    }
  });

  describe('1. updateGroupTitle (Đổi tên nhóm)', () => {
    let testGroup: Conversation;

    beforeEach(async () => {
      // Tạo group mới có ownerUser, memberUser1, memberUser2
      testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Thảo Luận Test',
          memberIds: [memberUser1.id, memberUser2.id],
        },
      );
    });

    it('1.1 OWNER đổi tên nhóm thành công và lưu vào PostgreSQL', async () => {
      const updated = await conversationsService.updateGroupTitle(
        ownerUser.id,
        testGroup.id,
        { title: 'Tên Nhóm Mới Đã Đổi' },
      );

      expect(updated.title).toBe('Tên Nhóm Mới Đã Đổi');

      const inDb = await conversationRepo.findOneBy({ id: testGroup.id });
      expect(inDb?.title).toBe('Tên Nhóm Mới Đã Đổi');
    });

    it('1.2 MEMBER cố đổi tên nhóm bị chặn với ForbiddenException (403) và DB không đổi', async () => {
      await expect(
        conversationsService.updateGroupTitle(memberUser1.id, testGroup.id, {
          title: 'Hacker Đổi Tên',
        }),
      ).rejects.toThrow(ForbiddenException);

      const inDb = await conversationRepo.findOneBy({ id: testGroup.id });
      expect(inDb?.title).toBe('Nhóm Thảo Luận Test');
    });

    it('1.3 Tên nhóm rỗng hoặc chỉ toàn khoảng trắng bị từ chối với BadRequestException', async () => {
      await expect(
        conversationsService.updateGroupTitle(ownerUser.id, testGroup.id, {
          title: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. addGroupMembers (Thêm thành viên vào nhóm)', () => {
    let testGroup: Conversation;

    beforeEach(async () => {
      testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Thêm Thành Viên',
          memberIds: [memberUser1.id, memberUser2.id],
        },
      );
    });

    it('2.1 OWNER thêm bạn bè thành công vào nhóm trong PostgreSQL', async () => {
      const result = await conversationsService.addGroupMembers(
        ownerUser.id,
        testGroup.id,
        { memberIds: [memberUser3.id] },
      );

      expect(result.members.length).toBe(4); // owner + member1 + member2 + member3
      const memberInDb = await memberRepo.findOne({
        where: {
          conversationId: testGroup.id,
          userId: memberUser3.id,
          deletedAt: IsNull(),
        },
      });
      expect(memberInDb).toBeDefined();
      expect(memberInDb?.role).toBe(ConversationMemberRole.MEMBER);
    });

    it('2.2 MEMBER cố thêm thành viên bị chặn với ForbiddenException (403)', async () => {
      await expect(
        conversationsService.addGroupMembers(memberUser1.id, testGroup.id, {
          memberIds: [memberUser3.id],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('2.3 Thêm người không phải bạn bè bị từ chối với BadRequestException (400)', async () => {
      await expect(
        conversationsService.addGroupMembers(ownerUser.id, testGroup.id, {
          memberIds: [strangerUser.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('2.4 Thêm người đã là thành viên đang hoạt động bị từ chối với BadRequestException (400)', async () => {
      await expect(
        conversationsService.addGroupMembers(ownerUser.id, testGroup.id, {
          memberIds: [memberUser1.id],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('2.5 Khôi phục thành viên đã bị soft-delete (deletedAt != null) mà không dính lỗi trùng Unique Constraint', async () => {
      // 1. Kick memberUser1 ra khỏi nhóm
      await conversationsService.removeMember(
        ownerUser.id,
        testGroup.id,
        memberUser1.id,
      );

      // Xác minh memberUser1 đã bị soft-delete
      const kickedMember = await memberRepo.findOne({
        where: { conversationId: testGroup.id, userId: memberUser1.id },
        withDeleted: true,
      });
      expect(kickedMember?.deletedAt).not.toBeNull();

      // 2. OWNER thêm lại memberUser1
      const result = await conversationsService.addGroupMembers(
        ownerUser.id,
        testGroup.id,
        { memberIds: [memberUser1.id] },
      );

      // Xác minh đã khôi phục thành công
      const restoredMember = await memberRepo.findOne({
        where: {
          conversationId: testGroup.id,
          userId: memberUser1.id,
          deletedAt: IsNull(),
        },
      });
      expect(restoredMember).toBeDefined();
      expect(restoredMember?.deletedAt).toBeNull();
      expect(restoredMember?.role).toBe(ConversationMemberRole.MEMBER);
      expect(result.members.some((m) => m.userId === memberUser1.id)).toBe(
        true,
      );
    });
  });

  describe('3. removeMember (Xóa thành viên khỏi nhóm - Kick)', () => {
    let testGroup: Conversation;

    beforeEach(async () => {
      testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Xóa Thành Viên',
          memberIds: [memberUser1.id, memberUser2.id],
        },
      );
    });

    it('3.1 OWNER xóa MEMBER thành công (soft delete)', async () => {
      await conversationsService.removeMember(
        ownerUser.id,
        testGroup.id,
        memberUser1.id,
      );

      const activeMembers = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      expect(activeMembers.length).toBe(2); // còn owner và member2
      expect(activeMembers.some((m) => m.userId === memberUser1.id)).toBe(
        false,
      );

      const kicked = await memberRepo.findOne({
        where: { conversationId: testGroup.id, userId: memberUser1.id },
        withDeleted: true,
      });
      expect(kicked?.deletedAt).not.toBeNull();
    });

    it('3.2 MEMBER thường cố kick người khác bị chặn với ForbiddenException (403)', async () => {
      await expect(
        conversationsService.removeMember(
          memberUser1.id,
          testGroup.id,
          memberUser2.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('3.3 OWNER tự kick chính mình bị từ chối với BadRequestException (400)', async () => {
      await expect(
        conversationsService.removeMember(
          ownerUser.id,
          testGroup.id,
          ownerUser.id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. transferOwnership (Chuyển quyền OWNER)', () => {
    let testGroup: Conversation;

    beforeEach(async () => {
      testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Chuyển Quyền',
          memberIds: [memberUser1.id, memberUser2.id],
        },
      );
    });

    it('4.1 OWNER chuyển quyền thành công cho MEMBER trong PostgreSQL', async () => {
      const result = await conversationsService.transferOwnership(
        ownerUser.id,
        testGroup.id,
        { newOwnerId: memberUser1.id },
      );

      // Kiểm tra trong kết quả trả về
      const oldOwnerInRes = result.members.find(
        (m) => m.userId === ownerUser.id,
      );
      const newOwnerInRes = result.members.find(
        (m) => m.userId === memberUser1.id,
      );
      expect(oldOwnerInRes?.role).toBe(ConversationMemberRole.MEMBER);
      expect(newOwnerInRes?.role).toBe(ConversationMemberRole.OWNER);

      // Kiểm tra trực tiếp trong PostgreSQL DB
      const oldOwnerDb = await memberRepo.findOneBy({
        conversationId: testGroup.id,
        userId: ownerUser.id,
      });
      const newOwnerDb = await memberRepo.findOneBy({
        conversationId: testGroup.id,
        userId: memberUser1.id,
      });
      expect(oldOwnerDb?.role).toBe(ConversationMemberRole.MEMBER);
      expect(newOwnerDb?.role).toBe(ConversationMemberRole.OWNER);
    });

    it('4.2 MEMBER cố chuyển quyền bị chặn với ForbiddenException (403)', async () => {
      await expect(
        conversationsService.transferOwnership(memberUser1.id, testGroup.id, {
          newOwnerId: memberUser2.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('4.3 Chuyển quyền cho người ngoài nhóm bị từ chối với BadRequestException (400)', async () => {
      await expect(
        conversationsService.transferOwnership(ownerUser.id, testGroup.id, {
          newOwnerId: strangerUser.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('4.4 Chuyển quyền cho chính mình bị từ chối với BadRequestException (400)', async () => {
      await expect(
        conversationsService.transferOwnership(ownerUser.id, testGroup.id, {
          newOwnerId: ownerUser.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. leaveGroup (Rời nhóm)', () => {
    let testGroup: Conversation;

    beforeEach(async () => {
      testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Rời Nhóm',
          memberIds: [memberUser1.id, memberUser2.id],
        },
      );
    });

    it('5.1 MEMBER thường tự do rời nhóm thành công', async () => {
      await conversationsService.leaveGroup(memberUser1.id, testGroup.id, {});

      const activeMembers = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      expect(activeMembers.length).toBe(2);
      expect(activeMembers.some((m) => m.userId === memberUser1.id)).toBe(
        false,
      );
    });

    it('5.2 OWNER rời nhóm nhưng KHÔNG chỉ định người kế nhiệm bị từ chối (400)', async () => {
      await expect(
        conversationsService.leaveGroup(ownerUser.id, testGroup.id, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('5.3 OWNER rời nhóm VÀ chỉ định người kế nhiệm hợp lệ: chuyển quyền và rời nhóm thành công', async () => {
      await conversationsService.leaveGroup(ownerUser.id, testGroup.id, {
        newOwnerId: memberUser1.id,
      });

      // MemberUser1 đã trở thành OWNER mới
      const newOwner = await memberRepo.findOneBy({
        conversationId: testGroup.id,
        userId: memberUser1.id,
        deletedAt: IsNull(),
      });
      expect(newOwner?.role).toBe(ConversationMemberRole.OWNER);

      // Cựu OWNER đã bị soft-deleted
      const oldOwner = await memberRepo.findOne({
        where: { conversationId: testGroup.id, userId: ownerUser.id },
        withDeleted: true,
      });
      expect(oldOwner?.deletedAt).not.toBeNull();
    });

    it('5.4 Thành viên cuối cùng rời nhóm -> Nhóm tự động giải tán', async () => {
      // Cho 2 member rời nhóm trước
      await conversationsService.leaveGroup(memberUser1.id, testGroup.id, {});
      await conversationsService.leaveGroup(memberUser2.id, testGroup.id, {});

      // Nhóm lúc này chỉ còn 1 mình ownerUser
      const remaining = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      expect(remaining.length).toBe(1);

      // ownerUser rời nhóm (không cần successor vì là thành viên duy nhất)
      await conversationsService.leaveGroup(ownerUser.id, testGroup.id, {});

      // Cuộc hội thoại đã tự động bị soft-deleted
      const convInDb = await conversationRepo.findOne({
        where: { id: testGroup.id },
        withDeleted: true,
      });
      expect(convInDb?.deletedAt).not.toBeNull();

      // Gọi findById sẽ nhận 404
      await expect(
        conversationsService.findById(testGroup.id, ownerUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('5.5 Thành viên đã rời hoặc bị kick không được xem nhóm (IDOR Protection)', async () => {
      await conversationsService.removeMember(
        ownerUser.id,
        testGroup.id,
        memberUser1.id,
      );

      // memberUser1 gọi findById phải bị từ chối 404 (IDOR-safe)
      await expect(
        conversationsService.findById(testGroup.id, memberUser1.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('5.6 OWNER chuyển quyền thành công, sau đó cựu OWNER rời nhóm như một MEMBER tự do', async () => {
      // 1. Chuyển quyền cho memberUser1
      await conversationsService.transferOwnership(ownerUser.id, testGroup.id, {
        newOwnerId: memberUser1.id,
      });

      // 2. Cựu OWNER (giờ là MEMBER) tự do rời nhóm mà không cần successor
      await conversationsService.leaveGroup(ownerUser.id, testGroup.id, {});

      const activeMembers = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      expect(activeMembers.some((m) => m.userId === ownerUser.id)).toBe(false);
      const newOwner = activeMembers.find((m) => m.userId === memberUser1.id);
      expect(newOwner?.role).toBe(ConversationMemberRole.OWNER);
    });
  });

  describe('6. dissolveGroup (Giải tán nhóm)', () => {
    let testGroup: Conversation;

    beforeEach(async () => {
      testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Giải Tán',
          memberIds: [memberUser1.id, memberUser2.id],
        },
      );
    });

    it('6.1 MEMBER cố giải tán nhóm bị chặn với ForbiddenException (403)', async () => {
      await expect(
        conversationsService.dissolveGroup(memberUser1.id, testGroup.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('6.2 OWNER giải tán nhóm thành công: soft-delete cuộc hội thoại và tất cả thành viên', async () => {
      await conversationsService.dissolveGroup(ownerUser.id, testGroup.id);

      // Kiểm tra cuộc hội thoại đã bị soft delete
      const conv = await conversationRepo.findOne({
        where: { id: testGroup.id },
        withDeleted: true,
      });
      expect(conv?.deletedAt).not.toBeNull();

      // Kiểm tra tất cả thành viên đã bị soft delete
      const activeMembers = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      expect(activeMembers.length).toBe(0);

      // Kiểm tra findById ném lỗi NotFoundException (404)
      await expect(
        conversationsService.findById(testGroup.id, ownerUser.id),
      ).rejects.toThrow(NotFoundException);

      // Kiểm tra findAllPaginated không còn chứa nhóm này
      const list = await conversationsService.findAllPaginated(ownerUser.id, {
        page: 1,
        limit: 10,
      });
      expect(list.items.some((c) => c.id === testGroup.id)).toBe(false);
    });
  });

  describe('7. Concurrency & Pessimistic Lock', () => {
    it('7.1 Xử lý đồng thời 2 yêu cầu kick thành viên khác nhau một cách an toàn không gây race condition', async () => {
      const testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Concurrency Kick',
          memberIds: [memberUser1.id, memberUser2.id, memberUser3.id],
        },
      );

      // Chạy đồng thời 2 lệnh kick memberUser1 và memberUser2
      await Promise.all([
        conversationsService.removeMember(
          ownerUser.id,
          testGroup.id,
          memberUser1.id,
        ),
        conversationsService.removeMember(
          ownerUser.id,
          testGroup.id,
          memberUser2.id,
        ),
      ]);

      const activeMembers = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      expect(activeMembers.length).toBe(2); // còn owner và memberUser3
      expect(activeMembers.some((m) => m.userId === memberUser1.id)).toBe(
        false,
      );
      expect(activeMembers.some((m) => m.userId === memberUser2.id)).toBe(
        false,
      );
      expect(activeMembers.some((m) => m.userId === memberUser3.id)).toBe(true);
    });

    it('7.2 Hai request đồng thời chuyển quyền OWNER: đúng 1 request thành công, request còn lại bị từ chối 403, nhóm luôn có đúng 1 OWNER duy nhất', async () => {
      const testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Concurrency Chuyển Quyền',
          memberIds: [memberUser1.id, memberUser2.id, memberUser3.id],
        },
      );

      // ownerUser đồng thời gửi 2 request chuyển quyền cho 2 người khác nhau
      const results = await Promise.allSettled([
        conversationsService.transferOwnership(ownerUser.id, testGroup.id, {
          newOwnerId: memberUser1.id,
        }),
        conversationsService.transferOwnership(ownerUser.id, testGroup.id, {
          newOwnerId: memberUser2.id,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason).toBeInstanceOf(ForbiddenException);

      // Database Invariant: chỉ có đúng 1 OWNER active trong nhóm
      const activeOwners = await memberRepo.find({
        where: {
          conversationId: testGroup.id,
          role: ConversationMemberRole.OWNER,
          deletedAt: IsNull(),
        },
      });
      expect(activeOwners.length).toBe(1);
    });

    it('7.3 Chuyển OWNER và kick người kế nhiệm cùng lúc: xử lý an toàn, không tạo trạng thái xung đột, luôn có đúng 1 OWNER', async () => {
      const testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Concurrency Chuyển Quyền & Kick',
          memberIds: [memberUser1.id, memberUser2.id, memberUser3.id],
        },
      );

      // Đồng thời chuyển quyền cho memberUser1 VÀ kick memberUser1
      const results = await Promise.allSettled([
        conversationsService.transferOwnership(ownerUser.id, testGroup.id, {
          newOwnerId: memberUser1.id,
        }),
        conversationsService.removeMember(
          ownerUser.id,
          testGroup.id,
          memberUser1.id,
        ),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Một thao tác thành công, thao tác còn lại bị từ chối an toàn với ForbiddenException (nếu transfer trước làm mất quyền owner) hoặc BadRequestException (nếu kick trước)
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      const rejectedResult = rejected[0];
      const rejectedReason: unknown = rejectedResult.reason;
      expect(
        rejectedReason instanceof BadRequestException ||
          rejectedReason instanceof ForbiddenException,
      ).toBe(true);

      // Database Invariant: Nhóm luôn có đúng 1 OWNER
      const activeOwners = await memberRepo.find({
        where: {
          conversationId: testGroup.id,
          role: ConversationMemberRole.OWNER,
          deletedAt: IsNull(),
        },
      });
      expect(activeOwners.length).toBe(1);
    });

    it('7.4 OWNER rời (kèm kế nhiệm) và một MEMBER rời cùng lúc: xử lý tuần tự an toàn, nhóm có đúng 1 OWNER mới', async () => {
      const testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Concurrency Rời Nhóm',
          memberIds: [memberUser1.id, memberUser2.id, memberUser3.id],
        },
      );

      // OWNER rời nhóm (kế nhiệm memberUser1) và memberUser2 rời nhóm cùng lúc
      const results = await Promise.allSettled([
        conversationsService.leaveGroup(ownerUser.id, testGroup.id, {
          newOwnerId: memberUser1.id,
        }),
        conversationsService.leaveGroup(memberUser2.id, testGroup.id, {}),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBe(2);

      const activeMembers = await memberRepo.find({
        where: { conversationId: testGroup.id, deletedAt: IsNull() },
      });
      // Còn lại memberUser1 (OWNER) và memberUser3 (MEMBER)
      expect(activeMembers.length).toBe(2);
      const activeOwner = activeMembers.find(
        (m) => m.role === ConversationMemberRole.OWNER,
      );
      expect(activeOwner?.userId).toBe(memberUser1.id);
    });

    it('7.5 Hai request thêm thành viên đồng thời có nguy cơ vượt quá 100: request thứ 2 bị từ chối 400 và tổng thành viên không vượt 100', async () => {
      // Tạo nhóm 98 thành viên ban đầu (ownerUser + 97 bạn bè)
      const initial97 = bulkFriends.slice(0, 97);
      const testLargeGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Sắp Đầy 98 Thành Viên',
          memberIds: initial97.map((u) => u.id),
        },
      );

      // Group hiện có 98 active members
      // Request A: thêm 2 bạn bè (bulkFriends[97], bulkFriends[98]) -> tổng 100
      // Request B: thêm 2 bạn bè (bulkFriends[99], bulkFriends[100]) -> tổng 102
      const results = await Promise.allSettled([
        conversationsService.addGroupMembers(ownerUser.id, testLargeGroup.id, {
          memberIds: [bulkFriends[97].id, bulkFriends[98].id],
        }),
        conversationsService.addGroupMembers(ownerUser.id, testLargeGroup.id, {
          memberIds: [bulkFriends[99].id, bulkFriends[100].id],
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason).toBeInstanceOf(BadRequestException);

      const finalMembers = await memberRepo.find({
        where: { conversationId: testLargeGroup.id, deletedAt: IsNull() },
      });
      expect(finalMembers.length).toBe(100); // Chính xác 100, không thể vượt quá!
    });

    it('7.6 Thêm lại thành viên đã rời trong lúc có thao tác kick thành viên khác: thực thi an toàn, thành viên được khôi phục với role MEMBER', async () => {
      const testGroup = await conversationsService.createGroupConversation(
        ownerUser.id,
        {
          title: 'Nhóm Kiểm Thử Concurrency Thêm Lại & Kick',
          memberIds: [memberUser1.id, memberUser2.id, memberUser3.id],
        },
      );

      // memberUser1 rời nhóm trước
      await conversationsService.leaveGroup(memberUser1.id, testGroup.id, {});

      // Đồng thời: OWNER thêm lại memberUser1 VÀ OWNER kick memberUser2
      const results = await Promise.allSettled([
        conversationsService.addGroupMembers(ownerUser.id, testGroup.id, {
          memberIds: [memberUser1.id],
        }),
        conversationsService.removeMember(
          ownerUser.id,
          testGroup.id,
          memberUser2.id,
        ),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBe(2);

      const restored1 = await memberRepo.findOne({
        where: {
          conversationId: testGroup.id,
          userId: memberUser1.id,
          deletedAt: IsNull(),
        },
      });
      expect(restored1).toBeDefined();
      expect(restored1?.role).toBe(ConversationMemberRole.MEMBER);

      const kicked2 = await memberRepo.findOne({
        where: { conversationId: testGroup.id, userId: memberUser2.id },
        withDeleted: true,
      });
      expect(kicked2?.deletedAt).not.toBeNull();
    });

    it('7.7 Database Invariant: Đảm bảo không bao giờ tồn tại nhóm active có 0 hoặc nhiều hơn 1 OWNER', async () => {
      const allActiveGroups = await conversationRepo.find({
        where: { type: ConversationType.GROUP, deletedAt: IsNull() },
      });

      for (const group of allActiveGroups) {
        const owners = await memberRepo.find({
          where: {
            conversationId: group.id,
            role: ConversationMemberRole.OWNER,
            deletedAt: IsNull(),
          },
        });
        expect(owners.length).toBe(1);
      }
    });
  });
});
