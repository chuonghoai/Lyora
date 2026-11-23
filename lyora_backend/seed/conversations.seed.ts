import * as crypto from 'crypto';
import { DataSource, IsNull } from 'typeorm';
import { ConversationMember } from '../src/modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../src/modules/conversations/entities/idempotency-record.entity';
import { ConversationMemberRole } from '../src/modules/conversations/enums/conversation-member-role.enum';
import { ConversationType } from '../src/modules/conversations/enums/conversation-type.enum';
import { User } from '../src/modules/users/entities/user.entity';

export interface SeedConversationsSummary {
  conversationsCount: number;
  membersCount: number;
  idempotencyCount: number;
}

export async function seedConversations(
  dataSource: DataSource,
): Promise<SeedConversationsSummary> {
  const userRepository = dataSource.getRepository(User);
  const conversationRepository = dataSource.getRepository(Conversation);
  const memberRepository = dataSource.getRepository(ConversationMember);
  const idempotencyRepository = dataSource.getRepository(IdempotencyRecord);

  const mainUser = await userRepository.findOne({
    where: { email: 'user@gmail.com' },
  });
  const friend1 = await userRepository.findOne({
    where: { email: 'friend1@gmail.com' },
  });
  const friend2 = await userRepository.findOne({
    where: { email: 'friend2@gmail.com' },
  });
  const friend3 = await userRepository.findOne({
    where: { email: 'friend3@gmail.com' },
  });

  if (!mainUser || !friend1 || !friend2 || !friend3) {
    return { conversationsCount: 0, membersCount: 0, idempotencyCount: 0 };
  }

  let conversationsCount = 0;
  let membersCount = 0;
  let idempotencyCount = 0;

  // 1. Tạo các cuộc hội thoại trực tiếp 1-1 (DIRECT) giữa user@gmail.com và bạn bè
  const directPairs: Array<[User, User]> = [
    [mainUser, friend1],
    [mainUser, friend2],
  ];

  for (const [userA, userB] of directPairs) {
    const directUserKey = [userA.id, userB.id].sort().join(':');
    let conversation = await conversationRepository.findOne({
      where: {
        type: ConversationType.DIRECT,
        directUserKey,
        deletedAt: IsNull(),
      },
    });

    if (!conversation) {
      conversation = await conversationRepository.save(
        conversationRepository.create({
          type: ConversationType.DIRECT,
          directUserKey,
          title: null,
          creatorId: null,
        }),
      );
      conversationsCount++;
    }

    for (const participant of [userA, userB]) {
      const existingMember = await memberRepository.findOne({
        where: {
          conversationId: conversation.id,
          userId: participant.id,
        },
      });
      if (!existingMember) {
        await memberRepository.save(
          memberRepository.create({
            conversationId: conversation.id,
            userId: participant.id,
            role: ConversationMemberRole.MEMBER,
          }),
        );
        membersCount++;
      }
    }
  }

  // 2. Tạo cuộc hội thoại nhóm (GROUP) do user@gmail.com làm trưởng nhóm (OWNER)
  const groupTitle = 'Nhóm Cộng Đồng Lyora';
  let groupConversation = await conversationRepository.findOne({
    where: {
      type: ConversationType.GROUP,
      title: groupTitle,
      creatorId: mainUser.id,
      deletedAt: IsNull(),
    },
  });

  if (!groupConversation) {
    groupConversation = await conversationRepository.save(
      conversationRepository.create({
        type: ConversationType.GROUP,
        title: groupTitle,
        directUserKey: null,
        creatorId: mainUser.id,
      }),
    );
    conversationsCount++;
  }

  const groupMembers: Array<{ user: User; role: ConversationMemberRole }> = [
    { user: mainUser, role: ConversationMemberRole.OWNER },
    { user: friend1, role: ConversationMemberRole.MEMBER },
    { user: friend2, role: ConversationMemberRole.MEMBER },
    { user: friend3, role: ConversationMemberRole.MEMBER },
  ];

  for (const entry of groupMembers) {
    const existingMember = await memberRepository.findOne({
      where: {
        conversationId: groupConversation.id,
        userId: entry.user.id,
      },
    });
    if (!existingMember) {
      await memberRepository.save(
        memberRepository.create({
          conversationId: groupConversation.id,
          userId: entry.user.id,
          role: entry.role,
        }),
      );
      membersCount++;
    }
  }

  // 3. Tạo 1 bản ghi Idempotency mẫu tương ứng với nhóm vừa tạo
  const seedIdempotencyKey = 'seed-group-community-lyora-v1';
  const existingIdempotency = await idempotencyRepository.findOne({
    where: {
      userId: mainUser.id,
      idempotencyKey: seedIdempotencyKey,
    },
  });

  if (!existingIdempotency) {
    const sortedMemberIds = [friend1.id, friend2.id, friend3.id].sort();
    const requestHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          title: groupTitle,
          memberIds: sortedMemberIds,
        }),
      )
      .digest('hex');

    await idempotencyRepository.save(
      idempotencyRepository.create({
        userId: mainUser.id,
        idempotencyKey: seedIdempotencyKey,
        resourceType: 'GROUP_CONVERSATION',
        resourceId: groupConversation.id,
        requestHash,
      }),
    );
    idempotencyCount++;
  }

  return {
    conversationsCount,
    membersCount,
    idempotencyCount,
  };
}
