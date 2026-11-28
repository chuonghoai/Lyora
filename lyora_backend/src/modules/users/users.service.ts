import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { Brackets, In, Repository } from 'typeorm';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { UserRole } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RedisService } from '../../redis/redis.service';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendshipStatus } from '../friends/enums/friendship-status.enum';
import {
  AdminUserDetailResponseDto,
  AdminUsersSummaryCountsDto,
} from './dto/admin-user-detail-response.dto';
import { AdminOnlineStatusResponseDto } from './dto/admin-online-status-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LockUserDto } from './dto/lock-user.dto';
import {
  ProfileFriendPreviewDto,
  PublicProfileFriendshipStatus,
  PublicProfileResponseDto,
} from './dto/public-profile-response.dto';
import { UserStatisticsDto } from './dto/user-statistics.dto';
import { User } from './entities/user.entity';

const BCRYPT_SALT_ROUNDS = 10;
const FRIENDS_PREVIEW_LIMIT = 6;

export interface UpdateProfilePayload {
  fullName?: string;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  hometown?: string | null;
  workplace?: string | null;
  education?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Optional()
    @InjectRepository(Friendship)
    private readonly friendshipRepository?: Repository<Friendship>,
    @Optional()
    private readonly redisService?: RedisService,
  ) {}

  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.userRepository.update(userId, { isOnline });
  }

  async findByEmail(
    email: string,
    includePassword: boolean = false,
  ): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (includePassword) {
      return this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email: normalizedEmail })
        .getOne();
    }
    return this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email này đã được đăng ký trong hệ thống');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role ?? UserRole.CLIENT,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    return this.findById(saved.id);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.update(userId, { passwordHash });
  }

  async updateProfile(
    userId: string,
    payload: UpdateProfilePayload,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (payload.fullName !== undefined) {
      const trimmedName = payload.fullName.trim();
      if (trimmedName) {
        user.fullName = trimmedName;
      }
    }

    const optionalFields: Array<keyof Omit<UpdateProfilePayload, 'fullName'>> =
      [
        'phoneNumber',
        'bio',
        'location',
        'hometown',
        'workplace',
        'education',
        'website',
        'avatarUrl',
        'coverUrl',
      ];

    for (const field of optionalFields) {
      const value = payload[field];
      if (value !== undefined) {
        user[field] = value?.trim() || null;
      }
    }

    await this.userRepository.save(user);
    return this.findById(userId);
  }

  async getPublicProfile(
    currentUser: AuthenticatedUser,
    targetIdOrMe: string,
  ): Promise<PublicProfileResponseDto> {
    const resolvedId =
      targetIdOrMe === 'me' ? currentUser.id : targetIdOrMe.trim();

    if (!isUUID(resolvedId)) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: resolvedId },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const isSelf = targetUser.id === currentUser.id;
    if (
      !isSelf &&
      !targetUser.isActive &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const relationship = await this.buildProfileRelationshipSummary(
      currentUser.id,
      targetUser.id,
      isSelf,
    );

    return {
      id: targetUser.id,
      // Bảo mật: chỉ chủ tài khoản mới nhận email & số điện thoại cá nhân
      email: isSelf ? targetUser.email : null,
      fullName: targetUser.fullName,
      role: targetUser.role,
      phoneNumber: isSelf ? (targetUser.phoneNumber ?? null) : null,
      bio: targetUser.bio ?? null,
      location: targetUser.location ?? null,
      hometown: targetUser.hometown ?? null,
      workplace: targetUser.workplace ?? null,
      education: targetUser.education ?? null,
      website: targetUser.website ?? null,
      avatarUrl: targetUser.avatarUrl ?? null,
      coverUrl: targetUser.coverUrl ?? null,
      isActive: targetUser.isActive,
      isOnline: Boolean(targetUser.isOnline),
      createdAt: targetUser.createdAt,
      friendshipStatus: relationship.friendshipStatus,
      friendsCount: relationship.friendsCount,
      mutualFriendsCount: relationship.mutualFriendsCount,
      friendsPreview: relationship.friendsPreview,
    };
  }

  private async buildProfileRelationshipSummary(
    viewerId: string,
    targetUserId: string,
    isSelf: boolean,
  ): Promise<{
    friendshipStatus: PublicProfileFriendshipStatus;
    friendsCount: number;
    mutualFriendsCount: number;
    friendsPreview: ProfileFriendPreviewDto[];
  }> {
    if (!this.friendshipRepository) {
      return {
        friendshipStatus: isSelf ? 'SELF' : 'NONE',
        friendsCount: 0,
        mutualFriendsCount: 0,
        friendsPreview: [],
      };
    }

    let friendshipStatus: PublicProfileFriendshipStatus = isSelf
      ? 'SELF'
      : 'NONE';

    if (!isSelf) {
      const directRelation = await this.friendshipRepository
        .createQueryBuilder('f')
        .where(
          '((f.userId = :viewer AND f.friendId = :target) OR (f.userId = :target AND f.friendId = :viewer))',
          { viewer: viewerId, target: targetUserId },
        )
        .getOne();

      if (directRelation) {
        if (directRelation.status === FriendshipStatus.BLOCKED) {
          throw new NotFoundException('Không tìm thấy thông tin người dùng');
        }
        friendshipStatus = this.mapRelationToStatus(directRelation, viewerId);
      }
    }

    const userIdsToInspect = isSelf ? [targetUserId] : [targetUserId, viewerId];
    const acceptedRelations = await this.friendshipRepository
      .createQueryBuilder('f')
      .where('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .andWhere('(f.userId IN (:...ids) OR f.friendId IN (:...ids))', {
        ids: userIdsToInspect,
      })
      .getMany();

    const targetFriendIds = this.extractPartnerIds(
      acceptedRelations,
      targetUserId,
    );
    const viewerFriendSet = new Set(
      isSelf
        ? targetFriendIds
        : this.extractPartnerIds(acceptedRelations, viewerId),
    );

    if (targetFriendIds.length === 0) {
      return {
        friendshipStatus,
        friendsCount: 0,
        mutualFriendsCount: 0,
        friendsPreview: [],
      };
    }

    const activeFriends = await this.userRepository.find({
      where: { id: In(targetFriendIds), isActive: true },
      select: [
        'id',
        'fullName',
        'avatarUrl',
        'workplace',
        'bio',
        'location',
        'isOnline',
      ],
    });

    const activeFriendIdSet = new Set(activeFriends.map((u) => u.id));
    const mutualFriendsCount = isSelf
      ? 0
      : [...activeFriendIdSet].filter((id) => viewerFriendSet.has(id)).length;

    const previewUsers = activeFriends.slice(0, FRIENDS_PREVIEW_LIMIT);
    const previewIds = previewUsers.map((u) => u.id);

    const { statusByPartnerId, mutualCountByPartnerId } =
      await this.resolvePreviewFriendMetadata(
        viewerId,
        viewerFriendSet,
        previewIds,
      );

    const friendsPreview: ProfileFriendPreviewDto[] = previewUsers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl ?? null,
      headline: u.workplace || u.bio || null,
      location: u.location ?? null,
      mutualFriendsCount: mutualCountByPartnerId.get(u.id) ?? 0,
      friendshipStatus: statusByPartnerId.get(u.id) ?? 'NONE',
      isOnline: Boolean(u.isOnline),
    }));

    return {
      friendshipStatus,
      friendsCount: activeFriends.length,
      mutualFriendsCount,
      friendsPreview,
    };
  }

  private async resolvePreviewFriendMetadata(
    viewerId: string,
    viewerFriendSet: Set<string>,
    previewIds: string[],
  ): Promise<{
    statusByPartnerId: Map<
      string,
      Exclude<PublicProfileFriendshipStatus, 'SELF'>
    >;
    mutualCountByPartnerId: Map<string, number>;
  }> {
    const statusByPartnerId = new Map<
      string,
      Exclude<PublicProfileFriendshipStatus, 'SELF'>
    >();
    const mutualCountByPartnerId = new Map<string, number>();

    if (!this.friendshipRepository || previewIds.length === 0) {
      return { statusByPartnerId, mutualCountByPartnerId };
    }

    // 1 truy vấn cho trạng thái trực tiếp giữa viewer và từng người trong danh sách preview
    const viewerRelations = await this.friendshipRepository
      .createQueryBuilder('f')
      .where(
        '((f.userId = :viewer AND f.friendId IN (:...ids)) OR (f.friendId = :viewer AND f.userId IN (:...ids)))',
        { viewer: viewerId, ids: previewIds },
      )
      .getMany();

    for (const rel of viewerRelations) {
      const partnerId = rel.userId === viewerId ? rel.friendId : rel.userId;
      statusByPartnerId.set(partnerId, this.mapRelationToStatus(rel, viewerId));
    }

    // 1 truy vấn cho danh sách bạn chung của nhóm preview
    const previewFriendEdges = await this.friendshipRepository
      .createQueryBuilder('f')
      .where('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .andWhere('(f.userId IN (:...ids) OR f.friendId IN (:...ids))', {
        ids: previewIds,
      })
      .getMany();

    const previewSet = new Set(previewIds);
    const friendSetsByPreview = new Map<string, Set<string>>();
    for (const id of previewIds) {
      friendSetsByPreview.set(id, new Set<string>());
    }

    for (const edge of previewFriendEdges) {
      if (previewSet.has(edge.userId)) {
        friendSetsByPreview.get(edge.userId)?.add(edge.friendId);
      }
      if (previewSet.has(edge.friendId)) {
        friendSetsByPreview.get(edge.friendId)?.add(edge.userId);
      }
    }

    for (const previewId of previewIds) {
      const partners = friendSetsByPreview.get(previewId) ?? new Set<string>();
      let mutual = 0;
      for (const candidateId of partners) {
        if (candidateId !== viewerId && viewerFriendSet.has(candidateId)) {
          mutual++;
        }
      }
      mutualCountByPartnerId.set(previewId, mutual);
    }

    return { statusByPartnerId, mutualCountByPartnerId };
  }

  private extractPartnerIds(
    friendships: Friendship[],
    ownerId: string,
  ): string[] {
    const partnerIds = new Set<string>();
    for (const f of friendships) {
      if (f.userId === ownerId) {
        partnerIds.add(f.friendId);
      } else if (f.friendId === ownerId) {
        partnerIds.add(f.userId);
      }
    }
    return [...partnerIds];
  }

  private mapRelationToStatus(
    friendship: Friendship,
    viewerId: string,
  ): Exclude<PublicProfileFriendshipStatus, 'SELF'> {
    if (friendship.status === FriendshipStatus.ACCEPTED) {
      return 'FRIEND';
    }
    if (friendship.status === FriendshipStatus.PENDING) {
      return friendship.userId === viewerId
        ? 'REQUEST_SENT'
        : 'REQUEST_RECEIVED';
    }
    return 'NONE';
  }

  async getAdminUserProfile(
    currentUser: AuthenticatedUser,
    targetId: string,
  ): Promise<AdminUserDetailResponseDto> {
    const resolvedId = targetId.trim();
    if (!isUUID(resolvedId)) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: resolvedId },
    });
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const relationship = await this.buildProfileRelationshipSummary(
      currentUser.id,
      targetUser.id,
      true,
    );

    return {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: targetUser.role,
      phoneNumber: targetUser.phoneNumber ?? null,
      bio: targetUser.bio ?? null,
      location: targetUser.location ?? null,
      hometown: targetUser.hometown ?? null,
      workplace: targetUser.workplace ?? null,
      education: targetUser.education ?? null,
      website: targetUser.website ?? null,
      avatarUrl: targetUser.avatarUrl ?? null,
      coverUrl: targetUser.coverUrl ?? null,
      isActive: targetUser.isActive,
      isOnline: Boolean(targetUser.isOnline),
      lockReason: targetUser.lockReason ?? null,
      lockedAt: targetUser.lockedAt ?? null,
      createdAt: targetUser.createdAt,
      friendsCount: relationship.friendsCount,
      friendsPreview: relationship.friendsPreview,
    };
  }

  async lockUser(
    adminUser: AuthenticatedUser,
    targetId: string,
    dto: LockUserDto,
  ): Promise<User> {
    if (targetId === adminUser.id) {
      throw new BadRequestException(
        'Bạn không thể tự khóa tài khoản của chính mình',
      );
    }

    const target = await this.findById(targetId);
    if (target.role === UserRole.ADMIN) {
      throw new BadRequestException('Không thể khóa tài khoản quản trị viên');
    }

    target.isActive = false;
    target.isOnline = false;
    target.lockReason = dto.reason.trim();
    target.lockedAt = new Date();

    const saved = await this.userRepository.save(target);
    await this.redisService?.revokeAllUserSessions(target.id);
    return saved;
  }

  async unlockUser(targetId: string): Promise<User> {
    const target = await this.findById(targetId);
    target.isActive = true;
    target.lockReason = null;
    target.lockedAt = null;
    return this.userRepository.save(target);
  }

  async findAllPaginated(query: AdminUsersQueryDto): Promise<{
    items: User[];
    meta: PaginationMetaDto;
    summary: AdminUsersSummaryCountsDto;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      role = 'ALL',
      status = 'ALL',
      online = 'ALL',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.userRepository.createQueryBuilder('user');

    if (role === UserRole.CLIENT || role === UserRole.ADMIN) {
      qb.andWhere('user.role = :roleFilter', { roleFilter: role });
    }

    if (status === 'ACTIVE') {
      qb.andWhere('user.isActive = true');
    } else if (status === 'LOCKED') {
      qb.andWhere('user.isActive = false');
    }

    if (online === 'ONLINE') {
      qb.andWhere('user.isOnline = true');
    } else if (online === 'OFFLINE') {
      qb.andWhere('user.isOnline = false');
    }

    const keyword = search?.trim();
    if (keyword) {
      qb.andWhere(
        new Brackets((searchQb) => {
          searchQb
            .where('user.fullName ILIKE :search', { search: `%${keyword}%` })
            .orWhere('user.email ILIKE :search', { search: `%${keyword}%` });
        }),
      );
    }

    // Luôn ưu tiên tài khoản đang hoạt động lên trước; tài khoản bị khóa xuống cuối
    qb.orderBy('user.isActive', 'DESC');

    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    if (sortBy === 'fullName') {
      qb.addOrderBy('user.fullName', safeOrder);
    } else if (sortBy === 'isOnline') {
      qb.addOrderBy('user.isOnline', safeOrder);
    } else {
      qb.addOrderBy('user.createdAt', safeOrder);
    }

    if (sortBy !== 'createdAt') {
      qb.addOrderBy('user.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const summaryQb = this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(*)', 'allCount')
      .addSelect(
        'COUNT(*) FILTER (WHERE user.role = :clientRole)',
        'clientCount',
      )
      .addSelect('COUNT(*) FILTER (WHERE user.role = :adminRole)', 'adminCount')
      .addSelect('COUNT(*) FILTER (WHERE user.isActive = true)', 'activeCount')
      .addSelect('COUNT(*) FILTER (WHERE user.isActive = false)', 'lockedCount')
      .addSelect('COUNT(*) FILTER (WHERE user.isOnline = true)', 'onlineCount')
      .setParameters({
        clientRole: UserRole.CLIENT,
        adminRole: UserRole.ADMIN,
      });

    const [[items, totalItems], rawSummary] = await Promise.all([
      qb.getManyAndCount(),
      summaryQb.getRawOne<Record<string, string | number | null>>(),
    ]);

    const meta = new PaginationMetaDto(page, limit, totalItems);
    const summary: AdminUsersSummaryCountsDto = {
      all: Number(rawSummary?.allCount ?? 0),
      client: Number(rawSummary?.clientCount ?? 0),
      admin: Number(rawSummary?.adminCount ?? 0),
      active: Number(rawSummary?.activeCount ?? 0),
      locked: Number(rawSummary?.lockedCount ?? 0),
      online: Number(rawSummary?.onlineCount ?? 0),
    };

    return { items, meta, summary };
  }

  async getStatistics(roleFilter?: UserRole): Promise<UserStatisticsDto> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Gộp toàn bộ số đếm vào 1 truy vấn SQL duy nhất để tránh tranh chấp pg-pool
    const rawCounts = await this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(*)', 'totalUsers')
      .addSelect(
        'COUNT(*) FILTER (WHERE user.role = :clientRole)',
        'clientCount',
      )
      .addSelect('COUNT(*) FILTER (WHERE user.role = :adminRole)', 'adminCount')
      .addSelect('COUNT(*) FILTER (WHERE user.isActive = true)', 'activeCount')
      .addSelect(
        'COUNT(*) FILTER (WHERE user.isActive = false)',
        'inactiveCount',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE user.createdAt >= :todayStart)',
        'newUsersToday',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE user.createdAt >= :monthStart)',
        'newUsersThisMonth',
      )
      .setParameters({
        clientRole: UserRole.CLIENT,
        adminRole: UserRole.ADMIN,
        todayStart,
        monthStart,
      })
      .getRawOne<Record<string, string | number | null>>();

    const recentUsers = await this.userRepository.find({
      where: roleFilter ? { role: roleFilter } : undefined,
      order: { createdAt: 'DESC' },
      take: 4,
    });

    return {
      totalUsers: Number(rawCounts?.totalUsers ?? 0),
      clientCount: Number(rawCounts?.clientCount ?? 0),
      adminCount: Number(rawCounts?.adminCount ?? 0),
      activeCount: Number(rawCounts?.activeCount ?? 0),
      inactiveCount: Number(rawCounts?.inactiveCount ?? 0),
      newUsersToday: Number(rawCounts?.newUsersToday ?? 0),
      newUsersThisMonth: Number(rawCounts?.newUsersThisMonth ?? 0),
      recentUsers,
    };
  }

  async getOnlineStatuses(
    rawIds?: string,
  ): Promise<AdminOnlineStatusResponseDto> {
    const validIds = [
      ...new Set(
        (rawIds ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter((item) => isUUID(item)),
      ),
    ].slice(0, 100);

    const [matchedUsers, onlineCount] = await Promise.all([
      validIds.length > 0
        ? this.userRepository.find({
            select: { id: true, isOnline: true, isActive: true },
            where: { id: In(validIds) },
          })
        : Promise.resolve([]),
      this.userRepository.count({ where: { isOnline: true, isActive: true } }),
    ]);

    const statuses: Record<string, boolean> = {};
    for (const user of matchedUsers) {
      statuses[user.id] = Boolean(user.isOnline && user.isActive);
    }

    return {
      statuses,
      onlineCount,
      checkedAt: new Date().toISOString(),
    };
  }
}
