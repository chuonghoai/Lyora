import {
  conversationRepository,
  type IConversationRepository,
} from '../repositories/conversation.repository';
import type {
  AddGroupMembersPayload,
  ConversationDetail,
  ConversationQueryParams,
  ConversationSummary,
  CreateDirectConversationPayload,
  CreateGroupConversationPayload,
  DissolveGroupPayload,
  GroupActionResponse,
  LeaveGroupPayload,
  RemoveGroupMemberPayload,
  TransferGroupOwnershipPayload,
  UpdateGroupTitlePayload,
} from '../types/conversation.types';

export class ConversationService {
  private readonly repository: IConversationRepository;

  constructor(
    repository: IConversationRepository = conversationRepository,
  ) {
    this.repository = repository;
  }

  async getConversations(
    params?: ConversationQueryParams,
  ): Promise<ConversationSummary[]> {
    const response = await this.repository.getConversations(params);
    return response.data ?? [];
  }

  async getConversationDetail(id: string): Promise<ConversationDetail> {
    const response = await this.repository.getConversationDetail(id);
    return response.data;
  }

  async createDirectConversation(
    payload: CreateDirectConversationPayload,
  ): Promise<ConversationSummary> {
    const response = await this.repository.createDirectConversation(payload);
    return response.data;
  }

  async createGroupConversation(
    payload: CreateGroupConversationPayload,
  ): Promise<ConversationDetail> {
    const response = await this.repository.createGroupConversation(payload);
    return response.data;
  }

  async updateGroupTitle(
    payload: UpdateGroupTitlePayload,
  ): Promise<ConversationDetail> {
    const response = await this.repository.updateGroupTitle(payload);
    return response.data;
  }

  async addGroupMembers(
    payload: AddGroupMembersPayload,
  ): Promise<ConversationDetail> {
    const response = await this.repository.addGroupMembers(payload);
    return response.data;
  }

  async removeMember(
    payload: RemoveGroupMemberPayload,
  ): Promise<ConversationDetail> {
    const response = await this.repository.removeMember(payload);
    return response.data;
  }

  async transferOwnership(
    payload: TransferGroupOwnershipPayload,
  ): Promise<ConversationDetail> {
    const response = await this.repository.transferOwnership(payload);
    return response.data;
  }

  async leaveGroup(
    payload: LeaveGroupPayload,
  ): Promise<GroupActionResponse> {
    const response = await this.repository.leaveGroup(payload);
    return response.data;
  }

  async dissolveGroup(
    payload: DissolveGroupPayload,
  ): Promise<GroupActionResponse> {
    const response = await this.repository.dissolveGroup(payload);
    return response.data;
  }
}

export const conversationService = new ConversationService();
