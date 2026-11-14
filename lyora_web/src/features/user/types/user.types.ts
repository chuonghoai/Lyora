import type { UserProfile, UserRole } from '@/core';

export interface RecentUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UserStatistics {
  totalUsers: number;
  clientCount: number;
  adminCount: number;
  staffCount: number;
  activeCount: number;
  inactiveCount: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  recentUsers: RecentUserSummary[];
}

export type { UserProfile, UserRole };


