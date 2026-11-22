import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, In } from 'typeorm';
import { UserRole } from '../src/common/enums/role.enum';
import { DatabaseSafetyGuard } from '../src/database/database-safety.guard';
import { ConversationMember } from '../src/modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../src/modules/conversations/entities/idempotency-record.entity';
import { Friendship } from '../src/modules/friends/entities/friendship.entity';
import { FriendshipStatus } from '../src/modules/friends/enums/friendship-status.enum';
import { User } from '../src/modules/users/entities/user.entity';
import { assertSafeEnvironment, createSeedDataSource } from './seed.config';

export const DEFAULT_TARGET_EMAIL = 'gianght09112005@gmail.com';
export const DEMO_EMAIL_DOMAIN = '@lyora-demo.test';

export interface DemoFriendDefinition {
  email: string;
  fullName: string;
  phoneNumber: string;
  bio: string;
  location: string;
}

export const DEMO_FRIENDS_DATA: DemoFriendDefinition[] = [
  {
    email: 'minh-anh@lyora-demo.test',
    fullName: 'Nguyễn Minh Anh',
    phoneNumber: '0905001001',
    bio: 'Thành viên demo Lyora — Thích đọc sách và nghe nhạc.',
    location: 'TP. Hồ Chí Minh',
  },
  {
    email: 'hoang-nam@lyora-demo.test',
    fullName: 'Trần Hoàng Nam',
    phoneNumber: '0905001002',
    bio: 'Thành viên demo Lyora — Kỹ sư phần mềm.',
    location: 'Hà Nội',
  },
  {
    email: 'thao-vy@lyora-demo.test',
    fullName: 'Lê Thảo Vy',
    phoneNumber: '0905001003',
    bio: 'Thành viên demo Lyora — Đam mê nhiếp ảnh và nghệ thuật số.',
    location: 'Đà Nẵng',
  },
  {
    email: 'quoc-bao@lyora-demo.test',
    fullName: 'Phạm Quốc Bảo',
    phoneNumber: '0905001004',
    bio: 'Thành viên demo Lyora — Chuyên viên an toàn thông tin.',
    location: 'TP. Hồ Chí Minh',
  },
  {
    email: 'gia-han@lyora-demo.test',
    fullName: 'Võ Gia Hân',
    phoneNumber: '0905001005',
    bio: 'Thành viên demo Lyora — Thiết kế đồ họa và sáng tạo nội dung.',
    location: 'Cần Thơ',
  },
  {
    email: 'dang-khoa@lyora-demo.test',
    fullName: 'Nguyễn Đăng Khoa',
    phoneNumber: '0905001006',
    bio: 'Thành viên demo Lyora — Nghiên cứu trí tuệ nhân tạo.',
    location: 'Hà Nội',
  },
  {
    email: 'khanh-linh@lyora-demo.test',
    fullName: 'Trần Khánh Linh',
    phoneNumber: '0905001007',
    bio: 'Thành viên demo Lyora — Nhiệt huyết với các hoạt động cộng đồng.',
    location: 'Hải Phòng',
  },
  {
    email: 'minh-hoang@lyora-demo.test',
    fullName: 'Lê Minh Hoàng',
    phoneNumber: '0905001008',
    bio: 'Thành viên demo Lyora — Thích đi phượt và khám phá ẩm thực.',
    location: 'Đà Lạt',
  },
  {
    email: 'nhu-y@lyora-demo.test',
    fullName: 'Phạm Như Ý',
    phoneNumber: '0905001009',
    bio: 'Thành viên demo Lyora — Yêu thích kiến trúc và không gian tối giản.',
    location: 'Huế',
  },
  {
    email: 'thanh-dat@lyora-demo.test',
    fullName: 'Đỗ Thành Đạt',
    phoneNumber: '0905001010',
    bio: 'Thành viên demo Lyora — Chơi cờ vua và lập trình hệ thống.',
    location: 'Nha Trang',
  },
];

export interface DemoFriendManifestUser {
  id: string;
  email: string;
  fullName: string;
}

export type ManifestStatus =
  'APPLIED' | 'PARTIALLY_CLEANED' | 'BLOCKED' | 'CLEANED';

export interface DemoFriendsManifest {
  seedBatchId: string;
  createdAt: string;
  updatedAt: string;
  databaseIdentity: string;
  targetUserId: string;
  targetUserEmail: string;
  demoUsers: DemoFriendManifestUser[];
  friendshipIds: string[];
  status: ManifestStatus;
}

export type DemoFriendsMode =
  'preview-add' | 'add' | 'status' | 'preview-cleanup' | 'cleanup';

