import { useQuery } from '@tanstack/react-query';
import { friendService } from '../services/friend.service';
import { conversationKeys } from './conversation.keys';

export function useConversationFriendsQuery() {
  return useQuery({
    queryKey: conversationKeys.friends(),
    queryFn: () => friendService.getFriends(),
    staleTime: 5 * 60 * 1000,
  });
}

export const useFriendsQuery = useConversationFriendsQuery;
