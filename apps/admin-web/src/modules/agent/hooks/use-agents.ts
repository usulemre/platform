'use client';

import { useQuery } from '@tanstack/react-query';
import { agentService } from '../application/container';
import type { AgentQuery } from '../domain/query';

/** Server-state hooks for agents. They call the application service only — never
 *  a repository or transport directly. */
export function useAgents(query: AgentQuery) {
  return useQuery({
    queryKey: ['agents', 'list', query],
    queryFn: () => agentService.listAgents(query),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', 'detail', id],
    queryFn: () => agentService.getAgent(id),
    enabled: id.length > 0,
  });
}

export function useAgentSummary() {
  return useQuery({
    queryKey: ['agents', 'summary'],
    queryFn: () => agentService.getSummary(),
  });
}