export interface DemoFriendsSeedOptions {
  mode: DemoFriendsMode;
  targetEmail?: string;
  manifestPath?: string;
  enforceTestDbGuard?: boolean;
  skipDbIdentityCheck?: boolean;
}

export interface DemoFriendsSeedResult {
  success: boolean;
  mode: DemoFriendsMode;
  targetUser?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  message?: string;
  createdUsersCount?: number;
  existingUsersCount?: number;
  createdFriendshipsCount?: number;
  existingFriendshipsCount?: number;
  deletedUsersCount?: number;
  deletedFriendshipsCount?: number;
  deletedConversationsCount?: number;
  skippedConversationsCount?: number;
  protectedDemoUsersCount?: number;
  conflicts?: string[];
  manifest?: DemoFriendsManifest | null;
  details?: Record<string, unknown>;
}

/**
 * Tạo mật khẩu ngẫu nhiên mật mã học riêng biệt cho mỗi tài khoản demo
 */
export function generateCryptographicPassword(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Chuẩn hóa và làm sạch chuỗi kết nối CSDL (loại bỏ credentials)
 */
export function sanitizeDbUrl(rawUrl?: string): string {
  if (!rawUrl) return 'unknown';
  try {
    const parsed = new URL(
      rawUrl
        .replace('postgresql://', 'http://')
        .replace('postgres://', 'http://'),
    );
    const dbName = parsed.pathname.replace(/^\//, '');
    return `postgresql://${parsed.hostname}:${parsed.port || '5432'}/${dbName}`;
  } catch {
    return 'postgresql-sanitized';
  }
}

/**
 * Trích xuất định danh CSDL hiện tại từ DataSource
 */
export function getDatabaseIdentity(dataSource: DataSource): string {
  const options = dataSource.options as unknown as Record<string, unknown>;
  const rawUrl = typeof options.url === 'string' ? options.url : undefined;
  if (rawUrl) {
    return sanitizeDbUrl(rawUrl);
  }
  const host = typeof options.host === 'string' ? options.host : 'localhost';
  const port = typeof options.port === 'number' ? options.port : 5432;
  const database =
    typeof options.database === 'string' ? options.database : 'unknown';
  return `postgresql://${host}:${port}/${database}`;
}

/**
 * Xác định đường dẫn file Manifest riêng biệt theo từng tài khoản mục tiêu
 */
export function getManifestPath(
  targetEmail: string,
  customPath?: string,
): string {
  if (customPath) {
    return path.resolve(customPath);
  }
  const sanitized = targetEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return path.resolve(
    __dirname,
    `.manifest/demo-friends-${sanitized}.manifest.json`,
  );
}

export function readManifest(manifestPath: string): DemoFriendsManifest | null {
  try {
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      return JSON.parse(content) as DemoFriendsManifest;
    }
  } catch {
    // Trả về null nếu không thể đọc hoặc parse JSON
  }
  return null;
}

/**
 * Ghi manifest nguyên tử (atomic write qua file tạm) để chống hỏng file
 */
export function writeManifestAtomic(
  manifestPath: string,
  manifest: DemoFriendsManifest,
): void {
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${manifestPath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), 'utf-8');
  fs.renameSync(tempPath, manifestPath);
}

/**
 * PREVIEW ADD: Kiểm tra trạng thái hiện tại và hiển thị bảng kế hoạch thêm bạn bè mẫu mà KHÔNG ghi CSDL hay Manifest.
 */
