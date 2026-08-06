'use client';

import { useQuery } from '@tanstack/react-query';
import { executionSimulatorAdminService } from '../application/container';
import type { SessionQuery } from '../domain/query';

/** Server-state hooks for the Execution Simulator UI. They call the application service
 *  only — never a repository, the service tier, a broker, an exchange, a simulator, or
 *  persistence. */
export function useExecutionSummary() {
  return useQuery({
    queryKey: ['execution-simulator', 'summary'],
    queryFn: () => executionSimulatorAdminService.getSummary(),
  });
}

export function useSessions(query: SessionQuery) {
  return useQuery({
    queryKey: ['execution-simulator', 'sessions', query],
    queryFn: () => executionSimulatorAdminService.listSessions(query),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['execution-simulator', 'session', id],
    queryFn: () => executionSimulatorAdminService.getSession(id),
    enabled: id.length > 0,
  });
}

export function useSessionFamilies() {
  return useQuery({
    queryKey: ['execution-simulator', 'families'],
    queryFn: () => executionSimulatorAdminService.listFamilies(),
  });
}

export function useScenarioTemplates() {
  return useQuery({
    queryKey: ['execution-simulator', 'templates'],
    queryFn: () => executionSimulatorAdminService.listTemplates(),
  });
}

export function useExecutionQueue() {
  return useQuery({
    queryKey: ['execution-simulator', 'execution-queue'],
    queryFn: () => executionSimulatorAdminService.getExecutionQueue(),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: ['execution-simulator', 'review-queue'],
    queryFn: () => executionSimulatorAdminService.getReviewQueue(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['execution-simulator', 'approval-queue'],
    queryFn: () => executionSimulatorAdminService.getApprovalQueue(),
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ['execution-simulator', 'history'],
    queryFn: () => executionSimulatorAdminService.getHistory(),
  });
}

export function useReports() {
  return useQuery({
    queryKey: ['execution-simulator', 'reports'],
    queryFn: () => executionSimulatorAdminService.getReports(),
  });
}

export function useComparisons() {
  return useQuery({
    queryKey: ['execution-simulator', 'comparisons'],
    queryFn: () => executionSimulatorAdminService.listComparisons(),
  });
}

export function useComparison(id: string) {
  return useQuery({
    queryKey: ['execution-simulator', 'comparison', id],
    queryFn: () => executionSimulatorAdminService.getComparison(id),
    enabled: id.length > 0,
  });
}
