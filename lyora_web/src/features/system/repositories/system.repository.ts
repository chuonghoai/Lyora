import { apiClient, CORE_CONSTANTS, type ApiResponse } from '@/core';
import type { HealthStatus } from '../types/system.types';

export interface ISystemRepository {
  checkHealth(): Promise<ApiResponse<HealthStatus>>;
}

export class SystemRepository implements ISystemRepository {
  async checkHealth(): Promise<ApiResponse<HealthStatus>> {
    return apiClient.get<ApiResponse<HealthStatus>, ApiResponse<HealthStatus>>(
      CORE_CONSTANTS.API_ENDPOINTS.HEALTH,
    );
  }
}

export const systemRepository = new SystemRepository();

