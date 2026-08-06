'use client';

import { useQuery } from '@tanstack/react-query';
import { signalService } from '../application/container';
import type { SignalQuery } from '../domain/query';

/** Server-state hooks for signals. They call the application service only —
 *  never a repository or transport directly. */
export function useSignals(query: SignalQuery) {
  return useQuery({
    queryKey: ['signals', 'list', query],
    queryFn: () => signalService.listSignals(query),
  });
}

export function useSignal(id: string) {
  return useQuery({
    queryKey: ['signals', 'detail', id],
    queryFn: () => signalService.getSignal(id),
    enabled: id.length > 0,
  });
}

export function useSignalSummary() {
  return useQuery({
    queryKey: ['signals', 'summary'],
    queryFn: () => signalService.getSummary(),
  });
}
