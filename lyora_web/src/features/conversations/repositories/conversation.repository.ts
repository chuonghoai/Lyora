import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
import type {
  ConversationDetail,
  ConversationQueryParams,
  ConversationSummary,
  CreateDirectConversationPayload,
  CreateGroupConversationPayload,
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
}

export const conversationRepository = new ConversationRepository();
