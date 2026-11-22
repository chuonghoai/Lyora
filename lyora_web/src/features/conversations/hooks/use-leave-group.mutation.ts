import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { LeaveGroupPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useLeaveGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveGroupPayload) =>
      conversationService.leaveGroup(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(variables.conversationId),
      });
    },
  });
}
