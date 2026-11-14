import { userRepository, type IUserRepository } from '../repositories/user.repository';
import type { UserProfile } from '../types/user.types';

export interface IUserService {
  getProfile(): Promise<UserProfile>;
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
}

export const userService = new UserService();

