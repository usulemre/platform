'use client';

import { useQuery } from '@tanstack/react-query';
import { riskService } from '../application/container';
import type { RiskQuery } from '../domain/query';

/** Server-state hooks for risk assessments. They call the application service
 *  only — never a repository or transport directly. */
export function useRiskAssessments(query: RiskQuery) {
  return useQuery({
    queryKey: ['risk', 'list', query],
    queryFn: () => riskService.listAssessments(query),
  });
}

export function useRiskAssessment(id: string) {
  return useQuery({
    queryKey: ['risk', 'detail', id],
    queryFn: () => riskService.getAssessment(id),
    enabled: id.length > 0,
  });
}

export function useRiskSummary() {
  return useQuery({
    queryKey: ['risk', 'summary'],
    queryFn: () => riskService.getSummary(),
  });
}
