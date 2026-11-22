import { PaginationMetaDto } from '../../../common/dto/api-response.dto';
import { ConversationMemberRole } from '../enums/conversation-member-role.enum';
import { ConversationType } from '../enums/conversation-type.enum';

export class ConversationUserSummaryDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export class ConversationMemberDto {
  id: string;
  userId: string;
  role: ConversationMemberRole;
  joinedAt: Date;
  user: ConversationUserSummaryDto;
}

export class ConversationSummaryDto {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  memberCount: number;
  directParticipant?: ConversationUserSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationDetailDto {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  directUserKey?: string | null;
  creatorId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: ConversationMemberDto[];
}

export class PaginatedConversationsDto {
  items: ConversationSummaryDto[];
  meta: PaginationMetaDto;
}
