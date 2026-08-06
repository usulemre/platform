'use client';

import { useQuery } from '@tanstack/react-query';
import {
  tcaViewService,
  type ReportGroupBy,
  type ScorecardDimension,
} from '../application/container';
import type { ExecutionQuery } from '../domain/query';

/** Server-state hooks for the TCA UI. They call the application service only — never a repository, the
 *  service tier, an exchange, a broker, a credential, or persistence. Every number is computed by the
 *  REAL `@platform/tca-sdk` calculations. */
export function useExecutions(query: ExecutionQuery = {}) {
  return useQuery({
    queryKey: ['tca', 'executions', query],
    queryFn: () => tcaViewService.listExecutions(query),
  });
}
export function useExecutionRefs() {
  return useQuery({ queryKey: ['tca', 'refs'], queryFn: () => tcaViewService.listRefs() });
}
export function useExecutionDetail(id: string) {
  return useQuery({
    queryKey: ['tca', 'detail', id],
    queryFn: () => tcaViewService.getDetail(id),
    enabled: id.length > 0,
  });
}
export function useExecutionReplay(id: string) {
  return useQuery({
    queryKey: ['tca', 'replay', id],
    queryFn: () => tcaViewService.getReplay(id),
    enabled: id.length > 0,
  });
}
export function useExecutionBenchmarks(id: string) {
  return useQuery({
    queryKey: ['tca', 'benchmarks', id],
    queryFn: () => tcaViewService.getBenchmarks(id),
    enabled: id.length > 0,
  });
}
export function useTcaSummary() {
  return useQuery({ queryKey: ['tca', 'summary'], queryFn: () => tcaViewService.getSummary() });
}
export function useSlippageRows(query: ExecutionQuery = {}) {
  return useQuery({
    queryKey: ['tca', 'slippage', query],
    queryFn: () => tcaViewService.slippageRows(query),
  });
}
export function useCommissionRows() {
  return useQuery({
    queryKey: ['tca', 'commission'],
    queryFn: () => tcaViewService.commissionRows(),
  });
}
export function useImpactRows() {
  return useQuery({ queryKey: ['tca', 'impact'], queryFn: () => tcaViewService.impactRows() });
}
export function useTcaTimeline() {
  return useQuery({ queryKey: ['tca', 'timeline'], queryFn: () => tcaViewService.timeline() });
}
export function useVenueComparison() {
  return useQuery({ queryKey: ['tca', 'venues'], queryFn: () => tcaViewService.venueComparison() });
}
export function useTcaMetrics() {
  return useQuery({ queryKey: ['tca', 'metrics'], queryFn: () => tcaViewService.metrics() });
}
export function useCostReport(groupBy: ReportGroupBy) {
  return useQuery({
    queryKey: ['tca', 'report', groupBy],
    queryFn: () => tcaViewService.costReport(groupBy),
  });
}
export function useScorecards(dimension: ScorecardDimension) {
  return useQuery({
    queryKey: ['tca', 'scorecards', dimension],
    queryFn: () => tcaViewService.scorecards(dimension),
  });
}
export function useAttributionSummary() {
  return useQuery({
    queryKey: ['tca', 'attribution'],
    queryFn: () => tcaViewService.attributionSummary(),
  });
}
export function useMetricDefinitions() {
  return useQuery({
    queryKey: ['tca', 'metric-defs'],
    queryFn: () => Promise.resolve(tcaViewService.listMetricDefinitions()),
  });
}
