import { userRepository, type IUserRepository } from '../repositories/user.repository';
import type {
  UpdateUserProfilePayload,
  UserProfile,
  UserRole,
  UserStatistics,
} from '../types/user.types';

export interface IUserService {
  getProfile(): Promise<UserProfile>;
  updateProfile(payload: UpdateUserProfilePayload): Promise<UserProfile>;
  getStatistics(role?: UserRole): Promise<UserStatistics>;
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

  async updateProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
    const response = await this.repository.updateProfile(payload);
    return response.data;
  }

  async getStatistics(role?: UserRole): Promise<UserStatistics> {
    const response = await this.repository.getStatistics(role);
    return response.data;
  }
}

export const userService = new UserService();