export async function previewAddDemoFriends(
  dataSource: DataSource,
  options: DemoFriendsSeedOptions,
): Promise<DemoFriendsSeedResult> {
  const targetEmail = options.targetEmail ?? DEFAULT_TARGET_EMAIL;
  const manifestPath = getManifestPath(targetEmail, options.manifestPath);
  const userRepo = dataSource.getRepository(User);
  const friendshipRepo = dataSource.getRepository(Friendship);

  const targetUser = await userRepo.findOne({ where: { email: targetEmail } });
  if (!targetUser) {
    return {
      success: false,
      mode: 'preview-add',
      targetUser: null,
      message: `Tài khoản mục tiêu '${targetEmail}' không tồn tại trong CSDL. Hủy thao tác xem trước (Preview Add).`,
    };
  }

  const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
  const existingDemoUsers = await userRepo.find({
    where: { email: In(demoEmails) },
  });
  const existingEmailSet = new Set(existingDemoUsers.map((u) => u.email));

  const plannedUsersToCreate = DEMO_FRIENDS_DATA.filter(
    (d) => !existingEmailSet.has(d.email),
  );
  const plannedExistingUsers = DEMO_FRIENDS_DATA.filter((d) =>
    existingEmailSet.has(d.email),
  );

  let existingFriendshipsCount = 0;
  let plannedFriendshipsToCreateCount = 0;

  for (const demoUser of existingDemoUsers) {
    const friendship = await friendshipRepo
      .createQueryBuilder('f')
      .where(
        '((f.userId = :u AND f.friendId = :demo) OR (f.userId = :demo AND f.friendId = :u))',
        { u: targetUser.id, demo: demoUser.id },
      )
      .getOne();

    if (friendship) {
      existingFriendshipsCount++;
    } else {
      plannedFriendshipsToCreateCount++;
    }
  }
  plannedFriendshipsToCreateCount += plannedUsersToCreate.length;

  const existingManifest = readManifest(manifestPath);

  return {
    success: true,
    mode: 'preview-add',
    targetUser: {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
    },
    message: `Kế hoạch nạp bạn bè mẫu cho '${targetEmail}': Cần tạo mới ${plannedUsersToCreate.length} người dùng, kết bạn mới ${plannedFriendshipsToCreateCount} quan hệ.`,
    createdUsersCount: plannedUsersToCreate.length,
    existingUsersCount: plannedExistingUsers.length,
    createdFriendshipsCount: plannedFriendshipsToCreateCount,
    existingFriendshipsCount,
    manifest: existingManifest,
    details: {
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetUserFullName: targetUser.fullName,
      targetUserRole: targetUser.role,
      targetUserIsActive: targetUser.isActive,
      plannedUsersToCreate: plannedUsersToCreate.map((u) => ({
        email: u.email,
        fullName: u.fullName,
        location: u.location,
      })),
      plannedExistingUsers: plannedExistingUsers.map((u) => ({
        email: u.email,
        fullName: u.fullName,
      })),
      manifestPath,
      manifestStatus: existingManifest
        ? existingManifest.status
        : 'CHƯA_TỒN_TẠI',
    },
  };
}

/**
 * ADD: Thực thi nạp 10 bạn bè mẫu trong TypeORM Transaction và cập nhật Manifest.
 */
export async function addDemoFriends(
  dataSource: DataSource,
  options: DemoFriendsSeedOptions,
): Promise<DemoFriendsSeedResult> {
  const targetEmail = options.targetEmail ?? DEFAULT_TARGET_EMAIL;
  const manifestPath = getManifestPath(targetEmail, options.manifestPath);

  assertSafeEnvironment();
  if (options.enforceTestDbGuard) {
    await DatabaseSafetyGuard.assertTestDatabase(dataSource);
  }

  const saltRounds = 10;
  const dbIdentity = getDatabaseIdentity(dataSource);

  return await dataSource.transaction(async (manager) => {
    const targetUser = await manager.findOne(User, {
      where: { email: targetEmail },
    });
    if (!targetUser) {
      throw new Error(
        `Tài khoản mục tiêu '${targetEmail}' không tồn tại trong CSDL. Demo friends seed bị hủy bỏ để ngăn chặn tạo dữ liệu mồ côi!`,
      );
    }

    const demoUsersResult: DemoFriendManifestUser[] = [];
    const friendshipIdsResult: string[] = [];
    let createdUsersCount = 0;
    let existingUsersCount = 0;
    let createdFriendshipsCount = 0;
    let existingFriendshipsCount = 0;

    for (const demoDef of DEMO_FRIENDS_DATA) {
      let demoUser = await manager.findOne(User, {
        where: { email: demoDef.email },
      });

      if (!demoUser) {
        // Sinh mật khẩu mật mã học ngẫu nhiên riêng biệt, hash Bcrypt 10 rounds
        const rawSecurePassword = generateCryptographicPassword();
        const passwordHash = await bcrypt.hash(rawSecurePassword, saltRounds);

        demoUser = manager.create(User, {
          email: demoDef.email,
          passwordHash,
          fullName: demoDef.fullName,
          phoneNumber: demoDef.phoneNumber,
          bio: demoDef.bio,
          location: demoDef.location,
          role: UserRole.CLIENT,
          isActive: true,
          avatarUrl: null,
        });
        demoUser = await manager.save(User, demoUser);
        createdUsersCount++;
      } else {
        existingUsersCount++;
      }

      demoUsersResult.push({
        id: demoUser.id,
        email: demoUser.email,
        fullName: demoUser.fullName,
      });

      let friendship = await manager
        .createQueryBuilder(Friendship, 'f')
        .where(
          '((f.userId = :u AND f.friendId = :demo) OR (f.userId = :demo AND f.friendId = :u))',
          { u: targetUser.id, demo: demoUser.id },
        )
        .getOne();

      if (!friendship) {
        friendship = manager.create(Friendship, {
          userId: targetUser.id,
          friendId: demoUser.id,
          status: FriendshipStatus.ACCEPTED,
        });
        friendship = await manager.save(Friendship, friendship);
        createdFriendshipsCount++;
      } else {
        if (friendship.status !== FriendshipStatus.ACCEPTED) {
          friendship.status = FriendshipStatus.ACCEPTED;
          friendship = await manager.save(Friendship, friendship);
        }
        existingFriendshipsCount++;
      }

      friendshipIdsResult.push(friendship.id);
    }

    const previousManifest = readManifest(manifestPath);
    const nowIso = new Date().toISOString();
    const sanitizedEmail = targetUser.email
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    const manifest: DemoFriendsManifest = {
      seedBatchId:
        previousManifest?.seedBatchId ??
        `demo-friends-${sanitizedEmail}-${Date.now()}`,
      createdAt: previousManifest?.createdAt ?? nowIso,
      updatedAt: nowIso,
      databaseIdentity: dbIdentity,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      demoUsers: demoUsersResult,
      friendshipIds: friendshipIdsResult,
      status: 'APPLIED',
    };

    writeManifestAtomic(manifestPath, manifest);

    return {
      success: true,
      mode: 'add',
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
      },
      message: `Đã nạp thành công bộ dữ liệu bạn bè mẫu cho '${targetEmail}'.`,
      createdUsersCount,
      existingUsersCount,
      createdFriendshipsCount,
      existingFriendshipsCount,
      manifest,
    };
  });
}

