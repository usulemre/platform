'use client';

import { useQuery } from '@tanstack/react-query';
import { riskEngineAdminService } from '../application/container';
import type { RiskQuery } from '../domain/query';

/** Server-state hooks for the Risk Engine admin UI. They call the application service
 *  only — never a repository, the service tier, a broker, a risk model, or persistence. */
export function useRiskSummary() {
  return useQuery({
    queryKey: ['risk-engine', 'summary'],
    queryFn: () => riskEngineAdminService.getSummary(),
  });
}

export function useAssessments(query: RiskQuery) {
  return useQuery({
    queryKey: ['risk-engine', 'assessments', query],
    queryFn: () => riskEngineAdminService.listAssessments(query),
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ['risk-engine', 'assessment', id],
    queryFn: () => riskEngineAdminService.getAssessment(id),
    enabled: id.length > 0,
  });
}

export function useRiskPolicies() {
  return useQuery({
    queryKey: ['risk-engine', 'policies'],
    queryFn: () => riskEngineAdminService.listPolicies(),
  });
}

export function useRuleExplorer() {
  return useQuery({
    queryKey: ['risk-engine', 'rules'],
    queryFn: () => riskEngineAdminService.getRuleExplorer(),
  });
}

export function useLimitConfiguration() {
  return useQuery({
    queryKey: ['risk-engine', 'limits'],
    queryFn: () => riskEngineAdminService.getLimitConfiguration(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['risk-engine', 'approval-queue'],
    queryFn: () => riskEngineAdminService.getApprovalQueue(),
  });
}

export function useExceptions() {
  return useQuery({
    queryKey: ['risk-engine', 'exceptions'],
    queryFn: () => riskEngineAdminService.getExceptions(),
  });
}

export function useOverrides() {
  return useQuery({
    queryKey: ['risk-engine', 'overrides'],
    queryFn: () => riskEngineAdminService.getOverrides(),
  });
}

export function useAuditTimeline() {
  return useQuery({
    queryKey: ['risk-engine', 'audit'],
    queryFn: () => riskEngineAdminService.getAuditTimeline(),
  });
}
