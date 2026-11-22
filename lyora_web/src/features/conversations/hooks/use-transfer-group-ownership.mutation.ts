import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversation.service';
import type { TransferGroupOwnershipPayload } from '../types/conversation.types';
import { conversationKeys } from './conversation.keys';

export function useTransferGroupOwnershipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferGroupOwnershipPayload) =>
      conversationService.transferOwnership(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(data.id),
      });
    },
  });
}
