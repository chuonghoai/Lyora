import { userRepository, type IUserRepository } from '../repositories/user.repository';
import type { UserProfile, UserStatistics } from '../types/user.types';

export interface IUserService {
  getProfile(): Promise<UserProfile>;
  getStatistics(): Promise<UserStatistics>;
}

export class UserService implements IUserService {
  private repository: IUserRepository;

  constructor(repository: IUserRepository = userRepository) {
    this.repository = repository;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.repository.getProfile();
    return response.data;
  }

  async getStatistics(): Promise<UserStatistics> {
    const response = await this.repository.getStatistics();
    return response.data;
  }
}

export const userService = new UserService();