/**
 * STATUS: Kiểm tra trạng thái đồng bộ giữa CSDL, Manifest và các hội thoại liên quan.
 */
export async function getDemoFriendsStatus(
  dataSource: DataSource,
  options: DemoFriendsSeedOptions,
): Promise<DemoFriendsSeedResult> {
  const targetEmail = options.targetEmail ?? DEFAULT_TARGET_EMAIL;
  const manifestPath = getManifestPath(targetEmail, options.manifestPath);

  const userRepo = dataSource.getRepository(User);
  const friendshipRepo = dataSource.getRepository(Friendship);
  const memberRepo = dataSource.getRepository(ConversationMember);

  const manifest = readManifest(manifestPath);
  const targetUser = await userRepo.findOne({ where: { email: targetEmail } });

  const demoEmails = DEMO_FRIENDS_DATA.map((d) => d.email);
  const demoUsersInDb = await userRepo.find({
    where: { email: In(demoEmails) },
  });
  const demoUserIds = demoUsersInDb.map((u) => u.id);

  let friendshipsCount = 0;
  if (targetUser && demoUserIds.length > 0) {
    const friendships = await friendshipRepo
      .createQueryBuilder('f')
      .where(
        '((f.userId = :u AND f.friendId IN (:...demoIds)) OR (f.userId IN (:...demoIds) AND f.friendId = :u))',
        { u: targetUser.id, demoIds: demoUserIds },
      )
      .getMany();
    friendshipsCount = friendships.length;
  }

  let pureTestConversationsCount = 0;
  let mixedConversationsCount = 0;
  const protectedDemoUserIds = new Set<string>();
  const conflicts: string[] = [];

  if (demoUserIds.length > 0) {
    const demoMemberships = await memberRepo.find({
      where: { userId: In(demoUserIds) },
    });
    const uniqueConvIds = Array.from(
      new Set(demoMemberships.map((m) => m.conversationId)),
    );

    const allowedUserIds = new Set<string>([
      ...(targetUser ? [targetUser.id] : []),
      ...demoUserIds,
    ]);

    for (const convId of uniqueConvIds) {
      const allMembers = await memberRepo.find({
        where: { conversationId: convId },
      });
      const hasOutsideUser = allMembers.some(
        (m) => !allowedUserIds.has(m.userId),
      );

      if (hasOutsideUser) {
        mixedConversationsCount++;
        conflicts.push(
          `Hội thoại nhóm '${convId}' chứa thành viên người dùng thật ngoài phạm vi demo. Được phân loại [PROTECTED].`,
        );
        for (const m of allMembers) {
          if (demoUserIds.includes(m.userId)) {
            protectedDemoUserIds.add(m.userId);
          }
        }
      } else {
        pureTestConversationsCount++;
      }
    }
  }

  return {
    success: true,
    mode: 'status',
    targetUser: targetUser
      ? {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
        }
      : null,
    createdUsersCount: demoUsersInDb.length,
    createdFriendshipsCount: friendshipsCount,
    protectedDemoUsersCount: protectedDemoUserIds.size,
    conflicts,
    manifest,
    details: {
      targetUserExists: !!targetUser,
      demoUsersInDbCount: demoUsersInDb.length,
      demoUsersExpectedCount: DEMO_FRIENDS_DATA.length,
      friendshipsInDbCount: friendshipsCount,
      pureTestConversationsCount,
      mixedConversationsCount,
      protectedDemoUsersCount: protectedDemoUserIds.size,
      manifestStatus: manifest ? manifest.status : 'NOT_FOUND',
      manifestPath,
    },
  };
}

