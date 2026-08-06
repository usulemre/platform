'use client';

import { useQuery } from '@tanstack/react-query';
import { liveTradingAdminService } from '../application/container';
import type { DeploymentQuery } from '../domain/query';

/** Server-state hooks for the Live Trading Platform UI. They call the application service
 *  only — never a repository, the service tier, a broker, an exchange, a credential, or
 *  persistence. */
export function useTradingSummary() {
  return useQuery({
    queryKey: ['live-trading', 'summary'],
    queryFn: () => liveTradingAdminService.getSummary(),
  });
}

export function useDeployments(query: DeploymentQuery) {
  return useQuery({
    queryKey: ['live-trading', 'deployments', query],
    queryFn: () => liveTradingAdminService.listDeployments(query),
  });
}

export function useDeployment(id: string) {
  return useQuery({
    queryKey: ['live-trading', 'deployment', id],
    queryFn: () => liveTradingAdminService.getDeployment(id),
    enabled: id.length > 0,
  });
}

export function useFamilies() {
  return useQuery({
    queryKey: ['live-trading', 'families'],
    queryFn: () => liveTradingAdminService.listFamilies(),
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ['live-trading', 'accounts'],
    queryFn: () => liveTradingAdminService.listAccounts(),
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ['live-trading', 'connections'],
    queryFn: () => liveTradingAdminService.listConnections(),
  });
}

export function useProviders() {
  return useQuery({
    queryKey: ['live-trading', 'providers'],
    queryFn: () => liveTradingAdminService.listProviders(),
  });
}

export function useRunningStrategies() {
  return useQuery({
    queryKey: ['live-trading', 'running'],
    queryFn: () => liveTradingAdminService.getRunningStrategies(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['live-trading', 'approval-queue'],
    queryFn: () => liveTradingAdminService.getApprovalQueue(),
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ['live-trading', 'history'],
    queryFn: () => liveTradingAdminService.getHistory(),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['live-trading', 'orders'],
    queryFn: () => liveTradingAdminService.getOrders(),
  });
}

export function useOpenPositions() {
  return useQuery({
    queryKey: ['live-trading', 'open-positions'],
    queryFn: () => liveTradingAdminService.getOpenPositions(),
  });
}

export function useClosedPositions() {
  return useQuery({
    queryKey: ['live-trading', 'closed-positions'],
    queryFn: () => liveTradingAdminService.getClosedPositions(),
  });
}

export function useBalances() {
  return useQuery({
    queryKey: ['live-trading', 'balances'],
    queryFn: () => liveTradingAdminService.getBalances(),
  });
}

export function useHealthOverview() {
  return useQuery({
    queryKey: ['live-trading', 'health'],
    queryFn: () => liveTradingAdminService.getHealthOverview(),
  });
}

export function useTimeline() {
  return useQuery({
    queryKey: ['live-trading', 'timeline'],
    queryFn: () => liveTradingAdminService.getTimeline(),
  });
}

export function useAudit() {
  return useQuery({
    queryKey: ['live-trading', 'audit'],
    queryFn: () => liveTradingAdminService.getAudit(),
  });
}

export function useMetricsOverview() {
  return useQuery({
    queryKey: ['live-trading', 'metrics'],
    queryFn: () => liveTradingAdminService.getMetricsOverview(),
  });
}

export function useEmergencyControls() {
  return useQuery({
    queryKey: ['live-trading', 'emergency'],
    queryFn: () => liveTradingAdminService.getEmergencyControls(),
  });
}
