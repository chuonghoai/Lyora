import { UserRole } from '../../../common/enums/role.enum';
import { ProfileFriendPreviewDto } from './public-profile-response.dto';

export interface AdminUserDetailResponseDto {
  id: string;
  email: string;
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
  isActive: boolean;
  isOnline: boolean;
  lockReason: string | null;
  lockedAt: Date | null;
  createdAt: Date;
  friendsCount: number;
  friendsPreview: ProfileFriendPreviewDto[];
}

export interface AdminUsersSummaryCountsDto {
  all: number;
  client: number;
  admin: number;
  active: number;
  locked: number;
  online: number;
}
