'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { SignalKey } from '@platform/signal-calculation-sdk';
import { signalCalculationAdminService } from '../application/container';
import type { SignalRunRequest } from '../data/repository';

/** Server-state hooks for the Signal Calculation UI. They call the application service only. */
export function useSignalSummary() {
  return useQuery({
    queryKey: ['signal-calc', 'summary'],
    queryFn: () => signalCalculationAdminService.getSummary(),
  });
}

export function useSignals() {
  return useQuery({
    queryKey: ['signal-calc', 'signals'],
    queryFn: () => signalCalculationAdminService.listSignals(),
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: ['signal-calc', 'datasets'],
    queryFn: () => signalCalculationAdminService.listDatasets(),
  });
}

export function useRunSignal() {
  return useMutation({
    mutationFn: (request: SignalRunRequest) => signalCalculationAdminService.runSignal(request),
  });
}

export function useDebugSignal() {
  return useMutation({
    mutationFn: (request: SignalRunRequest) => signalCalculationAdminService.debugSignal(request),
  });
}

export function useCompareSignals() {
  return useMutation({
    mutationFn: (input: { datasetRef: string; signalA: SignalKey; signalB: SignalKey }) =>
      signalCalculationAdminService.compareSignals(input.datasetRef, input.signalA, input.signalB),
  });
}

export function useExecutionHistory() {
  return useQuery({
    queryKey: ['signal-calc', 'history'],
    queryFn: () => signalCalculationAdminService.getExecutionHistory(),
  });
}

export function useExecutionStatus() {
  return useQuery({
    queryKey: ['signal-calc', 'status'],
    queryFn: () => signalCalculationAdminService.getExecutionStatus(),
  });
}

export function useBenchmarkSuite(datasetRef: string, enabled: boolean) {
  return useQuery({
    queryKey: ['signal-calc', 'benchmark', datasetRef],
    queryFn: () => signalCalculationAdminService.runBenchmarkSuite(datasetRef),
    enabled,
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['signal-calc', 'performance'],
    queryFn: () => signalCalculationAdminService.getPerformanceMetrics(),
  });
}

export function useDependencyGraph() {
  return useQuery({
    queryKey: ['signal-calc', 'graph'],
    queryFn: () => signalCalculationAdminService.dependencyGraph(),
  });
}
