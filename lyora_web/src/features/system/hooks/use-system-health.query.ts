import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { systemService } from '../services/system.service';
import type { HealthStatus } from '../types/system.types';
import { systemKeys } from './system.keys';

export type UseSystemHealthOptions = Omit<
  UseQueryOptions<HealthStatus, unknown, HealthStatus, readonly ['system', 'health']>,
  'queryKey' | 'queryFn'
>;

/**
 * Data Layer TanStack Query Hook for System Health Status.
 * Queries health check and provides default 10 minutes cache.
 */
export function useSystemHealthQuery(options?: UseSystemHealthOptions) {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: () => systemService.getHealthStatus(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

