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
    try {
      const response = await this.repository.checkHealth();
      return response.data;
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const systemService = new SystemService();

