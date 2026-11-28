import { systemRepository, type ISystemRepository } from '../repositories/system.repository';
import type { HealthStatus } from '../types/system.types';

export interface ISystemService {
  getHealthStatus(): Promise<HealthStatus>;
}

export class SystemService implements ISystemService {
  private repository: ISystemRepository;

  constructor(repository: ISystemRepository = systemRepository) {
    this.repository = repository;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const response = await this.repository.checkHealth();
    return response.data;
  }
}

export const systemService = new SystemService();
