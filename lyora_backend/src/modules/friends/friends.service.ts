import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FriendResponseDto } from './dto/friend-response.dto';
import { Friendship } from './entities/friendship.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      select: ['id', 'fullName', 'avatarUrl', 'isActive'],
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl ?? null,
      isOnline: false, // Chuẩn hóa bảo mật: Không giả định isActive là online; Phase 3 sẽ tích hợp WebSocket Presence
    }));
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
}
