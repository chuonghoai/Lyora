import * as crypto from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { UserRole } from '../../common/enums/role.enum';
import { FriendsService } from '../friends/friends.service';
import { User } from '../users/entities/user.entity';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import {
  ConversationDetailDto,
  ConversationMemberDto,
  ConversationSummaryDto,
  ConversationUserSummaryDto,
  PaginatedConversationsDto,
} from './dto/conversation-response.dto';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { ConversationMember } from './entities/conversation-member.entity';
import { Conversation } from './entities/conversation.entity';
import { IdempotencyRecord } from './entities/idempotency-record.entity';
import { ConversationMemberRole } from './enums/conversation-member-role.enum';
import { ConversationType } from './enums/conversation-type.enum';

interface DatabaseError {
  code?: string;
  message?: string;
  detail?: string;
  constraint?: string;
}

function isDatabaseError(err: unknown): err is DatabaseError {
  return typeof err === 'object' && err !== null;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly memberRepository: Repository<ConversationMember>,
    @InjectRepository(IdempotencyRecord)
    private readonly idempotencyRepository: Repository<IdempotencyRecord>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly friendsService: FriendsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Tạo hoặc lấy lại cuộc hội thoại trực tiếp 1-1 (Idempotent & Race-condition safe)
   */
  async createDirectConversation(
    currentUserId: string,
    dto: CreateDirectConversationDto,
  ): Promise<ConversationSummaryDto> {
    const { targetUserId } = dto;

    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'Không thể tạo cuộc hội thoại trực tiếp với chính mình',
      );
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, isActive: true },
      select: ['id', 'fullName', 'avatarUrl', 'isActive', 'role'],
    });

    if (!targetUser || targetUser.role !== UserRole.CLIENT) {
      throw new NotFoundException(
        'Người dùng không tồn tại hoặc tài khoản không khả dụng',
      );
    }

    // Bắt buộc phải là bạn bè trạng thái ACCEPTED
    const areFriends = await this.friendsService.areFriends(
      currentUserId,
      targetUserId,
    );
    if (!areFriends) {
      throw new ForbiddenException(
        'Chỉ có thể tạo cuộc hội thoại với người dùng trong danh sách bạn bè',
      );
    }

    // Canonical direct user key (sắp xếp UUID từ điển)
    const directUserKey = [currentUserId, targetUserId].sort().join(':');

    // Kiểm tra xem hội thoại đã tồn tại chưa
    const existing = await this.findDirectConversationByKey(
      directUserKey,
      currentUserId,
    );
    if (existing) {
      return existing;
    }

    // Thực thi transaction với cơ chế bắt lỗi PostgreSQL 23505 chặt chẽ
    try {
      return await this.dataSource.transaction(async (manager) => {
        const conversation = manager.create(Conversation, {
          type: ConversationType.DIRECT,
          directUserKey,
        });
        const savedConv = await manager.save(conversation);

        // Cả 2 thành viên đều mang quyền MEMBER (không có OWNER trong chat 1-1)
        const members = manager.create(ConversationMember, [
          {
            conversationId: savedConv.id,
            userId: currentUserId,
            role: ConversationMemberRole.MEMBER,
          },
          {
            conversationId: savedConv.id,
            userId: targetUserId,
            role: ConversationMemberRole.MEMBER,
          },
        ]);
        await manager.save(members);

        return {
          id: savedConv.id,
          type: savedConv.type,
          title: targetUser.fullName,
          avatarUrl: targetUser.avatarUrl ?? null,
          memberCount: 2,
          directParticipant: {
            id: targetUser.id,
            fullName: targetUser.fullName,
            avatarUrl: targetUser.avatarUrl ?? null,
            isOnline: false,
          },
          createdAt: savedConv.createdAt,
          updatedAt: savedConv.updatedAt,
        };
      });
    } catch (error: unknown) {
      const dbErr = isDatabaseError(error) ? error : undefined;
      // Chỉ bắt mã lỗi 23505 thuộc đúng unique index direct_user_key
      const isDirectUniqueConflict =
        dbErr?.code === '23505' &&
        (dbErr?.constraint?.includes('UQ_conversations_direct_user_key') ||
          dbErr?.detail?.includes('direct_user_key'));

      if (isDirectUniqueConflict) {
        const raceWinner = await this.findDirectConversationByKey(
          directUserKey,
          currentUserId,
        );
        if (raceWinner) {
          return raceWinner;
        }
      }
      throw error;
    }
  }

  /**
   * Tạo cuộc hội thoại nhóm (Group Conversation) với PostgreSQL Transactional Idempotency
   */
  async createGroupConversation(
    currentUserId: string,
    dto: CreateGroupConversationDto,
    idempotencyKey?: string,
  ): Promise<ConversationDetailDto> {
    const trimmedTitle = dto.title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      throw new BadRequestException(
        'Tên nhóm phải có độ dài từ 2 đến 100 ký tự',
      );
    }

    // Loại bỏ currentUserId nếu vô tình có trong danh sách và sắp xếp nhất quán
    const uniqueMemberIds = [
      ...new Set(dto.memberIds.filter((id) => id !== currentUserId)),
    ].sort();

    const totalMembers = uniqueMemberIds.length + 1; // +1 creator
    if (totalMembers < 3) {
      throw new BadRequestException(
        'Hội thoại nhóm cần tối thiểu 2 người bạn (tổng 3 thành viên bao gồm người tạo)',
      );
    }
    if (totalMembers > 100) {
      throw new BadRequestException(
        'Hội thoại nhóm không được vượt quá 100 thành viên',
      );
    }

    // Bắt buộc tất cả thành viên đều phải là bạn bè của currentUserId
    await this.friendsService.validateAllAreFriends(
      currentUserId,
      uniqueMemberIds,
    );

    // Tính canonical request hash cho payload
    const canonicalPayload = JSON.stringify({
      title: trimmedTitle,
      memberIds: uniqueMemberIds,
    });
    const requestHash = crypto
      .createHash('sha256')
      .update(canonicalPayload)
      .digest('hex');

    // Kiểm tra idempotency key trước transaction nếu có
    if (idempotencyKey) {
      const existingRecord = await this.idempotencyRepository.findOne({
        where: { userId: currentUserId, idempotencyKey },
      });
      if (existingRecord) {
        if (existingRecord.requestHash === requestHash) {
          return this.findById(currentUserId, existingRecord.resourceId);
        }
        throw new BadRequestException(
          'Idempotency key đã được sử dụng cho một yêu cầu khác với nội dung khác',
        );
      }
    }

    try {
      const createdId = await this.dataSource.transaction(async (manager) => {
        const conv = manager.create(Conversation, {
          type: ConversationType.GROUP,
          title: trimmedTitle,
          creatorId: currentUserId,
        });
        const savedConv = await manager.save(conv);

        // Creator là OWNER, các thành viên khác là MEMBER
        const memberEntities = [
          manager.create(ConversationMember, {
            conversationId: savedConv.id,
            userId: currentUserId,
            role: ConversationMemberRole.OWNER,
          }),
          ...uniqueMemberIds.map((userId) =>
            manager.create(ConversationMember, {
              conversationId: savedConv.id,
              userId,
              role: ConversationMemberRole.MEMBER,
            }),
          ),
        ];

        await manager.save(memberEntities);

        if (idempotencyKey) {
          const record = manager.create(IdempotencyRecord, {
            userId: currentUserId,
            idempotencyKey,
            resourceType: 'GROUP_CONVERSATION',
            resourceId: savedConv.id,
            requestHash,
          });
          await manager.save(record);
        }

        return savedConv.id;
      });

      return this.findById(currentUserId, createdId);
    } catch (error: unknown) {
      const dbErr = isDatabaseError(error) ? error : undefined;
      const isIdempotencyConflict =
        dbErr?.code === '23505' &&
        (dbErr?.constraint?.includes('UQ_idempotency_records_user_key') ||
          dbErr?.detail?.includes('idempotency_key'));

      if (isIdempotencyConflict && idempotencyKey) {
        const raceWinner = await this.idempotencyRepository.findOne({
          where: { userId: currentUserId, idempotencyKey },
        });
        if (raceWinner && raceWinner.requestHash === requestHash) {
          return this.findById(currentUserId, raceWinner.resourceId);
        }
        throw new BadRequestException(
          'Idempotency key đã được sử dụng cho một yêu cầu khác với nội dung khác',
        );
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách hội thoại phân trang của người dùng hiện tại
   */
  async findAllPaginated(
    currentUserId: string,
    query: ConversationQueryDto,
  ): Promise<PaginatedConversationsDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const offset = (page - 1) * limit;

    // Subquery tìm danh sách conversation_id mà currentUserId tham gia
    const userConvQb = this.memberRepository
      .createQueryBuilder('cm')
      .select('cm.conversationId', 'convId')
      .where('cm.userId = :currentUserId', { currentUserId })
      .andWhere('cm.deletedAt IS NULL');

    // Main query
    const qb = this.conversationRepository
      .createQueryBuilder('c')
      .where(`c.id IN (${userConvQb.getQuery()})`)
      .setParameters(userConvQb.getParameters())
      .andWhere('c.deletedAt IS NULL');

    if (query.type) {
      qb.andWhere('c.type = :type', { type: query.type });
    }

    qb.orderBy('c.updatedAt', 'DESC').addOrderBy('c.id', 'DESC');

    const total = await qb.getCount();
    const rawConversations = await qb.skip(offset).take(limit).getMany();

    if (rawConversations.length === 0) {
      return {
        items: [],
        meta: new PaginationMetaDto(page, limit, total),
      };
    }

    const convIds = rawConversations.map((c) => c.id);

    // Lấy thông tin thành viên đối tác đối với các cuộc trò chuyện DIRECT
    const directOtherMembers = await this.memberRepository
      .createQueryBuilder('cm')
      .leftJoinAndSelect('cm.user', 'u')
      .where('cm.conversationId IN (:...convIds)', { convIds })
      .andWhere('cm.userId != :currentUserId', { currentUserId })
      .andWhere('cm.deletedAt IS NULL')
      .getMany();

    const directMemberMap = new Map<string, ConversationUserSummaryDto>();
    for (const dm of directOtherMembers) {
      if (dm.user) {
        directMemberMap.set(dm.conversationId, {
          id: dm.user.id,
          fullName: dm.user.fullName,
          avatarUrl: dm.user.avatarUrl ?? null,
          isOnline: false,
        });
      }
    }

    // Đếm số thành viên cho mỗi hội thoại GROUP bằng scalar aggregation
    const groupMemberCounts = await this.memberRepository
      .createQueryBuilder('cm')
      .select('cm.conversationId', 'conversationId')
      .addSelect('COUNT(cm.id)', 'count')
      .where('cm.conversationId IN (:...convIds)', { convIds })
      .andWhere('cm.deletedAt IS NULL')
      .groupBy('cm.conversationId')
      .getRawMany<{ conversationId: string; count: string }>();

    const memberCountMap = new Map<string, number>();
    for (const gmc of groupMemberCounts) {
      memberCountMap.set(gmc.conversationId, parseInt(gmc.count, 10));
    }

    const items: ConversationSummaryDto[] = rawConversations.map((c) => {
      if (c.type === ConversationType.DIRECT) {
        const partner = directMemberMap.get(c.id);
        return {
          id: c.id,
          type: c.type,
          title: partner?.fullName ?? 'Người dùng Lyora',
          avatarUrl: partner?.avatarUrl ?? null,
          memberCount: 2,
          directParticipant: partner ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      }

      return {
        id: c.id,
        type: c.type,
        title: c.title ?? 'Nhóm trò chuyện',
        avatarUrl: c.avatarUrl ?? null,
        memberCount: memberCountMap.get(c.id) ?? 0,
        directParticipant: null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    // Lọc theo search nếu có
    let filteredItems = items;
    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      filteredItems = items.filter((item) =>
        item.title.toLowerCase().includes(term),
      );
    }

    return {
      items: filteredItems,
      meta: new PaginationMetaDto(page, limit, total),
    };
  }

  /**
   * Lấy chi tiết một hội thoại (bảo vệ chống IDOR: chỉ thành viên mới được xem)
   */
  async findById(
    currentUserId: string,
    conversationId: string,
  ): Promise<ConversationDetailDto> {
    // 1. Kiểm tra quyền thành viên (IDOR Protection)
    const membership = await this.memberRepository.findOne({
      where: {
        conversationId,
        userId: currentUserId,
        deletedAt: IsNull(),
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Không tìm thấy cuộc hội thoại hoặc bạn không có quyền truy cập',
      );
    }

    // 2. Nạp cuộc hội thoại
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, deletedAt: IsNull() },
    });

    if (!conversation) {
      throw new NotFoundException('Cuộc hội thoại không tồn tại');
    }

    // 3. Nạp danh sách thành viên kèm User an toàn (Bảo mật: Không email)
    const members = await this.memberRepository.find({
      where: { conversationId, deletedAt: IsNull() },
      relations: ['user'],
      order: { role: 'ASC', joinedAt: 'ASC' }, // OWNER trước, MEMBER sau
    });

    const memberDtos: ConversationMemberDto[] = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: {
        id: m.user?.id ?? m.userId,
        fullName: m.user?.fullName ?? 'Người dùng Lyora',
        avatarUrl: m.user?.avatarUrl ?? null,
        isOnline: false,
      },
    }));

    // Tiêu đề cho DIRECT chat là tên đối tác
    let displayTitle = conversation.title ?? 'Cuộc trò chuyện';
    let displayAvatar = conversation.avatarUrl ?? null;

    if (conversation.type === ConversationType.DIRECT) {
      const partner = memberDtos.find((m) => m.userId !== currentUserId);
      if (partner) {
        displayTitle = partner.user.fullName;
        displayAvatar = partner.user.avatarUrl;
      }
    }

    return {
      id: conversation.id,
      type: conversation.type,
      title: displayTitle,
      avatarUrl: displayAvatar,
      directUserKey: conversation.directUserKey ?? null,
      creatorId: conversation.creatorId ?? null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      members: memberDtos,
    };
  }

  /**
   * Helper tìm cuộc hội thoại DIRECT theo directUserKey
   */
  private async findDirectConversationByKey(
    directUserKey: string,
    currentUserId: string,
  ): Promise<ConversationSummaryDto | null> {
    const conv = await this.conversationRepository.findOne({
      where: {
        directUserKey,
        type: ConversationType.DIRECT,
        deletedAt: IsNull(),
      },
    });

    if (!conv) {
      return null;
    }

    // Tìm partner member
    const partnerMember = await this.memberRepository.findOne({
      where: {
        conversationId: conv.id,
        userId: In(
          directUserKey.split(':').filter((id) => id !== currentUserId),
        ),
        deletedAt: IsNull(),
      },
      relations: ['user'],
    });

    const partnerSummary: ConversationUserSummaryDto | null =
      partnerMember?.user
        ? {
            id: partnerMember.user.id,
            fullName: partnerMember.user.fullName,
            avatarUrl: partnerMember.user.avatarUrl ?? null,
            isOnline: false,
          }
        : null;

    return {
      id: conv.id,
      type: conv.type,
      title: partnerSummary?.fullName ?? 'Người dùng Lyora',
      avatarUrl: partnerSummary?.avatarUrl ?? null,
      memberCount: 2,
      directParticipant: partnerSummary,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }
}
