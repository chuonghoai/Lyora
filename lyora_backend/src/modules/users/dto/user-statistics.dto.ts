import { User } from '../entities/user.entity';

export class UserStatisticsDto {
  totalUsers: number;
  clientCount: number;
  adminCount: number;
  activeCount: number;
  inactiveCount: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  recentUsers: User[];
}
