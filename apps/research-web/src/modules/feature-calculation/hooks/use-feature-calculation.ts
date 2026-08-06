'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { featureCalculationAdminService } from '../application/container';
import type { CalculationRequest } from '../data/repository';

/** Server-state hooks for the Feature Calculation UI. They call the application service only. */
export function useCalculationSummary() {
  return useQuery({
    queryKey: ['feature-calc', 'summary'],
    queryFn: () => featureCalculationAdminService.getSummary(),
  });
}

export function useCalculations() {
  return useQuery({
    queryKey: ['feature-calc', 'calculations'],
    queryFn: () => featureCalculationAdminService.listCalculations(),
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: ['feature-calc', 'datasets'],
    queryFn: () => featureCalculationAdminService.listDatasets(),
  });
}

export function useRunCalculation() {
  return useMutation({
    mutationFn: (request: CalculationRequest) =>
      featureCalculationAdminService.runCalculation(request),
  });
}

export function useExecutionHistory() {
  return useQuery({
    queryKey: ['feature-calc', 'history'],
    queryFn: () => featureCalculationAdminService.getExecutionHistory(),
  });
}

export function useExecutionStatus() {
  return useQuery({
    queryKey: ['feature-calc', 'status'],
    queryFn: () => featureCalculationAdminService.getExecutionStatus(),
  });
}

export function useBenchmarkSuite(datasetRef: string, enabled: boolean) {
  return useQuery({
    queryKey: ['feature-calc', 'benchmark', datasetRef],
    queryFn: () => featureCalculationAdminService.runBenchmarkSuite(datasetRef),
    enabled,
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['feature-calc', 'performance'],
    queryFn: () => featureCalculationAdminService.getPerformanceMetrics(),
  });
}

export function useDependencyGraph() {
  return useQuery({
    queryKey: ['feature-calc', 'graph'],
    queryFn: () => featureCalculationAdminService.dependencyGraph(),
  });
}
