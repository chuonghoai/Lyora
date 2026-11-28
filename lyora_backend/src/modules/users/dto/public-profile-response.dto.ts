import { UserRole } from '../../../common/enums/role.enum';
import type { ProfileMediaViolationDto } from './flag-profile-media-violation.dto';

export type PublicProfileFriendshipStatus =
  'SELF' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';

export interface ProfileFriendPreviewDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  avatarViolation?: ProfileMediaViolationDto | null;
  headline: string | null;
  location: string | null;
  mutualFriendsCount: number;
  friendshipStatus: Exclude<PublicProfileFriendshipStatus, 'SELF'>;
  isOnline: boolean;
}

export interface PublicProfileResponseDto {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  phoneNumber: string | null;
  bio: string | null;
  location: string | null;
  hometown: string | null;
  workplace: string | null;
  education: string | null;
  website: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  avatarViolation?: ProfileMediaViolationDto | null;
  coverViolation?: ProfileMediaViolationDto | null;
  isActive: boolean;
  isOnline: boolean;
  createdAt: Date;
  friendshipStatus: PublicProfileFriendshipStatus;
  friendsCount: number;
  mutualFriendsCount: number;
  friendsPreview: ProfileFriendPreviewDto[];
}

export interface ProfileMediaUploadResponseDto {
  url: string;
  publicId: string;
  format?: string;
  size: number;
}
