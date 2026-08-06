'use client';

import { useQuery } from '@tanstack/react-query';
import { signalEngineAdminService } from '../application/container';
import type { SignalQuery } from '../domain/query';

/** Server-state hooks for the Signal Engine UI. They call the application service
 *  only — never a repository, the service tier, a broker, or persistence. */
export function useSignalEngineSummary() {
  return useQuery({
    queryKey: ['signal-engine', 'summary'],
    queryFn: () => signalEngineAdminService.getSummary(),
  });
}

export function useSignals(query: SignalQuery) {
  return useQuery({
    queryKey: ['signal-engine', 'signals', query],
    queryFn: () => signalEngineAdminService.listSignals(query),
  });
}

export function useSignal(id: string) {
  return useQuery({
    queryKey: ['signal-engine', 'signal', id],
    queryFn: () => signalEngineAdminService.getSignal(id),
    enabled: id.length > 0,
  });
}

export function useSignalFamilies() {
  return useQuery({
    queryKey: ['signal-engine', 'families'],
    queryFn: () => signalEngineAdminService.listFamilies(),
  });
}

export function usePromotionQueue() {
  return useQuery({
    queryKey: ['signal-engine', 'promotion-queue'],
    queryFn: () => signalEngineAdminService.getPromotionQueue(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['signal-engine', 'approval-queue'],
    queryFn: () => signalEngineAdminService.getApprovalQueue(),
  });
}
