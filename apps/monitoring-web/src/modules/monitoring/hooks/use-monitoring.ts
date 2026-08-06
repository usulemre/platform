'use client';

import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '../application/container';
import type { ServiceQuery } from '../domain/query';

/** Server-state hooks for monitoring. They call the application service only —
 *  never a repository or transport directly. Each hook reads one operational
 *  slice exposed by the platform services. */
export function useOverview() {
  return useQuery({
    queryKey: ['monitoring', 'overview'],
    queryFn: () => monitoringService.getOverview(),
  });
}

export function useServices(query: ServiceQuery) {
  return useQuery({
    queryKey: ['monitoring', 'services', query],
    queryFn: () => monitoringService.getServices(query),
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['monitoring', 'workflows'],
    queryFn: () => monitoringService.getWorkflows(),
  });
}

export function useExecutions() {
  return useQuery({
    queryKey: ['monitoring', 'executions'],
    queryFn: () => monitoringService.getExecutions(),
  });
}

export function useValidations() {
  return useQuery({
    queryKey: ['monitoring', 'validations'],
    queryFn: () => monitoringService.getValidations(),
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: ['monitoring', 'datasets'],
    queryFn: () => monitoringService.getDatasets(),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['monitoring', 'agents'],
    queryFn: () => monitoringService.getAgents(),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['monitoring', 'alerts'],
    queryFn: () => monitoringService.getAlerts(),
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: ['monitoring', 'incidents'],
    queryFn: () => monitoringService.getIncidents(),
  });
}

export function useMetrics() {
  return useQuery({
    queryKey: ['monitoring', 'metrics'],
    queryFn: () => monitoringService.getMetrics(),
  });
}

export function useAuditEvents() {
  return useQuery({
    queryKey: ['monitoring', 'audit'],
    queryFn: () => monitoringService.getAuditEvents(),
  });
}
