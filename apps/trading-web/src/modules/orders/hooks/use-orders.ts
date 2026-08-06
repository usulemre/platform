'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersAdminService } from '../application/container';
import type { OrderQuery } from '../domain/query';

/** Server-state hooks for the Orders UI. They call the application service only — never a repository,
 *  the service tier, a broker, an exchange, a credential, or persistence. */
export function useOrders(query: OrderQuery = {}) {
  return useQuery({
    queryKey: ['orders', 'list', query],
    queryFn: () => ordersAdminService.listOrders(query),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => ordersAdminService.getOrder(id),
    enabled: id.length > 0,
  });
}

export function useOrdersSummary() {
  return useQuery({
    queryKey: ['orders', 'summary'],
    queryFn: () => ordersAdminService.getSummary(),
  });
}

export function useOrderMetrics() {
  return useQuery({
    queryKey: ['orders', 'metrics'],
    queryFn: () => ordersAdminService.getMetrics(),
  });
}

export function useOrderHealth() {
  return useQuery({
    queryKey: ['orders', 'health'],
    queryFn: () => ordersAdminService.getHealth(),
  });
}

export function useOrderTimeline() {
  return useQuery({
    queryKey: ['orders', 'timeline'],
    queryFn: () => ordersAdminService.getTimeline(),
  });
}

export function useOrderAudit() {
  return useQuery({ queryKey: ['orders', 'audit'], queryFn: () => ordersAdminService.getAudit() });
}

export function useOrderReplay(id: string) {
  return useQuery({
    queryKey: ['orders', 'replay', id],
    queryFn: () => ordersAdminService.getReplay(id),
    enabled: id.length > 0,
  });
}

export function useOrderRefs() {
  return useQuery({ queryKey: ['orders', 'refs'], queryFn: () => ordersAdminService.listRefs() });
}
