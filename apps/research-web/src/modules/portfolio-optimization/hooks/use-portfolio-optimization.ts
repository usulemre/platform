'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { OptimizerKey } from '@platform/portfolio-optimization-sdk';
import { portfolioOptimizationAdminService } from '../application/container';
import type { OptimizeRequest } from '../data/repository';
import type { ConstraintDto } from '../data/runner';

/** Server-state hooks for the Portfolio Optimization UI. They call the application service only. */
export function useOptimizerSummary() {
  return useQuery({
    queryKey: ['portfolio-opt', 'summary'],
    queryFn: () => portfolioOptimizationAdminService.getSummary(),
  });
}

export function useOptimizers() {
  return useQuery({
    queryKey: ['portfolio-opt', 'optimizers'],
    queryFn: () => portfolioOptimizationAdminService.listOptimizers(),
  });
}

export function useUniverses() {
  return useQuery({
    queryKey: ['portfolio-opt', 'universes'],
    queryFn: () => portfolioOptimizationAdminService.listUniverses(),
  });
}

export function useOptimize() {
  return useMutation({
    mutationFn: (request: OptimizeRequest) => portfolioOptimizationAdminService.optimize(request),
  });
}

export function useEfficientFrontier() {
  return useMutation({
    mutationFn: (input: { universeRef: string; constraints: ConstraintDto; points?: number }) =>
      portfolioOptimizationAdminService.efficientFrontier(
        input.universeRef,
        input.constraints,
        input.points,
      ),
  });
}

export function useCompareOptimizers() {
  return useMutation({
    mutationFn: (input: {
      universeRef: string;
      keys: readonly OptimizerKey[];
      constraints: ConstraintDto;
    }) =>
      portfolioOptimizationAdminService.compareOptimizers(
        input.universeRef,
        input.keys,
        input.constraints,
      ),
  });
}

export function useExecutionHistory() {
  return useQuery({
    queryKey: ['portfolio-opt', 'history'],
    queryFn: () => portfolioOptimizationAdminService.getExecutionHistory(),
  });
}

export function useExecutionStatus() {
  return useQuery({
    queryKey: ['portfolio-opt', 'status'],
    queryFn: () => portfolioOptimizationAdminService.getExecutionStatus(),
  });
}

export function useBenchmarkSuite(universeRef: string, enabled: boolean) {
  return useQuery({
    queryKey: ['portfolio-opt', 'benchmark', universeRef],
    queryFn: () => portfolioOptimizationAdminService.runBenchmarkSuite(universeRef),
    enabled,
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['portfolio-opt', 'performance'],
    queryFn: () => portfolioOptimizationAdminService.getPerformanceMetrics(),
  });
}

export function useDependencyGraph() {
  return useQuery({
    queryKey: ['portfolio-opt', 'graph'],
    queryFn: () => portfolioOptimizationAdminService.dependencyGraph(),
  });
}
