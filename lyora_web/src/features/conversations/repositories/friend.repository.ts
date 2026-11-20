import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
import type { FriendUser } from '../types/friend.types';

export interface IFriendRepository {
  getFriends(): Promise<ApiResponse<FriendUser[]>>;
}

export class FriendRepository implements IFriendRepository {
  async getFriends(): Promise<ApiResponse<FriendUser[]>> {
    return apiClient.get<ApiResponse<FriendUser[]>, ApiResponse<FriendUser[]>>(
      CORE_CONSTANTS.API_ENDPOINTS.FRIENDS,
    );
  }
}

export const friendRepository = new FriendRepository();
