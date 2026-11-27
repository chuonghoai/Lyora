export type FriendshipStatus = 'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export interface FriendDiscoveryItem {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  workplace: string | null;
  location: string | null;
  friendshipStatus: FriendshipStatus;
  isOnline?: boolean;
}

export interface FriendSearchResult {
  items: FriendDiscoveryItem[];
  totalItems: number;
}
