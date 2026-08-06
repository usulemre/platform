'use client';

import { useQuery } from '@tanstack/react-query';
import { executionService } from '../application/container';
import type { ExecutionQuery } from '../domain/query';

/** Server-state hooks for execution requests. They call the application service
 *  only — never a repository or transport directly. */
export function useExecutionRequests(query: ExecutionQuery) {
  return useQuery({
    queryKey: ['executions', 'list', query],
    queryFn: () => executionService.listRequests(query),
  });
}

export function useExecutionRequest(id: string) {
  return useQuery({
    queryKey: ['executions', 'detail', id],
    queryFn: () => executionService.getRequest(id),
    enabled: id.length > 0,
  });
}

export function useExecutionSummary() {
  return useQuery({
    queryKey: ['executions', 'summary'],
    queryFn: () => executionService.getSummary(),
  });
}
