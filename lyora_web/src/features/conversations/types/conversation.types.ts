export type ConversationType = 'DIRECT' | 'GROUP';
export type ConversationMemberRole = 'OWNER' | 'MEMBER';

export interface ConversationParticipant {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface ConversationMember {
  id: string;
  userId: string;
  role: ConversationMemberRole;
  joinedAt: string;
  user: ConversationParticipant;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  memberCount: number;
  directParticipant?: ConversationParticipant | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl: string | null;
  directUserKey?: string | null;
  creatorId?: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
}

export interface CreateDirectConversationPayload {
  targetUserId: string;
}

export interface CreateGroupConversationPayload {
  title: string;
  memberIds: string[];
  idempotencyKey?: string;
}

export interface ConversationQueryParams {
  page?: number;
  limit?: number;
  type?: ConversationType;
  search?: string;
}
