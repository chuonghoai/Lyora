export class FriendResponseDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  workplace: string | null;
  location: string | null;
  friendshipStatus: 'FRIEND';
  isOnline: boolean;
}
