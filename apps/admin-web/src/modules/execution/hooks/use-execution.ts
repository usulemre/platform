'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { executionAdminService } from '../application/container';
import type { ExecutionQuery } from '../domain/query';
import type { PlannerInput } from '../data/planner';

/** Server-state hooks for the Execution UI. They call the application service only — never a
 *  repository, the service tier, a broker, an exchange, a credential, or persistence. */
export function useExecutions(query: ExecutionQuery = {}) {
  return useQuery({
    queryKey: ['execution', 'list', query],
    queryFn: () => executionAdminService.listExecutions(query),
  });
}
export function useExecution(id: string) {
  return useQuery({
    queryKey: ['execution', 'detail', id],
    queryFn: () => executionAdminService.getExecution(id),
    enabled: id.length > 0,
  });
}
export function useExecutionSummary() {
  return useQuery({
    queryKey: ['execution', 'summary'],
    queryFn: () => executionAdminService.getSummary(),
  });
}
export function useExecutionMetrics() {
  return useQuery({
    queryKey: ['execution', 'metrics'],
    queryFn: () => executionAdminService.getMetrics(),
  });
}
export function useExecutionHealth() {
  return useQuery({
    queryKey: ['execution', 'health'],
    queryFn: () => executionAdminService.getHealth(),
  });
}
export function useExecutionTimeline() {
  return useQuery({
    queryKey: ['execution', 'timeline'],
    queryFn: () => executionAdminService.getTimeline(),
  });
}
export function useExecutionAudit() {
  return useQuery({
    queryKey: ['execution', 'audit'],
    queryFn: () => executionAdminService.getAudit(),
  });
}
export function useExecutionReplay(id: string) {
  return useQuery({
    queryKey: ['execution', 'replay', id],
    queryFn: () => executionAdminService.getReplay(id),
    enabled: id.length > 0,
  });
}
export function useExecutionRefs() {
  return useQuery({
    queryKey: ['execution', 'refs'],
    queryFn: () => executionAdminService.listRefs(),
  });
}
export function usePolicies() {
  return useQuery({
    queryKey: ['execution', 'policies'],
    queryFn: () => executionAdminService.listPolicies(),
  });
}
export function useVenues() {
  return useQuery({
    queryKey: ['execution', 'venues'],
    queryFn: () => executionAdminService.listVenues(),
  });
}
export function useSessions() {
  return useQuery({
    queryKey: ['execution', 'sessions'],
    queryFn: () => executionAdminService.listSessions(),
  });
}
export function usePlanPreview() {
  return useMutation({
    mutationFn: (input: PlannerInput) => Promise.resolve(executionAdminService.planPreview(input)),
  });
}
