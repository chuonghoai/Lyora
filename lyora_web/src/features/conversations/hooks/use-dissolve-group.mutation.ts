import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { DissolveGroupPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useDissolveGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DissolveGroupPayload) =>
      conversationService.dissolveGroup(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(variables.conversationId),
      });
    },
  });
}
