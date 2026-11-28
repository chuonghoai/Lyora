import type { PaginationMeta } from '@/core';
import { userRepository, type IUserRepository } from '../repositories/user.repository';
import type {
  AdminOnlineStatusResponse,
  AdminUserDetail,
  AdminUsersListResult,
  AdminUsersQueryParams,
  AdminUsersSummaryCounts,
  AdminUserSummaryItem,
  CreateAdminUserPayload,
  LockUserPayload,
  UpdateUserProfilePayload,
  UserProfile,
  UserRole,
  UserStatistics,
} from '../types/user.types';

export interface IUserService {
  getProfile(): Promise<UserProfile>;
  updateProfile(payload: UpdateUserProfilePayload): Promise<UserProfile>;
  getStatistics(role?: UserRole): Promise<UserStatistics>;
  getAdminUsers(params: AdminUsersQueryParams): Promise<AdminUsersListResult>;
  getUsersOnlineStatus(ids: string[]): Promise<AdminOnlineStatusResponse>;
  getAdminUserDetail(userId: string): Promise<AdminUserDetail>;
  createUser(payload: CreateAdminUserPayload): Promise<AdminUserSummaryItem>;
  lockUser(userId: string, payload: LockUserPayload): Promise<AdminUserSummaryItem>;
  unlockUser(userId: string): Promise<AdminUserSummaryItem>;
}

const EMPTY_SUMMARY: AdminUsersSummaryCounts = {
  all: 0,
  client: 0,
  admin: 0,
  active: 0,
  locked: 0,
  online: 0,
};

export class UserService implements IUserService {
  private repository: IUserRepository;

  constructor(repository: IUserRepository = userRepository) {
    this.repository = repository;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.repository.getProfile();
    return response.data;
  }

  async updateProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
    const response = await this.repository.updateProfile(payload);
    return response.data;
  }

  async getStatistics(role?: UserRole): Promise<UserStatistics> {
    const response = await this.repository.getStatistics(role);
    return response.data;
  }

  async getAdminUsers(params: AdminUsersQueryParams): Promise<AdminUsersListResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = await this.repository.getAdminUsers({
      ...params,
      page,
      limit,
      search: params.search?.trim() || undefined,
    });

    const items = response.data?.items ?? [];
    const fallbackMeta: PaginationMeta = {
      page,
      limit,
      totalItems: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: page > 1,
    };

    return {
      items,
      meta: response.meta ?? fallbackMeta,
      summary: response.data?.summary ?? EMPTY_SUMMARY,
    };
  }

  async getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
    const response = await this.repository.getAdminUserDetail(userId.trim());
    return response.data;
  }

  async getUsersOnlineStatus(ids: string[]): Promise<AdminOnlineStatusResponse> {
    const cleanIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (cleanIds.length === 0) {
      return {
        statuses: {},
        onlineCount: 0,
        checkedAt: new Date().toISOString(),
      };
    }

    const response = await this.repository.getUsersOnlineStatus(cleanIds);
    return response.data;
  }

  async lockUser(
    userId: string,
    payload: LockUserPayload,
  ): Promise<AdminUserSummaryItem> {
    const response = await this.repository.lockUser(userId.trim(), {
      reason: payload.reason.trim(),
    });
    return response.data;
  }

  async unlockUser(userId: string): Promise<AdminUserSummaryItem> {
    const response = await this.repository.unlockUser(userId.trim());
    return response.data;
  }

  async createUser(payload: CreateAdminUserPayload): Promise<AdminUserSummaryItem> {
    const response = await this.repository.createUser({
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role,
    });
    return response.data;
  }
}

export const userService = new UserService();

