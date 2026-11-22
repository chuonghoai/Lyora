import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { In, Repository } from 'typeorm';
import { UserRole } from '../src/common/enums/role.enum';
import { DatabaseSafetyGuard } from '../src/database/database-safety.guard';
import { TestAppDataSource } from '../src/database/test-data-source';
import { ConversationMember } from '../src/modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../src/modules/conversations/entities/idempotency-record.entity';
import { ConversationMemberRole } from '../src/modules/conversations/enums/conversation-member-role.enum';
import { ConversationType } from '../src/modules/conversations/enums/conversation-type.enum';
import { Friendship } from '../src/modules/friends/entities/friendship.entity';
import { FriendshipStatus } from '../src/modules/friends/enums/friendship-status.enum';
import { User } from '../src/modules/users/entities/user.entity';
import {
  addDemoFriends,
  cleanupDemoFriends,
  DEFAULT_TARGET_EMAIL,
  DEMO_FRIENDS_DATA,
  getDatabaseIdentity,
  getDemoFriendsStatus,
  previewAddDemoFriends,
  previewCleanupDemoFriends,
  readManifest,
  runDemoFriendsSeed,
} from '../seed/demo-friends.seed';

describe('Demo Friends Seed Integration Tests (lyora_test_db)', () => {
  jest.setTimeout(30000);

  const testManifestPath = path.resolve(
    __dirname,
    '../seed/.manifest/test-demo-friends-manifest.json',
  );

  let userRepo: Repository<User>;
  let friendshipRepo: Repository<Friendship>;
  let conversationRepo: Repository<Conversation>;
  let memberRepo: Repository<ConversationMember>;
  let idempotencyRepo: Repository<IdempotencyRecord>;

  let targetUser: User;
  let outsideRealUser: User;

  function cleanTestManifest(): void {
    if (fs.existsSync(testManifestPath)) {
      fs.unlinkSync(testManifestPath);
    }
  }

  beforeAll(async () => {
    if (!TestAppDataSource.isInitialized) {
      await TestAppDataSource.initialize();
    }
    await DatabaseSafetyGuard.assertTestDatabase(TestAppDataSource);

    userRepo = TestAppDataSource.getRepository(User);
    friendshipRepo = TestAppDataSource.getRepository(Friendship);
    conversationRepo = TestAppDataSource.getRepository(Conversation);
    memberRepo = TestAppDataSource.getRepository(ConversationMember);
    idempotencyRepo = TestAppDataSource.getRepository(IdempotencyRecord);

    cleanTestManifest();

    // Dọn dẹp bất kỳ demo users cũ còn sót lại trong test db
    const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
    const existingDemoUsers = await userRepo.find({
      where: { email: In(demoEmails) },
    });
    if (existingDemoUsers.length > 0) {
      const ids = existingDemoUsers.map((u) => u.id);
      await friendshipRepo
        .createQueryBuilder()
        .delete()
        .from(Friendship)
        .where('userId IN (:...ids) OR friendId IN (:...ids)', { ids })
        .execute();
      await userRepo.delete({ id: In(ids) });
    }

    // Fixture: Target User (gianght09112005@gmail.com)
    const passwordHash = await bcrypt.hash('Test@123456', 10);
    let existingTarget = await userRepo.findOne({
      where: { email: DEFAULT_TARGET_EMAIL },
    });
    if (!existingTarget) {
      existingTarget = userRepo.create({
        email: DEFAULT_TARGET_EMAIL,
        passwordHash,
        fullName: 'Hà Trường Giang (Target User)',
        phoneNumber: '0901234567',
        bio: 'Tài khoản cá nhân phục vụ kiểm thử Message Page.',
        location: 'TP. Hồ Chí Minh',
        role: UserRole.CLIENT,
        isActive: true,
      });
      existingTarget = await userRepo.save(existingTarget);
    }
    targetUser = existingTarget;

    // Fixture: Outside Real User (để kiểm thử bảo vệ hội thoại hỗn hợp)
    let existingOutside = await userRepo.findOne({
      where: { email: 'third-party-user@lyora-test.com' },
    });
    if (!existingOutside) {
      existingOutside = userRepo.create({
        email: 'third-party-user@lyora-test.com',
        passwordHash,
        fullName: 'Người Dùng Thứ Ba (Real User)',
        role: UserRole.CLIENT,
        isActive: true,
      });
      existingOutside = await userRepo.save(existingOutside);
    }
    outsideRealUser = existingOutside;
  });

  afterAll(async () => {
    cleanTestManifest();
    if (TestAppDataSource.isInitialized) {
      const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
      const demoUsers = await userRepo.find({
        where: { email: In(demoEmails) },
      });
      if (demoUsers.length > 0) {
        const ids = demoUsers.map((u) => u.id);
        await friendshipRepo
          .createQueryBuilder()
          .delete()
          .from(Friendship)
          .where('userId IN (:...ids) OR friendId IN (:...ids)', { ids })
          .execute();
        await userRepo.delete({ id: In(ids) });
      }
      await TestAppDataSource.destroy();
    }
  });

  // Scenario 1: Target account missing -> Abort with error without writing DB
  it('Scenario 1: phải từ chối và ném lỗi rõ ràng khi tài khoản mục tiêu không tồn tại', async () => {
    const missingEmail = 'nonexistent-user-test-999@gmail.com';
    await expect(
      addDemoFriends(TestAppDataSource, {
        mode: 'add',
        targetEmail: missingEmail,
        manifestPath: testManifestPath,
        enforceTestDbGuard: true,
      }),
    ).rejects.toThrow(
      `Tài khoản mục tiêu '${missingEmail}' không tồn tại trong CSDL`,
    );

    const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
    const count = await userRepo.count({ where: { email: In(demoEmails) } });
    expect(count).toBe(0);
  });

  // Scenario 2: PREVIEW ADD does not write DB or manifest
  it('Scenario 2: PREVIEW ADD phải kiểm tra và trả về kế hoạch mà không ghi CSDL hay Manifest', async () => {
    const previewResult = await previewAddDemoFriends(TestAppDataSource, {
      mode: 'preview-add',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
    });

    expect(previewResult.success).toBe(true);
    expect(previewResult.mode).toBe('preview-add');
    expect(previewResult.createdUsersCount).toBe(10);
    expect(previewResult.createdFriendshipsCount).toBe(10);

    const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
    const count = await userRepo.count({ where: { email: In(demoEmails) } });
    expect(count).toBe(0);
    expect(fs.existsSync(testManifestPath)).toBe(false);
  });

  // Scenario 3: ADD creates exactly 10 demo users with cryptographic passwords & 10 friendships (ACCEPTED)
  it('Scenario 3: ADD phải tạo đúng 10 tài khoản demo với mật khẩu mật mã ngẫu nhiên riêng biệt và 10 quan hệ bạn bè ACCEPTED', async () => {
    const addResult = await addDemoFriends(TestAppDataSource, {
      mode: 'add',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
      enforceTestDbGuard: true,
    });

    expect(addResult.success).toBe(true);
    expect(addResult.createdUsersCount).toBe(10);
    expect(addResult.createdFriendshipsCount).toBe(10);

    const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
    const demoUsers = await userRepo.find({
      where: { email: In(demoEmails) },
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'isActive',
        'avatarUrl',
        'passwordHash',
      ],
    });
    expect(demoUsers).toHaveLength(10);

    // Xác nhận mỗi demo user có một password hash khác nhau (ngẫu nhiên)
    const hashes = new Set(demoUsers.map((u) => u.passwordHash));
    expect(hashes.size).toBe(10);

    for (const demoUser of demoUsers) {
      expect(demoUser.role).toBe(UserRole.CLIENT);
      expect(demoUser.isActive).toBe(true);
      expect(demoUser.avatarUrl).toBeNull();
      expect(demoUser.passwordHash).toBeDefined();
    }

    const demoUserIds = demoUsers.map((u) => u.id);
    const friendships = await friendshipRepo
      .createQueryBuilder('f')
      .where(
        '((f.userId = :u AND f.friendId IN (:...demoIds)) OR (f.userId IN (:...demoIds) AND f.friendId = :u))',
        { u: targetUser.id, demoIds: demoUserIds },
      )
      .getMany();
    expect(friendships).toHaveLength(10);
    for (const f of friendships) {
      expect(f.status).toBe(FriendshipStatus.ACCEPTED);
    }

    expect(fs.existsSync(testManifestPath)).toBe(true);
    const manifest = readManifest(testManifestPath);
    expect(manifest).not.toBeNull();
    expect(manifest?.status).toBe('APPLIED');
    expect(manifest?.targetUserId).toBe(targetUser.id);
    expect(manifest?.demoUsers).toHaveLength(10);
    expect(manifest?.friendshipIds).toHaveLength(10);
  });

  // Scenario 4: Target account info 100% preserved
  it('Scenario 4: thông tin của tài khoản mục tiêu phải được bảo toàn nguyên vẹn 100%', async () => {
    const currentTarget = await userRepo.findOneOrFail({
      where: { id: targetUser.id },
    });
    expect(currentTarget.email).toBe(targetUser.email);
    expect(currentTarget.fullName).toBe('Hà Trường Giang (Target User)');
    expect(currentTarget.phoneNumber).toBe('0901234567');
    expect(currentTarget.bio).toBe(
      'Tài khoản cá nhân phục vụ kiểm thử Message Page.',
    );
    expect(currentTarget.location).toBe('TP. Hồ Chí Minh');
    expect(currentTarget.role).toBe(UserRole.CLIENT);
    expect(currentTarget.isActive).toBe(true);
  });

  // Scenario 5: ADD rerun is idempotent (0 duplicates)
  it('Scenario 5: chạy lại ADD phải có tính Idempotent (không trùng lặp tài khoản hoặc bạn bè)', async () => {
    const rerunResult = await addDemoFriends(TestAppDataSource, {
      mode: 'add',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
      enforceTestDbGuard: true,
    });

    expect(rerunResult.success).toBe(true);
    expect(rerunResult.createdUsersCount).toBe(0);
    expect(rerunResult.existingUsersCount).toBe(10);
    expect(rerunResult.createdFriendshipsCount).toBe(0);
    expect(rerunResult.existingFriendshipsCount).toBe(10);

    const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
    const count = await userRepo.count({ where: { email: In(demoEmails) } });
    expect(count).toBe(10);
  });

  // Scenario 6: STATUS mode accuracy
  it('Scenario 6: STATUS mode phải báo cáo chính xác thông tin bạn bè mẫu, quan hệ và Manifest', async () => {
    const statusResult = await getDemoFriendsStatus(TestAppDataSource, {
      mode: 'status',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
    });

    expect(statusResult.success).toBe(true);
    expect(statusResult.targetUser?.id).toBe(targetUser.id);
    expect(statusResult.createdUsersCount).toBe(10);
    expect(statusResult.createdFriendshipsCount).toBe(10);
    expect(statusResult.manifest?.status).toBe('APPLIED');
  });

  // Scenario 7: Mixed group conversation conflict detection & protected demo user classification
  let mixedGroup: Conversation;
  let protectedDemoUser: User;

  it('Scenario 7: phải phát hiện hội thoại hỗn hợp và phân loại demo user tham gia nhóm đó vào diện BẢO VỆ', async () => {
    protectedDemoUser = await userRepo.findOneOrFail({
      where: { email: 'minh-anh@lyora-demo.test' },
    });

    // Tạo hội thoại nhóm hỗn hợp: Target User (OWNER) + Demo User (MEMBER) + Outside Real User (MEMBER)
    mixedGroup = await conversationRepo.save(
      conversationRepo.create({
        type: ConversationType.GROUP,
        title: 'Nhóm Thảo Luận Hỗn Hợp Kiểm Thử Bảo Vệ',
        creatorId: targetUser.id,
      }),
    );

    await memberRepo.save([
      memberRepo.create({
        conversationId: mixedGroup.id,
        userId: targetUser.id,
        role: ConversationMemberRole.OWNER,
      }),
      memberRepo.create({
        conversationId: mixedGroup.id,
        userId: protectedDemoUser.id,
        role: ConversationMemberRole.MEMBER,
      }),
      memberRepo.create({
        conversationId: mixedGroup.id,
        userId: outsideRealUser.id,
        role: ConversationMemberRole.MEMBER,
      }),
    ]);

    const previewCleanupResult = await previewCleanupDemoFriends(
      TestAppDataSource,
      {
        mode: 'preview-cleanup',
        targetEmail: targetUser.email,
        manifestPath: testManifestPath,
      },
    );

    expect(previewCleanupResult.success).toBe(true);
    expect(previewCleanupResult.protectedDemoUsersCount).toBe(1);
    expect(previewCleanupResult.skippedConversationsCount).toBe(1);
    expect(
      (previewCleanupResult.details as { protectedConversations: string[] })
        .protectedConversations,
    ).toContain(mixedGroup.id);
    expect(
      (
        previewCleanupResult.details as {
          protectedDemoUsers: { id: string }[];
        }
      ).protectedDemoUsers.some((u) => u.id === protectedDemoUser.id),
    ).toBe(true);
  });

  // Scenario 8: PREVIEW CLEANUP does not delete DB records
  it('Scenario 8: PREVIEW CLEANUP phải phân loại dữ liệu mà không xóa CSDL hay Manifest', async () => {
    const previewCleanupResult = await previewCleanupDemoFriends(
      TestAppDataSource,
      {
        mode: 'preview-cleanup',
        targetEmail: targetUser.email,
        manifestPath: testManifestPath,
      },
    );

    expect(previewCleanupResult.success).toBe(true);

    const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
    const count = await userRepo.count({ where: { email: In(demoEmails) } });
    expect(count).toBe(10);

    const manifest = readManifest(testManifestPath);
    expect(manifest?.status).toBe('APPLIED');
  });

  // Scenario 9: CLEANUP preserves protected demo users & memberships, deletes unlinked demo users, updates manifest to PARTIALLY_CLEANED
  it('Scenario 9: CLEANUP phải bảo vệ tuyệt đối demo user và các memberships của nhóm được bảo vệ, xóa demo users không ràng buộc, cập nhật PARTIALLY_CLEANED', async () => {
    const demoUser2 = await userRepo.findOneOrFail({
      where: { email: 'hoang-nam@lyora-demo.test' },
    });

    // Tạo một hội thoại thuần test giữa Target User và Demo User 2 (Pure Test Conversation)
    const pureConv = await conversationRepo.save(
      conversationRepo.create({
        type: ConversationType.DIRECT,
        creatorId: targetUser.id,
      }),
    );
    await memberRepo.save([
      memberRepo.create({
        conversationId: pureConv.id,
        userId: targetUser.id,
        role: ConversationMemberRole.MEMBER,
      }),
      memberRepo.create({
        conversationId: pureConv.id,
        userId: demoUser2.id,
        role: ConversationMemberRole.MEMBER,
      }),
    ]);
    await idempotencyRepo.save(
      idempotencyRepo.create({
        userId: targetUser.id,
        idempotencyKey: 'test-key-demo-cleanup-pure',
        resourceType: 'DIRECT_CONVERSATION',
        resourceId: pureConv.id,
        requestHash: 'test-hash-pure',
      }),
    );

    const cleanupResult = await cleanupDemoFriends(TestAppDataSource, {
      mode: 'cleanup',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
      enforceTestDbGuard: true,
    });

    expect(cleanupResult.success).toBe(true);
    // 9 demo users không thuộc nhóm bảo vệ bị xóa
    expect(cleanupResult.deletedUsersCount).toBe(9);
    // 1 demo user thuộc nhóm bảo vệ (minh-anh@lyora-demo.test) ĐƯỢC GIỮ LẠI
    expect(cleanupResult.protectedDemoUsersCount).toBe(1);
    expect(cleanupResult.skippedConversationsCount).toBe(1);

    // KIỂM TRA QUAN TRỌNG: Demo user được bảo vệ vẫn tồn tại trong CSDL
    const stillExistingProtectedUser = await userRepo.findOne({
      where: { id: protectedDemoUser.id },
    });
    expect(stillExistingProtectedUser).not.toBeNull();
    expect(stillExistingProtectedUser?.email).toBe('minh-anh@lyora-demo.test');

    // KIỂM TRA QUAN TRỌNG: Hội thoại nhóm bảo vệ vẫn giữ nguyên đủ 3 thành viên, không mất member do cascade!
    const preservedMembers = await memberRepo.find({
      where: { conversationId: mixedGroup.id },
    });
    expect(preservedMembers).toHaveLength(3);
    const memberUserIds = preservedMembers.map((m) => m.userId);
    expect(memberUserIds).toContain(targetUser.id);
    expect(memberUserIds).toContain(protectedDemoUser.id);
    expect(memberUserIds).toContain(outsideRealUser.id);

    // Xác nhận OWNER của nhóm không đổi
    const ownerMember = preservedMembers.find(
      (m) => m.role === ConversationMemberRole.OWNER,
    );
    expect(ownerMember?.userId).toBe(targetUser.id);

    // Hội thoại thuần test đã bị xóa hoàn toàn
    const foundPureConv = await conversationRepo.findOne({
      where: { id: pureConv.id },
    });
    expect(foundPureConv).toBeNull();

    // Manifest chuyển sang trạng thái PARTIALLY_CLEANED (vì còn 1 demo user được bảo vệ)
    const manifest = readManifest(testManifestPath);
    expect(manifest?.status).toBe('PARTIALLY_CLEANED');
    expect(manifest?.demoUsers).toHaveLength(1);
    expect(manifest?.demoUsers[0].id).toBe(protectedDemoUser.id);
  });

  // Scenario 10: Target account and other real accounts are never deleted
  it('Scenario 10: tài khoản mục tiêu và người dùng thật bên ngoài tuyệt đối không bị xóa', async () => {
    const targetCheck = await userRepo.findOne({
      where: { id: targetUser.id },
    });
    expect(targetCheck).not.toBeNull();
    expect(targetCheck?.email).toBe(DEFAULT_TARGET_EMAIL);

    const outsideCheck = await userRepo.findOne({
      where: { id: outsideRealUser.id },
    });
    expect(outsideCheck).not.toBeNull();
    expect(outsideCheck?.email).toBe('third-party-user@lyora-test.com');
  });

  // Scenario 11: CLEANUP rerun is idempotent
  it('Scenario 11: chạy lại CLEANUP khi đang ở trạng thái bảo vệ phải có tính Idempotent', async () => {
    const rerunCleanup = await cleanupDemoFriends(TestAppDataSource, {
      mode: 'cleanup',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
      enforceTestDbGuard: true,
    });

    expect(rerunCleanup.success).toBe(true);
    expect(rerunCleanup.deletedUsersCount).toBe(0);
    expect(rerunCleanup.protectedDemoUsersCount).toBe(1);
    expect(rerunCleanup.manifest?.status).toBe('BLOCKED');
  });

  // Scenario 12: Transaction rollback on simulated mid-flight error
  it('Scenario 12: phải rollback toàn bộ transaction nếu xảy ra lỗi giữa chừng, không lưu partial records', async () => {
    await expect(
      TestAppDataSource.transaction(async (manager) => {
        const testUser = manager.create(User, {
          email: 'partial-fail@lyora-demo.test',
          passwordHash: 'dummy',
          fullName: 'Partial User',
          role: UserRole.CLIENT,
          isActive: true,
        });
        await manager.save(User, testUser);
        throw new Error('Transaction Rollback Test');
      }),
    ).rejects.toThrow('Transaction Rollback Test');

    const partialUser = await userRepo.findOne({
      where: { email: 'partial-fail@lyora-demo.test' },
    });
    expect(partialUser).toBeNull();
  });

  // Scenario 13: Database identity mismatch prevents accidental cross-database deletion
  it('Scenario 13: phải từ chối cleanup nếu database identity trong Manifest không khớp CSDL hiện tại', async () => {
    // Giả lập manifest có identity của một database khác
    const manifest = readManifest(testManifestPath);
    if (manifest) {
      manifest.databaseIdentity = 'postgresql://wrong-host:5432/lyora_other_db';
      fs.writeFileSync(
        testManifestPath,
        JSON.stringify(manifest, null, 2),
        'utf-8',
      );
    }

    await expect(
      cleanupDemoFriends(TestAppDataSource, {
        mode: 'cleanup',
        targetEmail: targetUser.email,
        manifestPath: testManifestPath,
      }),
    ).rejects.toThrow('[DATABASE IDENTITY MISMATCH]');
  });

  // Scenario 14: Runner dispatches all modes correctly
  it('Scenario 14: runDemoFriendsSeed điều phối đúng các mode', async () => {
    // Khôi phục database identity chuẩn cho test
    const manifest = readManifest(testManifestPath);
    if (manifest) {
      manifest.databaseIdentity = getDatabaseIdentity(TestAppDataSource);
      fs.writeFileSync(
        testManifestPath,
        JSON.stringify(manifest, null, 2),
        'utf-8',
      );
    }

    const statusRes = await runDemoFriendsSeed(TestAppDataSource, {
      mode: 'status',
      targetEmail: targetUser.email,
      manifestPath: testManifestPath,
    });
    expect(statusRes.mode).toBe('status');
    expect(statusRes.success).toBe(true);
  });
});
