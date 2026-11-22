import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { AddGroupMembersPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useAddGroupMembersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddGroupMembersPayload) =>
      conversationService.addGroupMembers(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(data.id),
      });
    },
  });
}
