import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
import type { FriendDiscoveryItem, FriendSearchResult } from '../types/friend.types';

export interface IFriendsRepository {
  getAcceptedFriends(): Promise<ApiResponse<FriendDiscoveryItem[]>>;
  search(query: string): Promise<ApiResponse<FriendSearchResult>>;
  getReceivedRequests(): Promise<ApiResponse<FriendDiscoveryItem[]>>;
  sendRequest(userId: string): Promise<ApiResponse<void>>;
  acceptRequest(userId: string): Promise<ApiResponse<void>>;
  removeRequest(userId: string): Promise<ApiResponse<void>>;
  unfriend(userId: string): Promise<ApiResponse<void>>;
}

export class FriendsRepository implements IFriendsRepository {
  async getAcceptedFriends(): Promise<ApiResponse<FriendDiscoveryItem[]>> {
    return apiClient.get<ApiResponse<FriendDiscoveryItem[]>, ApiResponse<FriendDiscoveryItem[]>>(
      CORE_CONSTANTS.API_ENDPOINTS.FRIENDS,
    );
  }

  async search(query: string): Promise<ApiResponse<FriendSearchResult>> {
    return apiClient.get<ApiResponse<FriendSearchResult>, ApiResponse<FriendSearchResult>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.FRIENDS}/search`,
      { params: { q: query.trim(), page: 1, limit: 12 } },
    );
  }

  async getReceivedRequests(): Promise<ApiResponse<FriendDiscoveryItem[]>> {
    return apiClient.get<ApiResponse<FriendDiscoveryItem[]>, ApiResponse<FriendDiscoveryItem[]>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.FRIENDS}/requests/received`,
    );
  }

  async sendRequest(userId: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>, ApiResponse<void>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.FRIENDS}/${encodeURIComponent(userId)}/requests`,
    );
  }

  async acceptRequest(userId: string): Promise<ApiResponse<void>> {
    return apiClient.patch<ApiResponse<void>, ApiResponse<void>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.FRIENDS}/${encodeURIComponent(userId)}/requests/accept`,
    );
  }

  async removeRequest(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>, ApiResponse<void>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.FRIENDS}/${encodeURIComponent(userId)}/requests`,
    );
  }

  async unfriend(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>, ApiResponse<void>>(
      `${CORE_CONSTANTS.API_ENDPOINTS.FRIENDS}/${encodeURIComponent(userId)}`,
    );
  }
}

export const friendsRepository = new FriendsRepository();