/**
 * PREVIEW CLEANUP: Kiểm tra dữ liệu sẽ được dọn dẹp, phát hiện xung đột và bảo vệ demo user khỏi cascade delete mà KHÔNG xóa CSDL.
 */
export async function previewCleanupDemoFriends(
  dataSource: DataSource,
  options: DemoFriendsSeedOptions,
): Promise<DemoFriendsSeedResult> {
  const targetEmail = options.targetEmail ?? DEFAULT_TARGET_EMAIL;
  const manifestPath = getManifestPath(targetEmail, options.manifestPath);

  const userRepo = dataSource.getRepository(User);
  const friendshipRepo = dataSource.getRepository(Friendship);
  const memberRepo = dataSource.getRepository(ConversationMember);

  const manifest = readManifest(manifestPath);
  const targetUser = await userRepo.findOne({ where: { email: targetEmail } });

  if (!manifest) {
    return {
      success: false,
      mode: 'preview-cleanup',
      targetUser: targetUser
        ? {
            id: targetUser.id,
            email: targetUser.email,
            fullName: targetUser.fullName,
          }
        : null,
      message: `Không tìm thấy file Manifest cho '${targetEmail}'. Không thể xác minh nguồn gốc bản ghi để dọn dẹp an toàn.`,
    };
  }

  const manifestDemoUserIds = manifest.demoUsers.map((u) => u.id);
  const demoUsersInDb = await userRepo.find({
    where: { id: In(manifestDemoUserIds) },
  });
  const demoUserIds = demoUsersInDb.map((u) => u.id);

  let removableFriendshipsCount = 0;
  if (manifest.friendshipIds && manifest.friendshipIds.length > 0) {
    const friendships = await friendshipRepo.find({
      where: { id: In(manifest.friendshipIds) },
    });
    removableFriendshipsCount = friendships.length;
  }

  const removableConversations: string[] = [];
  const protectedConversations: string[] = [];
  const protectedDemoUserIds = new Set<string>();
  const conflicts: string[] = [];

  if (demoUserIds.length > 0) {
    const demoMemberships = await memberRepo.find({
      where: { userId: In(demoUserIds) },
    });
    const uniqueConvIds = Array.from(
      new Set(demoMemberships.map((m) => m.conversationId)),
    );

    const allowedUserIds = new Set<string>([
      ...(targetUser ? [targetUser.id] : []),
      ...demoUserIds,
    ]);

    for (const convId of uniqueConvIds) {
      const allMembers = await memberRepo.find({
        where: { conversationId: convId },
      });
      const outsideMembers = allMembers.filter(
        (m) => !allowedUserIds.has(m.userId),
      );

      if (outsideMembers.length > 0) {
        protectedConversations.push(convId);
        // Bảo vệ demo users trong hội thoại này khỏi cascade delete
        for (const m of allMembers) {
          if (demoUserIds.includes(m.userId)) {
            protectedDemoUserIds.add(m.userId);
            const userObj = demoUsersInDb.find((u) => u.id === m.userId);
            conflicts.push(
              `Thành viên demo '${userObj?.fullName ?? m.userId}' (${userObj?.email ?? 'unknown'}) đang thuộc Hội thoại nhóm được bảo vệ '${convId}'. Demo user này ĐƯỢC GIỮ LẠI để không làm mất thành viên nhóm!`,
            );
          }
        }
      } else {
        removableConversations.push(convId);
      }
    }
  }

  const removableDemoUsers = demoUsersInDb.filter(
    (u) => !protectedDemoUserIds.has(u.id),
  );

  return {
    success: true,
    mode: 'preview-cleanup',
    targetUser: targetUser
      ? {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
        }
      : null,
    deletedUsersCount: removableDemoUsers.length,
    deletedFriendshipsCount: removableFriendshipsCount,
    deletedConversationsCount: removableConversations.length,
    skippedConversationsCount: protectedConversations.length,
    protectedDemoUsersCount: protectedDemoUserIds.size,
    conflicts,
    manifest,
    details: {
      removableDemoUsers: removableDemoUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
      })),
      protectedDemoUsers: Array.from(protectedDemoUserIds).map((id) => {
        const u = demoUsersInDb.find((x) => x.id === id);
        return { id, email: u?.email, fullName: u?.fullName };
      }),
      removableFriendshipsCount,
      removableConversations,
      protectedConversations,
      targetUserProtected: targetUser
        ? { id: targetUser.id, email: targetUser.email }
        : null,
    },
  };
}

