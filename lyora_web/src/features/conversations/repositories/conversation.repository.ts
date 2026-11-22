import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
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

export interface IConversationRepository {
  getConversations(
    params?: ConversationQueryParams,
  ): Promise<ApiResponse<ConversationSummary[]>>;
  getConversationDetail(id: string): Promise<ApiResponse<ConversationDetail>>;
  createDirectConversation(
    payload: CreateDirectConversationPayload,
  ): Promise<ApiResponse<ConversationSummary>>;
  createGroupConversation(
    payload: CreateGroupConversationPayload,
  ): Promise<ApiResponse<ConversationDetail>>;
  updateGroupTitle(
    payload: UpdateGroupTitlePayload,
  ): Promise<ApiResponse<ConversationDetail>>;
  addGroupMembers(
    payload: AddGroupMembersPayload,
  ): Promise<ApiResponse<ConversationDetail>>;
  removeMember(
    payload: RemoveGroupMemberPayload,
  ): Promise<ApiResponse<ConversationDetail>>;
  transferOwnership(
    payload: TransferGroupOwnershipPayload,
  ): Promise<ApiResponse<ConversationDetail>>;
  leaveGroup(
    payload: LeaveGroupPayload,
  ): Promise<ApiResponse<GroupActionResponse>>;
  dissolveGroup(
    payload: DissolveGroupPayload,
  ): Promise<ApiResponse<GroupActionResponse>>;
}

export class ConversationRepository implements IConversationRepository {
  async getConversations(
    params?: ConversationQueryParams,
  ): Promise<ApiResponse<ConversationSummary[]>> {
    return apiClient.get<
      ApiResponse<ConversationSummary[]>,
      ApiResponse<ConversationSummary[]>
    >(CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS, { params });
  }

  async getConversationDetail(
    id: string,
  ): Promise<ApiResponse<ConversationDetail>> {
    return apiClient.get<
      ApiResponse<ConversationDetail>,
      ApiResponse<ConversationDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${id}`);
  }

  async createDirectConversation(
    payload: CreateDirectConversationPayload,
  ): Promise<ApiResponse<ConversationSummary>> {
    return apiClient.post<
      ApiResponse<ConversationSummary>,
      ApiResponse<ConversationSummary>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/direct`, payload);
  }

  async createGroupConversation(
    payload: CreateGroupConversationPayload,
  ): Promise<ApiResponse<ConversationDetail>> {
    const headers = payload.idempotencyKey
      ? { 'x-idempotency-key': payload.idempotencyKey }
      : undefined;
    return apiClient.post<
      ApiResponse<ConversationDetail>,
      ApiResponse<ConversationDetail>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/group`, payload, {
      headers,
    });
  }

  async updateGroupTitle(
    payload: UpdateGroupTitlePayload,
  ): Promise<ApiResponse<ConversationDetail>> {
    return apiClient.patch<
      ApiResponse<ConversationDetail>,
      ApiResponse<ConversationDetail>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${payload.conversationId}/title`,
      { title: payload.title },
    );
  }

  async addGroupMembers(
    payload: AddGroupMembersPayload,
  ): Promise<ApiResponse<ConversationDetail>> {
    return apiClient.post<
      ApiResponse<ConversationDetail>,
      ApiResponse<ConversationDetail>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${payload.conversationId}/members`,
      { memberIds: payload.memberIds },
    );
  }

  async removeMember(
    payload: RemoveGroupMemberPayload,
  ): Promise<ApiResponse<ConversationDetail>> {
    return apiClient.delete<
      ApiResponse<ConversationDetail>,
      ApiResponse<ConversationDetail>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${payload.conversationId}/members/${payload.userId}`,
    );
  }

  async transferOwnership(
    payload: TransferGroupOwnershipPayload,
  ): Promise<ApiResponse<ConversationDetail>> {
    return apiClient.post<
      ApiResponse<ConversationDetail>,
      ApiResponse<ConversationDetail>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${payload.conversationId}/transfer-owner`,
      { newOwnerId: payload.newOwnerId },
    );
  }

  async leaveGroup(
    payload: LeaveGroupPayload,
  ): Promise<ApiResponse<GroupActionResponse>> {
    return apiClient.post<
      ApiResponse<GroupActionResponse>,
      ApiResponse<GroupActionResponse>
    >(
      `${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${payload.conversationId}/leave`,
      { newOwnerId: payload.newOwnerId },
    );
  }

  async dissolveGroup(
    payload: DissolveGroupPayload,
  ): Promise<ApiResponse<GroupActionResponse>> {
    return apiClient.delete<
      ApiResponse<GroupActionResponse>,
      ApiResponse<GroupActionResponse>
    >(`${CORE_CONSTANTS.API_ENDPOINTS.CONVERSATIONS}/${payload.conversationId}`);
  }
}

export const conversationRepository = new ConversationRepository();
