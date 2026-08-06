'use client';

import { useQuery } from '@tanstack/react-query';
import { gatewayViewService } from '../application/container';
import type { BrokerQuery } from '../domain/query';

/** Server-state hooks for the Broker Gateway UI. They call the application service only — never a
 *  repository, the service tier, an exchange, a broker, a credential, or persistence. */
export function useBrokers(query: BrokerQuery = {}) {
  return useQuery({
    queryKey: ['gw', 'brokers', query],
    queryFn: () => gatewayViewService.listBrokers(query),
  });
}
export function useBrokerRefs() {
  return useQuery({ queryKey: ['gw', 'refs'], queryFn: () => gatewayViewService.listRefs() });
}
export function useBrokerDetail(id: string) {
  return useQuery({
    queryKey: ['gw', 'detail', id],
    queryFn: () => gatewayViewService.getDetail(id),
    enabled: id.length > 0,
  });
}
export function useGatewaySummary() {
  return useQuery({ queryKey: ['gw', 'summary'], queryFn: () => gatewayViewService.getSummary() });
}
export function useConnectivity() {
  return useQuery({
    queryKey: ['gw', 'connectivity'],
    queryFn: () => gatewayViewService.connectivity(),
  });
}
export function useHealth() {
  return useQuery({ queryKey: ['gw', 'health'], queryFn: () => gatewayViewService.health() });
}
export function useConnections() {
  return useQuery({
    queryKey: ['gw', 'connections'],
    queryFn: () => gatewayViewService.connections(),
  });
}
export function useSessions() {
  return useQuery({ queryKey: ['gw', 'sessions'], queryFn: () => gatewayViewService.sessions() });
}
export function useGatewaySession() {
  return useQuery({
    queryKey: ['gw', 'gateway-session'],
    queryFn: () => gatewayViewService.gatewaySession(),
  });
}
export function useAccounts() {
  return useQuery({ queryKey: ['gw', 'accounts'], queryFn: () => gatewayViewService.accounts() });
}
export function usePositionSync() {
  return useQuery({
    queryKey: ['gw', 'position-sync'],
    queryFn: () => gatewayViewService.positionSync(),
  });
}
export function useBalanceSync() {
  return useQuery({
    queryKey: ['gw', 'balance-sync'],
    queryFn: () => gatewayViewService.balanceSync(),
  });
}
export function useOrderSync() {
  return useQuery({
    queryKey: ['gw', 'order-sync'],
    queryFn: () => gatewayViewService.orderSync(),
  });
}
export function useProviders() {
  return useQuery({ queryKey: ['gw', 'providers'], queryFn: () => gatewayViewService.providers() });
}
export function useCapabilityMatrix() {
  return useQuery({
    queryKey: ['gw', 'capabilities'],
    queryFn: () => Promise.resolve(gatewayViewService.capabilityMatrix()),
  });
}
export function useMetrics() {
  return useQuery({ queryKey: ['gw', 'metrics'], queryFn: () => gatewayViewService.metrics() });
}
export function useAudit() {
  return useQuery({ queryKey: ['gw', 'audit'], queryFn: () => gatewayViewService.audit() });
}