/**
 * CLEANUP: Xóa an toàn các bản ghi có ID xác thực từ Manifest trong Transaction; KHÔNG cascade-delete thành viên hội thoại được bảo vệ.
 */
export async function cleanupDemoFriends(
  dataSource: DataSource,
  options: DemoFriendsSeedOptions,
): Promise<DemoFriendsSeedResult> {
  const targetEmail = options.targetEmail ?? DEFAULT_TARGET_EMAIL;
  const manifestPath = getManifestPath(targetEmail, options.manifestPath);

  assertSafeEnvironment();
  if (options.enforceTestDbGuard) {
    await DatabaseSafetyGuard.assertTestDatabase(dataSource);
  }

  const manifest = readManifest(manifestPath);
  if (!manifest) {
    return {
      success: false,
      mode: 'cleanup',
      targetUser: null,
      message: `Không tìm thấy file Manifest tại '${manifestPath}'. Thao tác Cleanup bị từ chối để ngăn chặn xóa nhầm dữ liệu không rõ nguồn gốc.`,
    };
  }

  // Xác minh tính toàn vẹn CSDL (Database Identity)
  const currentDbId = getDatabaseIdentity(dataSource);
  if (
    manifest.databaseIdentity &&
    manifest.databaseIdentity !== currentDbId &&
    !options.skipDbIdentityCheck
  ) {
    throw new Error(
      `[DATABASE IDENTITY MISMATCH] Manifest được tạo cho '${manifest.databaseIdentity}', nhưng kết nối hiện tại là '${currentDbId}'. Hủy cleanup để tránh xóa chéo CSDL!`,
    );
  }

  return await dataSource.transaction(async (manager) => {
    const targetUser = await manager.findOne(User, {
      where: { email: targetEmail },
    });

    const manifestDemoUserIds = manifest.demoUsers.map((u) => u.id);
    if (manifestDemoUserIds.length === 0) {
      if (manifest.status !== 'CLEANED') {
        manifest.status = 'CLEANED';
        manifest.updatedAt = new Date().toISOString();
        writeManifestAtomic(manifestPath, manifest);
      }
      return {
        success: true,
        mode: 'cleanup',
        targetUser: targetUser
          ? {
              id: targetUser.id,
              email: targetUser.email,
              fullName: targetUser.fullName,
            }
          : null,
        message: 'Không có bản ghi bạn bè mẫu nào trong Manifest cần dọn dẹp.',
        deletedUsersCount: 0,
        deletedFriendshipsCount: 0,
        deletedConversationsCount: 0,
        skippedConversationsCount: 0,
        protectedDemoUsersCount: 0,
        conflicts: [],
        manifest,
      };
    }

    const demoUsersInDb = await manager.find(User, {
      where: { id: In(manifestDemoUserIds) },
    });
    const demoUserIds = demoUsersInDb.map((u) => u.id);

    // 1. Phân loại hội thoại và xác định Demo Users được bảo vệ
    const demoMemberships = await manager.find(ConversationMember, {
      where: { userId: In(demoUserIds) },
    });
    const uniqueConvIds = Array.from(
      new Set(demoMemberships.map((m) => m.conversationId)),
    );

    const allowedUserIds = new Set<string>([
      ...(targetUser ? [targetUser.id] : []),
      ...demoUserIds,
    ]);

    const conversationsToDelete: string[] = [];
    const conversationsToKeep: string[] = [];
    const protectedDemoUserIds = new Set<string>();
    const conflicts: string[] = [];

    for (const convId of uniqueConvIds) {
      const allMembers = await manager.find(ConversationMember, {
        where: { conversationId: convId },
      });
      const hasOutsideUser = allMembers.some(
        (m) => !allowedUserIds.has(m.userId),
      );

      if (hasOutsideUser) {
        conversationsToKeep.push(convId);
        // QUY TẮC AN TOÀN TUYỆT ĐỐI: Demo user thuộc hội thoại được bảo vệ KHÔNG ĐƯỢC PHÉP BỊ XÓA!
        for (const m of allMembers) {
          if (demoUserIds.includes(m.userId)) {
            protectedDemoUserIds.add(m.userId);
            const userObj = demoUsersInDb.find((u) => u.id === m.userId);
            conflicts.push(
              `Thành viên demo '${userObj?.fullName ?? m.userId}' đang thuộc Hội thoại nhóm được bảo vệ '${convId}'. Demo user này ĐƯỢC GIỮ LẠI để bảo toàn toàn vẹn thành viên nhóm.`,
            );
          }
        }
      } else {
        conversationsToDelete.push(convId);
      }
    }

    // 2. Xóa các hội thoại thuần test (cascade: IdempotencyRecord, ConversationMember, Conversation)
    for (const convId of conversationsToDelete) {
      await manager.delete(IdempotencyRecord, { resourceId: convId });
      await manager.delete(ConversationMember, { conversationId: convId });
      await manager.delete(Conversation, { id: convId });
    }

    // 3. Xóa các quan hệ bạn bè từ Manifest
    let deletedFriendshipsCount = 0;
    if (manifest.friendshipIds && manifest.friendshipIds.length > 0) {
      const deleteFriendshipsResult = await manager
        .createQueryBuilder()
        .delete()
        .from(Friendship)
        .where('id IN (:...fIds)', { fIds: manifest.friendshipIds })
        .execute();
      deletedFriendshipsCount = deleteFriendshipsResult.affected ?? 0;
    }

    // 4. Xóa các Demo Users KHÔNG BỊ RÀNG BUỘC bởi Protected Conversations
    const deletableDemoUsers = demoUsersInDb.filter(
      (u) =>
        !protectedDemoUserIds.has(u.id) &&
        u.email.endsWith(DEMO_EMAIL_DOMAIN) &&
        u.email !== targetEmail,
    );
    const deletableDemoUserIds = deletableDemoUsers.map((u) => u.id);

    let deletedUsersCount = 0;
    if (deletableDemoUserIds.length > 0) {
      const deleteUsersResult = await manager.delete(User, {
        id: In(deletableDemoUserIds),
      });
      deletedUsersCount = deleteUsersResult.affected ?? 0;
    }

    // 5. Cập nhật Manifest: Hỗ trợ CLEANED, PARTIALLY_CLEANED, hoặc BLOCKED
    let newStatus: ManifestStatus = 'CLEANED';
    if (protectedDemoUserIds.size > 0) {
      if (deletableDemoUserIds.length > 0) {
        newStatus = 'PARTIALLY_CLEANED';
      } else {
        newStatus = 'BLOCKED';
      }
      // Cập nhật danh sách demoUsers còn tồn tại trong manifest để phục vụ lần cleanup kế tiếp
      manifest.demoUsers = manifest.demoUsers.filter((u) =>
        protectedDemoUserIds.has(u.id),
      );
    } else {
      manifest.demoUsers = [];
    }

    manifest.status = newStatus;
    manifest.updatedAt = new Date().toISOString();
    writeManifestAtomic(manifestPath, manifest);

    return {
      success: true,
      mode: 'cleanup',
      targetUser: targetUser
        ? {
            id: targetUser.id,
            email: targetUser.email,
            fullName: targetUser.fullName,
          }
        : null,
      message: `Đã dọn dẹp an toàn: Xóa ${deletedUsersCount} tài khoản demo, ${deletedFriendshipsCount} quan hệ bạn bè, ${conversationsToDelete.length} hội thoại thuần test. Giữ lại ${protectedDemoUserIds.size} demo users và ${conversationsToKeep.length} hội thoại được bảo vệ. Trạng thái Manifest: ${newStatus}.`,
      deletedUsersCount,
      deletedFriendshipsCount,
      deletedConversationsCount: conversationsToDelete.length,
      skippedConversationsCount: conversationsToKeep.length,
      protectedDemoUsersCount: protectedDemoUserIds.size,
      conflicts,
      manifest,
    };
  });
}

