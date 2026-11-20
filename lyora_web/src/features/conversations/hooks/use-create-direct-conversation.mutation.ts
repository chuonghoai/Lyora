import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { CreateDirectConversationPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useCreateDirectConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDirectConversationPayload) =>
      conversationService.createDirectConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
