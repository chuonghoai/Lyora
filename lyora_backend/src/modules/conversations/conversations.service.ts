import * as crypto from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { UserRole } from '../../common/enums/role.enum';
import { FriendsService } from '../friends/friends.service';
import { User } from '../users/entities/user.entity';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
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
import { LeaveGroupDto } from './dto/leave-group.dto';
import { TransferGroupOwnershipDto } from './dto/transfer-group-ownership.dto';
import { UpdateGroupTitleDto } from './dto/update-group-title.dto';
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

  /**
   * Helper kiểm tra tư cách thành viên nhóm và vai trò (IDOR Safe)
   * Hỗ trợ Transactional Pessimistic Locking chống Race Conditions
   */
  private async assertGroupMembership(
    currentUserId: string,
    conversationId: string,
    requireOwner = false,
    manager?: EntityManager,
  ): Promise<{ conversation: Conversation; callerMember: ConversationMember }> {
    const convRepo = manager
      ? manager.getRepository(Conversation)
      : this.conversationRepository;

    const conversation = await convRepo.findOne({
      where: { id: conversationId, deletedAt: IsNull() },
      lock: manager ? { mode: 'pessimistic_write' } : undefined,
    });

    if (!conversation) {
      throw new NotFoundException(
        'Không tìm thấy cuộc hội thoại hoặc bạn không có quyền truy cập',
      );
    }

    if (conversation.type !== ConversationType.GROUP) {
      throw new BadRequestException(
        'Thao tác này chỉ áp dụng cho hội thoại nhóm',
      );
    }

    const memberRepo = manager
      ? manager.getRepository(ConversationMember)
      : this.memberRepository;

    const callerMember = await memberRepo.findOne({
      where: {
        conversationId,
        userId: currentUserId,
        deletedAt: IsNull(),
      },
    });

    if (!callerMember) {
      throw new NotFoundException(
        'Không tìm thấy cuộc hội thoại hoặc bạn không có quyền truy cập',
      );
    }

    if (requireOwner && callerMember.role !== ConversationMemberRole.OWNER) {
      throw new ForbiddenException(
        'Chỉ Trưởng nhóm mới có quyền thực hiện thao tác này',
      );
    }

    return { conversation, callerMember };
  }

  /**
   * Cập nhật tên nhóm trò chuyện (Chỉ OWNER)
   */
  async updateGroupTitle(
    currentUserId: string,
    conversationId: string,
    dto: UpdateGroupTitleDto,
  ): Promise<ConversationDetailDto> {
    const trimmedTitle = dto.title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      throw new BadRequestException(
        'Tên nhóm phải có độ dài từ 2 đến 100 ký tự',
      );
    }

    const { conversation } = await this.assertGroupMembership(
      currentUserId,
      conversationId,
      true,
    );

    conversation.title = trimmedTitle;
    await this.conversationRepository.save(conversation);

    return this.findById(currentUserId, conversationId);
  }

  /**
   * Thêm thành viên vào nhóm từ danh sách bạn bè (CHỈ OWNER)
   * Sử dụng Transactional Pessimistic Locking & cơ chế phục hồi Soft-Delete
   */
  async addGroupMembers(
    currentUserId: string,
    conversationId: string,
    dto: AddGroupMembersDto,
  ): Promise<ConversationDetailDto> {
    const memberIdsToAdd = [
      ...new Set(dto.memberIds.filter((id) => id !== currentUserId)),
    ];
    if (memberIdsToAdd.length === 0) {
      throw new BadRequestException(
        'Cần chọn ít nhất 1 thành viên để thêm vào nhóm',
      );
    }

    // Kiểm tra quyền OWNER trước tiên để đảm bảo IDOR và RBAC an toàn
    await this.assertGroupMembership(currentUserId, conversationId, true);

    // Bắt buộc tất cả thành viên được thêm phải là bạn bè của người mời
    await this.friendsService.validateAllAreFriends(
      currentUserId,
      memberIdsToAdd,
    );

    await this.dataSource.transaction(async (manager) => {
      // Chỉ OWNER mới được thêm thành viên (chống race condition với lock)
      await this.assertGroupMembership(
        currentUserId,
        conversationId,
        true,
        manager,
      );

      const activeMembers = await manager.find(ConversationMember, {
        where: { conversationId, deletedAt: IsNull() },
      });

      const activeUserIds = new Set(activeMembers.map((m) => m.userId));
      const alreadyInGroup = memberIdsToAdd.filter((id) =>
        activeUserIds.has(id),
      );
      if (alreadyInGroup.length > 0) {
        throw new BadRequestException(
          'Một số người dùng được chọn đã là thành viên trong nhóm',
        );
      }

      if (activeMembers.length + memberIdsToAdd.length > 100) {
        throw new BadRequestException(
          'Hội thoại nhóm không được vượt quá 100 thành viên',
        );
      }

      for (const targetUserId of memberIdsToAdd) {
        // Tìm bản ghi cũ (kể cả đã soft-deleted) để khôi phục hoặc tạo mới
        const existingRecord = await manager.findOne(ConversationMember, {
          where: { conversationId, userId: targetUserId },
          withDeleted: true,
        });

        if (existingRecord) {
          existingRecord.deletedAt = null;
          existingRecord.joinedAt = new Date();
          existingRecord.role = ConversationMemberRole.MEMBER;
          await manager.save(existingRecord);
        } else {
          const newMember = manager.create(ConversationMember, {
            conversationId,
            userId: targetUserId,
            role: ConversationMemberRole.MEMBER,
          });
          await manager.save(newMember);
        }
      }

      await manager.update(Conversation, conversationId, {
        updatedAt: new Date(),
      });
    });

    return this.findById(currentUserId, conversationId);
  }

  /**
   * Xóa thành viên ra khỏi nhóm (Chỉ OWNER)
   */
  async removeMember(
    currentUserId: string,
    conversationId: string,
    targetUserId: string,
  ): Promise<ConversationDetailDto> {
    if (targetUserId === currentUserId) {
      throw new BadRequestException(
        'Không thể tự xóa chính mình khỏi nhóm. Vui lòng sử dụng chức năng Rời nhóm',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.assertGroupMembership(
        currentUserId,
        conversationId,
        true,
        manager,
      );

      const targetMember = await manager.findOne(ConversationMember, {
        where: {
          conversationId,
          userId: targetUserId,
          deletedAt: IsNull(),
        },
      });

      if (!targetMember) {
        throw new NotFoundException(
          'Thành viên không tồn tại trong cuộc hội thoại này',
        );
      }

      await manager.softDelete(ConversationMember, targetMember.id);
      await manager.update(Conversation, conversationId, {
        updatedAt: new Date(),
      });
    });

    return this.findById(currentUserId, conversationId);
  }

  /**
   * Chuyển quyền Trưởng nhóm (Chỉ OWNER)
   */
  async transferOwnership(
    currentUserId: string,
    conversationId: string,
    dto: TransferGroupOwnershipDto,
  ): Promise<ConversationDetailDto> {
    if (dto.newOwnerId === currentUserId) {
      throw new BadRequestException('Bạn hiện đã là Trưởng nhóm');
    }

    await this.dataSource.transaction(async (manager) => {
      const { callerMember } = await this.assertGroupMembership(
        currentUserId,
        conversationId,
        true,
        manager,
      );

      const targetMember = await manager.findOne(ConversationMember, {
        where: {
          conversationId,
          userId: dto.newOwnerId,
          deletedAt: IsNull(),
        },
      });

      if (!targetMember) {
        throw new BadRequestException(
          'Người được chỉ định không phải là thành viên hợp lệ của nhóm',
        );
      }

      callerMember.role = ConversationMemberRole.MEMBER;
      targetMember.role = ConversationMemberRole.OWNER;

      await manager.save([callerMember, targetMember]);
      await manager.update(Conversation, conversationId, {
        updatedAt: new Date(),
      });
    });

    return this.findById(currentUserId, conversationId);
  }

  /**
   * Rời khỏi cuộc hội thoại nhóm (OWNER hoặc MEMBER)
   * Nếu OWNER rời nhóm và nhóm còn > 1 người, bắt buộc chỉ định successor.
   * Nếu thành viên duy nhất (OWNER) rời nhóm, tự động giải tán nhóm.
   */
  async leaveGroup(
    currentUserId: string,
    conversationId: string,
    dto: LeaveGroupDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const { callerMember } = await this.assertGroupMembership(
        currentUserId,
        conversationId,
        false,
        manager,
      );

      const activeMembers = await manager.find(ConversationMember, {
        where: { conversationId, deletedAt: IsNull() },
      });

      if (callerMember.role === ConversationMemberRole.OWNER) {
        if (activeMembers.length > 1) {
          if (!dto.newOwnerId) {
            throw new BadRequestException(
              'Trưởng nhóm cần chỉ định người kế nhiệm trước khi rời nhóm',
            );
          }
          if (dto.newOwnerId === currentUserId) {
            throw new BadRequestException(
              'Người kế nhiệm không thể là chính bạn',
            );
          }
          const successor = activeMembers.find(
            (m) => m.userId === dto.newOwnerId,
          );
          if (!successor) {
            throw new BadRequestException(
              'Người được chỉ định không phải là thành viên hợp lệ của nhóm',
            );
          }

          successor.role = ConversationMemberRole.OWNER;
          await manager.save(successor);
        } else {
          // Thành viên duy nhất rời nhóm -> Tự động giải tán nhóm
          await manager.softDelete(ConversationMember, callerMember.id);
          await manager.softDelete(Conversation, conversationId);
          return {
            success: true,
            message:
              'Bạn đã rời khỏi nhóm và nhóm đã được tự động giải tán vì không còn thành viên nào',
          };
        }
      }

      await manager.softDelete(ConversationMember, callerMember.id);
      await manager.update(Conversation, conversationId, {
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: 'Bạn đã rời khỏi nhóm thành công',
      };
    });
  }

  /**
   * Giải tán cuộc hội thoại nhóm (Chỉ OWNER)
   */
  async dissolveGroup(
    currentUserId: string,
    conversationId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.dataSource.transaction(async (manager) => {
      await this.assertGroupMembership(
        currentUserId,
        conversationId,
        true,
        manager,
      );

      await manager.softDelete(Conversation, conversationId);
      const members = await manager.find(ConversationMember, {
        where: { conversationId, deletedAt: IsNull() },
      });
      if (members.length > 0) {
        const memberIds = members.map((m) => m.id);
        await manager.softDelete(ConversationMember, memberIds);
      }
    });

    return {
      success: true,
      message: 'Đã giải tán nhóm thành công',
    };
  }
}
