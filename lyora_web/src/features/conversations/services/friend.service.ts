import {
  friendRepository,
  type IFriendRepository,
} from '../repositories/friend.repository';
import type { FriendUser } from '../types/friend.types';

export class FriendService {
  private readonly repository: IFriendRepository;

  constructor(repository: IFriendRepository = friendRepository) {
    this.repository = repository;
  }

  async getFriends(): Promise<FriendUser[]> {
    const response = await this.repository.getFriends();
    return response.data ?? [];
  }
}

export const friendService = new FriendService();
