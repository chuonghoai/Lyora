import { apiClient, CORE_CONSTANTS, type ApiResponse, webSocketService } from '@/core';
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
    await webSocketService.request('friend.request.send', { userId });
    return { success: true, data: undefined };
  }

  async acceptRequest(userId: string): Promise<ApiResponse<void>> {
    await webSocketService.request('friend.request.accept', { userId });
    return { success: true, data: undefined };
  }

  async removeRequest(userId: string): Promise<ApiResponse<void>> {
    await webSocketService.request('friend.request.remove', { userId });
    return { success: true, data: undefined };
  }

  async unfriend(userId: string): Promise<ApiResponse<void>> {
    await webSocketService.request('friend.remove', { userId });
    return { success: true, data: undefined };
  }
}

export const friendsRepository = new FriendsRepository();
