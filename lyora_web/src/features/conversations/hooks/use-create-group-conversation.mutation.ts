import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { CreateGroupConversationPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useCreateGroupConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupConversationPayload) =>
      conversationService.createGroupConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
