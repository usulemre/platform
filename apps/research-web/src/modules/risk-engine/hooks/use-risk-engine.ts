'use client';

import { useQuery } from '@tanstack/react-query';
import { riskEngineAdminService } from '../application/container';
import type { RiskQuery } from '../domain/query';

/** Server-state hooks for the Risk Engine UI. They call the application service only —
 *  never a repository, the service tier, a broker, a risk model, or persistence. */
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

export function useRiskFamilies() {
  return useQuery({
    queryKey: ['risk-engine', 'families'],
    queryFn: () => riskEngineAdminService.listFamilies(),
  });
}

export function useRiskPolicies() {
  return useQuery({
    queryKey: ['risk-engine', 'policies'],
    queryFn: () => riskEngineAdminService.listPolicies(),
  });
}

export function useValidationQueue() {
  return useQuery({
    queryKey: ['risk-engine', 'validation-queue'],
    queryFn: () => riskEngineAdminService.getValidationQueue(),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: ['risk-engine', 'review-queue'],
    queryFn: () => riskEngineAdminService.getReviewQueue(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['risk-engine', 'approval-queue'],
    queryFn: () => riskEngineAdminService.getApprovalQueue(),
  });
}

export function useExceptionQueue() {
  return useQuery({
    queryKey: ['risk-engine', 'exception-queue'],
    queryFn: () => riskEngineAdminService.getExceptionQueue(),
  });
}

export function useExposureSummary() {
  return useQuery({
    queryKey: ['risk-engine', 'exposures'],
    queryFn: () => riskEngineAdminService.getExposureSummary(),
  });
}

export function useRiskReports() {
  return useQuery({
    queryKey: ['risk-engine', 'reports'],
    queryFn: () => riskEngineAdminService.getReports(),
  });
}

export function useComparisons() {
  return useQuery({
    queryKey: ['risk-engine', 'comparisons'],
    queryFn: () => riskEngineAdminService.listComparisons(),
  });
}

export function useComparison(id: string) {
  return useQuery({
    queryKey: ['risk-engine', 'comparison', id],
    queryFn: () => riskEngineAdminService.getComparison(id),
    enabled: id.length > 0,
  });
}
