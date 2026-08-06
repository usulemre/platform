'use client';

import { useQuery } from '@tanstack/react-query';
import { auditService } from '../application/container';
import type { AuditQuery } from '../domain/query';

/** Server-state hooks for the Audit Center. They call the application service
 *  only — never a repository or transport directly. */
export function useAuditEvents(query: AuditQuery) {
  return useQuery({
    queryKey: ['audit', 'events', query],
    queryFn: () => auditService.listEvents(query),
  });
}

export function useAuditEvent(id: string) {
  return useQuery({
    queryKey: ['audit', 'event', id],
    queryFn: () => auditService.getEvent(id),
    enabled: id.length > 0,
  });
}

export function useAuditSummary() {
  return useQuery({ queryKey: ['audit', 'summary'], queryFn: () => auditService.getSummary() });
}
