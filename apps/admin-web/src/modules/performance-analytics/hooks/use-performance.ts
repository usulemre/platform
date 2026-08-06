'use client';

import { useQuery } from '@tanstack/react-query';
import { performanceAdminService } from '../application/container';
import type { ReportQuery } from '../domain/query';
import type { SubjectKind } from '../domain/dto';

/** Server-state hooks for the Performance Analytics Engine UI. They call the application
 *  service only — never a repository, the service tier, an analytics runtime, or persistence. */
export function usePerformanceSummary() {
  return useQuery({
    queryKey: ['performance', 'summary'],
    queryFn: () => performanceAdminService.getSummary(),
  });
}

export function useReports(query: ReportQuery) {
  return useQuery({
    queryKey: ['performance', 'reports', query],
    queryFn: () => performanceAdminService.listReports(query),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['performance', 'report', id],
    queryFn: () => performanceAdminService.getReport(id),
    enabled: id.length > 0,
  });
}

export function useFamilies() {
  return useQuery({
    queryKey: ['performance', 'families'],
    queryFn: () => performanceAdminService.listFamilies(),
  });
}

export function useMetricCatalog() {
  return useQuery({
    queryKey: ['performance', 'catalog'],
    queryFn: () => performanceAdminService.getMetricCatalog(),
  });
}

export function useMetricDefinition(key: string) {
  return useQuery({
    queryKey: ['performance', 'metric', key],
    queryFn: () => performanceAdminService.getMetricDefinition(key),
    enabled: key.length > 0,
  });
}

export function useBenchmarks() {
  return useQuery({
    queryKey: ['performance', 'benchmarks'],
    queryFn: () => performanceAdminService.listBenchmarks(),
  });
}

export function useSubjectReports(subjectKind: SubjectKind) {
  return useQuery({
    queryKey: ['performance', 'subject', subjectKind],
    queryFn: () => performanceAdminService.getSubjectReports(subjectKind),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: ['performance', 'review-queue'],
    queryFn: () => performanceAdminService.getReviewQueue(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['performance', 'approval-queue'],
    queryFn: () => performanceAdminService.getApprovalQueue(),
  });
}

export function useComparisons() {
  return useQuery({
    queryKey: ['performance', 'comparisons'],
    queryFn: () => performanceAdminService.listComparisons(),
  });
}

export function useComparison(id: string) {
  return useQuery({
    queryKey: ['performance', 'comparison', id],
    queryFn: () => performanceAdminService.getComparison(id),
    enabled: id.length > 0,
  });
}
