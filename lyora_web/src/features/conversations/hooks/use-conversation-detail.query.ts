import { useQuery } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import { conversationKeys } from './conversation.keys';

export function useConversationDetailQuery(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ''),
    queryFn: () => conversationService.getConversationDetail(id!),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
  });
}
