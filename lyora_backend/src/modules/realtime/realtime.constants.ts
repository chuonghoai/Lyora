export const REALTIME_FRIENDS_SERVICE = 'REALTIME_FRIENDS_SERVICE';

export interface RealtimeFriendsService {
  sendRequest(currentUserId: string, targetUserId: string): Promise<void>;
  acceptRequest(currentUserId: string, requesterId: string): Promise<void>;
  removeRequest(currentUserId: string, targetUserId: string): Promise<void>;
  unfriend(currentUserId: string, targetUserId: string): Promise<void>;
}
