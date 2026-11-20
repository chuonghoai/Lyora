import { useQuery } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { ConversationQueryParams } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useConversationsQuery(params?: ConversationQueryParams) {
  return useQuery({
    queryKey: conversationKeys.list(params),
    queryFn: () => conversationService.getConversations(params),
    staleTime: 10 * 1000,
  });
}
