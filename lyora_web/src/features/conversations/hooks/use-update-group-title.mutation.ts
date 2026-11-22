import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { UpdateGroupTitlePayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useUpdateGroupTitleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroupTitlePayload) =>
      conversationService.updateGroupTitle(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(data.id),
      });
    },
  });
}