/**
 * Runner trung tâm điều phối theo Mode
 */
export async function runDemoFriendsSeed(
  dataSource: DataSource,
  options: DemoFriendsSeedOptions,
): Promise<DemoFriendsSeedResult> {
  switch (options.mode) {
    case 'preview-add':
      return await previewAddDemoFriends(dataSource, options);
    case 'add':
      return await addDemoFriends(dataSource, options);
    case 'status':
      return await getDemoFriendsStatus(dataSource, options);
    case 'preview-cleanup':
      return await previewCleanupDemoFriends(dataSource, options);
    case 'cleanup':
      return await cleanupDemoFriends(dataSource, options);
    default:
      throw new Error(
        `Chế độ không hợp lệ: ${(options as { mode: string }).mode}`,
      );
  }
}

/**
 * Helper định dạng xuất bảng ra CLI console
 */
function printCliResult(result: DemoFriendsSeedResult): void {
  console.log('\n============================================================');
  console.log(
    `[DEMO FRIENDS SEED] KẾT QUẢ THỰC THI (MODE: ${result.mode.toUpperCase()})`,
  );
  console.log('============================================================');
  console.log(
    `- Trạng thái thành công: ${result.success ? 'THÀNH CÔNG' : 'THẤT BẠI'}`,
  );
  if (result.targetUser) {
    console.log(
      `- Tài khoản mục tiêu: ${result.targetUser.fullName} (${result.targetUser.email}) [ID: ${result.targetUser.id}]`,
    );
  } else {
    console.log('- Tài khoản mục tiêu: KHÔNG TÌM THẤY TRONG CSDL');
  }
  if (result.message) {
    console.log(`- Thông báo: ${result.message}`);
  }

  if (result.createdUsersCount !== undefined) {
    console.log(
      `- Số tài khoản demo (Tạo mới/Hiện hữu): ${result.createdUsersCount} / ${result.existingUsersCount ?? 0}`,
    );
  }
  if (result.createdFriendshipsCount !== undefined) {
    console.log(
      `- Số quan hệ bạn bè (Tạo mới/Hiện hữu): ${result.createdFriendshipsCount} / ${result.existingFriendshipsCount ?? 0}`,
    );
  }
  if (result.deletedUsersCount !== undefined) {
    console.log(`- Số tài khoản demo đã xóa: ${result.deletedUsersCount}`);
  }
  if (
    result.protectedDemoUsersCount !== undefined &&
    result.protectedDemoUsersCount > 0
  ) {
    console.log(
      `- Số tài khoản demo ĐƯỢC BẢO VỆ (Không xóa vì liên kết nhóm thật): ${result.protectedDemoUsersCount}`,
    );
  }
  if (result.deletedFriendshipsCount !== undefined) {
    console.log(
      `- Số quan hệ bạn bè đã xóa: ${result.deletedFriendshipsCount}`,
    );
  }
  if (result.deletedConversationsCount !== undefined) {
    console.log(
      `- Số hội thoại thuần test đã xóa: ${result.deletedConversationsCount}`,
    );
  }
  if (
    result.skippedConversationsCount !== undefined &&
    result.skippedConversationsCount > 0
  ) {
    console.log(
      `- Số hội thoại được bảo vệ (Bỏ qua không xóa): ${result.skippedConversationsCount}`,
    );
  }

  if (result.conflicts && result.conflicts.length > 0) {
    console.log('\n[CẢNH BÁO BẢO VỆ DỮ LIỆU & XUNG ĐỘT]:');
    result.conflicts.forEach((c) => console.log(`  ! ${c}`));
  }

  if (result.manifest) {
    console.log('\n[MANIFEST TRACKING]:');
    console.log(`  Batch ID: ${result.manifest.seedBatchId}`);
    console.log(`  Trạng thái: ${result.manifest.status}`);
    console.log(`  CSDL: ${result.manifest.databaseIdentity}`);
    console.log(`  Cập nhật lần cuối: ${result.manifest.updatedAt}`);
  }
  console.log('============================================================\n');
}

