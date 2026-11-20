import {
  conversationRepository,
  type IConversationRepository,
} from '../repositories/conversation.repository';
import type {
  ConversationDetail,
  ConversationQueryParams,
  ConversationSummary,
  CreateDirectConversationPayload,
  CreateGroupConversationPayload,
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
}

export const conversationService = new ConversationService();
