import type { UserProfile, UserRole } from '@/core';

export interface RecentUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type UserRoleFilter = 'ALL' | UserRole;

export interface UserStatistics {
  totalUsers: number;
  clientCount: number;
  adminCount: number;
  activeCount: number;
  inactiveCount: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  recentUsers: RecentUserSummary[];
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
}

export type ProfileFriendshipStatus =
  | 'SELF'
  | 'FRIEND'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED'
  | 'NONE';

export type ProfileTabKey = 'overview' | 'about' | 'friends';

export type ProfileActivityTabKey = 'tagged' | 'reacted' | 'saved' | 'authored';

export type ProfileActivityKind =
  | 'TAGGED'
  | 'SHARED_TO_ME'
  | 'REACTED'
  | 'SAVED'
  | 'AUTHORED';

export interface ProfileActivityItem {
  id: string;
  kind: ProfileActivityKind;
  contextLabel: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  content: string;
  mediaPreviewUrl?: string | null;
  mediaPreviewAlt?: string | null;
  visibility: 'PUBLIC' | 'FRIENDS';
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
}

export interface ProfileActivityFeed {
  tagged: ProfileActivityItem[];
  reacted: ProfileActivityItem[];
  saved: ProfileActivityItem[];
  authored: ProfileActivityItem[];
}

export type ProfileFriendsFilter = 'ALL' | 'MUTUAL' | 'REQUESTS' | 'SUGGESTIONS';

export interface ProfileFriendSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline?: string | null;
  location?: string | null;
  mutualFriendsCount: number;
  friendshipStatus: Exclude<ProfileFriendshipStatus, 'SELF'>;
  isOnline?: boolean;
}

export interface PublicUserProfile {
  id: string;
  email?: string | null;
  fullName: string;
  role: UserRole;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  hometown?: string | null;
  workplace?: string | null;
  education?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isActive: boolean;
  isOnline?: boolean;
  createdAt: string;
  friendshipStatus: ProfileFriendshipStatus;
  friendsCount: number;
  mutualFriendsCount: number;
  friendsPreview: ProfileFriendSummary[];
  isPreviewFallback?: boolean;
}

export interface UpdateExtendedProfilePayload extends UpdateUserProfilePayload {
  avatarUrl?: string | null;
  coverUrl?: string | null;
  hometown?: string | null;
  workplace?: string | null;
  education?: string | null;
  website?: string | null;
}

export interface ProfileCoverPreset {
  id: string;
  label: string;
  url: string;
}

export interface ProfileFriendsDirectory {
  friends: ProfileFriendSummary[];
  incomingRequests: ProfileFriendSummary[];
  sentRequests: ProfileFriendSummary[];
  suggestions: ProfileFriendSummary[];
}

export type { UserProfile, UserRole };