/**
 * Entry point khi chạy trực tiếp qua CLI
 */
if (require.main === module) {
  void (async () => {
    try {
      const args = process.argv.slice(2);
      let mode: DemoFriendsMode = 'preview-add';
      let targetEmail = DEFAULT_TARGET_EMAIL;
      let manifestPath: string | undefined;
      let enforceTestDbGuard = false;

      for (const arg of args) {
        if (arg.startsWith('--mode=')) {
          mode = arg.replace('--mode=', '').toLowerCase() as DemoFriendsMode;
        } else if (arg.startsWith('--email=')) {
          targetEmail = arg.replace('--email=', '');
        } else if (arg.startsWith('--manifest=')) {
          manifestPath = arg.replace('--manifest=', '');
        } else if (arg === '--safe-guard-test-only') {
          enforceTestDbGuard = true;
        } else if (
          [
            'preview-add',
            'add',
            'status',
            'preview-cleanup',
            'cleanup',
          ].includes(arg.toLowerCase())
        ) {
          mode = arg.toLowerCase() as DemoFriendsMode;
        }
      }

      assertSafeEnvironment();
      const dataSource = createSeedDataSource({ synchronize: false });
      await dataSource.initialize();

      if (enforceTestDbGuard) {
        await DatabaseSafetyGuard.assertTestDatabase(dataSource);
      }

      const result = await runDemoFriendsSeed(dataSource, {
        mode,
        targetEmail,
        manifestPath,
        enforceTestDbGuard,
      });

      printCliResult(result);
      await dataSource.destroy();
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(
        '\n[LỖI THỰC THI DEMO FRIENDS SEED]:',
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  })();
}
