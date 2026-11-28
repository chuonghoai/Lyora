import { friendsRepository, type IFriendsRepository } from '../repositories/friends.repository';
import type { FriendDiscoveryItem, FriendSearchResult } from '../types/friend.types';

export interface IFriendsService {
  getAcceptedFriends(): Promise<FriendDiscoveryItem[]>;
  getSuggestions(): Promise<FriendDiscoveryItem[]>;
  search(query: string): Promise<FriendSearchResult>;
  getReceivedRequests(): Promise<FriendDiscoveryItem[]>;
  sendRequest(userId: string): Promise<void>;
  acceptRequest(userId: string): Promise<void>;
  removeRequest(userId: string): Promise<void>;
  unfriend(userId: string): Promise<void>;
}

export class FriendsService implements IFriendsService {
  private readonly repository: IFriendsRepository;

  constructor(repository: IFriendsRepository = friendsRepository) {
    this.repository = repository;
  }

  async search(query: string): Promise<FriendSearchResult> {
    return (await this.repository.search(query)).data;
  }

  async getAcceptedFriends(): Promise<FriendDiscoveryItem[]> {
    return (await this.repository.getAcceptedFriends()).data;
  }

  async getSuggestions(): Promise<FriendDiscoveryItem[]> {
    return (await this.repository.getSuggestions()).data;
  }

  async getReceivedRequests(): Promise<FriendDiscoveryItem[]> {
    return (await this.repository.getReceivedRequests()).data;
  }

  async sendRequest(userId: string): Promise<void> {
    await this.repository.sendRequest(userId);
  }

  async acceptRequest(userId: string): Promise<void> {
    await this.repository.acceptRequest(userId);
  }

  async removeRequest(userId: string): Promise<void> {
    await this.repository.removeRequest(userId);
  }

  async unfriend(userId: string): Promise<void> {
    await this.repository.unfriend(userId);
  }
}

export const friendsService = new FriendsService();
