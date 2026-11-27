import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { FriendResponseDto } from './dto/friend-response.dto';
import {
  FriendDiscoveryResponseDto,
  FriendRelationshipStatus,
} from './dto/friend-discovery-response.dto';
import { FriendSearchQueryDto } from './dto/friend-search-query.dto';
import { Friendship } from './entities/friendship.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Lấy danh sách bạn bè đã chấp thuận của người dùng hiện tại (Bảo mật: Không trả email)
   */
  async getAcceptedFriends(
    currentUserId: string,
  ): Promise<FriendResponseDto[]> {
    const friendships = await this.friendshipRepository
      .createQueryBuilder('f')
      .where('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .andWhere('(f.userId = :uid OR f.friendId = :uid)', {
        uid: currentUserId,
      })
      .getMany();

    if (friendships.length === 0) {
      return [];
    }

    const friendIds = friendships.map((f) =>
      f.userId === currentUserId ? f.friendId : f.userId,
    );

    const users = await this.userRepository.find({
      where: {
        id: In(friendIds),
        isActive: true,
      },
      select: [
        'id',
        'fullName',
        'avatarUrl',
        'workplace',
        'location',
        'isActive',
      ],
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl ?? null,
      workplace: u.workplace ?? null,
      location: u.location ?? null,
      friendshipStatus: 'FRIEND',
      isOnline: false, // Chuẩn hóa bảo mật: Không giả định isActive là online; Phase 3 sẽ tích hợp WebSocket Presence
    }));
  }

  async searchMembers(
    currentUserId: string,
    query: FriendSearchQueryDto,
  ): Promise<{ items: FriendDiscoveryResponseDto[]; totalItems: number }> {
    const keyword = query.q.trim();
    const usersQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('user.isActive = true')
      .andWhere('user.fullName ILIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM friendships blocked
          WHERE blocked.status = :blockedStatus
            AND ((blocked.user_id = :currentUserId AND blocked.friend_id = user.id)
              OR (blocked.friend_id = :currentUserId AND blocked.user_id = user.id))
        )`,
        { blockedStatus: FriendshipStatus.BLOCKED },
      )
      .orderBy('user.fullName', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [users, totalItems] = await usersQuery.getManyAndCount();
    if (users.length === 0) return { items: [], totalItems };

    const candidateIds = users.map((user) => user.id);
    const relationships = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .where(
        '((friendship.userId = :currentUserId AND friendship.friendId IN (:...candidateIds)) OR (friendship.friendId = :currentUserId AND friendship.userId IN (:...candidateIds)))',
        { currentUserId, candidateIds },
      )
      .getMany();
    const relationByUserId = new Map(
      relationships.map((relationship) => [
        relationship.userId === currentUserId
          ? relationship.friendId
          : relationship.userId,
        relationship,
      ]),
    );

    return {
      totalItems,
      items: users.map((user) =>
        this.toDiscoveryResponse(
          user,
          this.resolveRelationshipStatus(
            relationByUserId.get(user.id),
            currentUserId,
          ),
        ),
      ),
    };
  }

  async getReceivedRequests(
    currentUserId: string,
  ): Promise<FriendDiscoveryResponseDto[]> {
    const requests = await this.friendshipRepository.find({
      where: { friendId: currentUserId, status: FriendshipStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
    if (requests.length === 0) return [];

    const requesters = await this.userRepository.find({
      where: {
        id: In(requests.map((request) => request.userId)),
        isActive: true,
      },
    });
    const requesterById = new Map(requesters.map((user) => [user.id, user]));
    return requests.flatMap((request) => {
      const requester = requesterById.get(request.userId);
      return requester
        ? [this.toDiscoveryResponse(requester, 'REQUEST_RECEIVED')]
        : [];
    });
  }

  async sendRequest(
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.assertEligibleTarget(currentUserId, targetUserId);
    const existing = await this.findRelationship(currentUserId, targetUserId);
    if (existing) {
      if (existing.status === FriendshipStatus.PENDING) {
        throw new ConflictException(
          existing.userId === currentUserId
            ? 'Bạn đã gửi lời mời kết bạn cho người này'
            : 'Người này đã gửi lời mời kết bạn cho bạn',
        );
      }
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Hai người đã là bạn bè');
      }
      throw new ConflictException(
        'Không thể gửi lời mời kết bạn cho người này',
      );
    }
    await this.friendshipRepository.save(
      this.friendshipRepository.create({
        userId: currentUserId,
        friendId: targetUserId,
        status: FriendshipStatus.PENDING,
      }),
    );
    await this.publishNotification('gửi lời mời kết bạn', async () => {
      const sender = await this.getActiveUser(currentUserId);
      await this.notificationsService.createFriendRequest(
        targetUserId,
        sender.fullName,
        currentUserId,
      );
    });
  }

  async acceptRequest(
    currentUserId: string,
    requesterId: string,
  ): Promise<void> {
    const request = await this.friendshipRepository.findOne({
      where: {
        userId: requesterId,
        friendId: currentUserId,
        status: FriendshipStatus.PENDING,
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy lời mời kết bạn đang chờ');
    }
    request.status = FriendshipStatus.ACCEPTED;
    await this.friendshipRepository.save(request);
    await this.publishNotification('chấp nhận lời mời kết bạn', async () => {
      const accepter = await this.getActiveUser(currentUserId);
      await this.notificationsService.createFriendRequestAccepted(
        requesterId,
        accepter.fullName,
        currentUserId,
      );
    });
  }

  async removeRequest(
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const request = await this.findRelationship(currentUserId, targetUserId);
    if (!request || request.status !== FriendshipStatus.PENDING) {
      throw new NotFoundException('Không tìm thấy lời mời kết bạn đang chờ');
    }
    await this.friendshipRepository.remove(request);
  }

  async unfriend(currentUserId: string, targetUserId: string): Promise<void> {
    const relationship = await this.findRelationship(
      currentUserId,
      targetUserId,
    );
    if (!relationship || relationship.status !== FriendshipStatus.ACCEPTED) {
      throw new NotFoundException('Hai người chưa là bạn bè');
    }
    await this.friendshipRepository.remove(relationship);
  }

  /**
   * Kiểm tra xem 2 người dùng có quan hệ bạn bè hợp lệ không
   */
  async areFriends(userAId: string, userBId: string): Promise<boolean> {
    if (userAId === userBId) {
      return false;
    }

    const count = await this.friendshipRepository
      .createQueryBuilder('f')
      .where('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .andWhere(
        '((f.userId = :a AND f.friendId = :b) OR (f.userId = :b AND f.friendId = :a))',
        { a: userAId, b: userBId },
      )
      .getCount();

    return count > 0;
  }

  /**
   * Xác thực toàn bộ danh sách thành viên đều là bạn bè của người dùng hiện tại
   */
  async validateAllAreFriends(
    currentUserId: string,
    targetUserIds: string[],
  ): Promise<void> {
    const uniqueTargets = [
      ...new Set(targetUserIds.filter((id) => id !== currentUserId)),
    ];
    if (uniqueTargets.length === 0) {
      throw new BadRequestException('Danh sách thành viên không được để trống');
    }

    // Kiểm tra tất cả users có tồn tại và đang active
    const activeUsers = await this.userRepository.find({
      where: {
        id: In(uniqueTargets),
        isActive: true,
      },
      select: ['id'],
    });

    if (activeUsers.length !== uniqueTargets.length) {
      throw new BadRequestException(
        'Một hoặc nhiều người dùng không tồn tại hoặc tài khoản đã bị khóa',
      );
    }

    // Kiểm tra quan hệ bạn bè ACCEPTED giữa currentUserId và từng target
    const friendships = await this.friendshipRepository
      .createQueryBuilder('f')
      .where('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .andWhere(
        '((f.userId = :uid AND f.friendId IN (:...targets)) OR (f.friendId = :uid AND f.userId IN (:...targets)))',
        { uid: currentUserId, targets: uniqueTargets },
      )
      .getMany();

    const friendSet = new Set<string>();
    for (const f of friendships) {
      if (f.userId === currentUserId) friendSet.add(f.friendId);
      if (f.friendId === currentUserId) friendSet.add(f.userId);
    }

    for (const targetId of uniqueTargets) {
      if (!friendSet.has(targetId)) {
        throw new BadRequestException(
          `Người dùng ${targetId} không nằm trong danh sách bạn bè đã chấp thuận của bạn`,
        );
      }
    }
  }

  private async assertEligibleTarget(
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'Bạn không thể gửi lời mời kết bạn cho chính mình',
      );
    }
    const target = await this.userRepository.findOne({
      where: { id: targetUserId, isActive: true },
      select: ['id', 'role'],
    });
    if (!target || target.role !== UserRole.CLIENT) {
      throw new NotFoundException('Không tìm thấy thành viên để kết bạn');
    }
  }

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'fullName'],
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng hiện tại');
    }
    return user;
  }

  private async publishNotification(
    action: string,
    publish: () => Promise<void>,
  ): Promise<void> {
    try {
      await publish();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Không thể tạo thông báo khi ${action}; thao tác bạn bè vẫn hoàn tất: ${reason}`,
      );
    }
  }

  private async findRelationship(
    currentUserId: string,
    targetUserId: string,
  ): Promise<Friendship | null> {
    return this.friendshipRepository
      .createQueryBuilder('friendship')
      .where(
        '((friendship.userId = :currentUserId AND friendship.friendId = :targetUserId) OR (friendship.userId = :targetUserId AND friendship.friendId = :currentUserId))',
        { currentUserId, targetUserId },
      )
      .getOne();
  }

  private toDiscoveryResponse(
    user: User,
    friendshipStatus: FriendRelationshipStatus,
  ): FriendDiscoveryResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? null,
      workplace: user.workplace ?? null,
      location: user.location ?? null,
      friendshipStatus,
    };
  }

  private resolveRelationshipStatus(
    relationship: Friendship | undefined,
    currentUserId: string,
  ): FriendRelationshipStatus {
    if (!relationship) return 'NONE';
    if (relationship.status === FriendshipStatus.ACCEPTED) return 'FRIEND';
    if (relationship.status === FriendshipStatus.PENDING) {
      return relationship.userId === currentUserId
        ? 'REQUEST_SENT'
        : 'REQUEST_RECEIVED';
    }
    return 'NONE';
  }
}
