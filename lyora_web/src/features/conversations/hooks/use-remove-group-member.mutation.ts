import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { RemoveGroupMemberPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemoveGroupMemberPayload) =>
      conversationService.removeMember(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(data.id),
      });
    },
  });
}
