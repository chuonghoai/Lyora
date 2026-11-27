export type FriendRelationshipStatus =
  'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export class FriendDiscoveryResponseDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  workplace: string | null;
  location: string | null;
  friendshipStatus: FriendRelationshipStatus;
}
