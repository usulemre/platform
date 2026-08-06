/**
 * TCA metrics — deterministic service-level aggregation over analyzed executions: the portfolio-level
 * cost rollup, the per-venue comparison, the grade distribution and the average slippage / favorable
 * rate against each benchmark. Pure: no IO. Powers the TCA Dashboard and metrics views.
 */
import {
  BENCHMARK_TYPES,
  aggregate,
  compareVenues,
  type AggregateAnalytics,
  type BenchmarkType,
  type ExecutionAnalytics,
  type VenueComparison,
} from '@platform/tca-sdk';

export interface BenchmarkAverage {
  readonly type: BenchmarkType;
  readonly avgSlippageBps: number;
  readonly favorableRate: number;
}

export interface GradeCount {
  readonly grade: string;
  readonly count: number;
}

export interface TcaMetrics {
  readonly totals: AggregateAnalytics;
  readonly byVenue: readonly VenueComparison[];
  readonly byGrade: readonly GradeCount[];
  readonly benchmarkAverages: readonly BenchmarkAverage[];
}

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

export function computeTcaMetrics(analytics: readonly ExecutionAnalytics[]): TcaMetrics {
  const gradeCounts = new Map<string, number>();
  for (const a of analytics)
    gradeCounts.set(a.quality.grade, (gradeCounts.get(a.quality.grade) ?? 0) + 1);

  const benchmarkAverages: BenchmarkAverage[] = BENCHMARK_TYPES.map((type) => {
    let sum = 0;
    let favorable = 0;
    for (const a of analytics) {
      const row = a.benchmarks.find((b) => b.type === type);
      if (!row) continue;
      sum += row.slippageBps;
      if (row.favorable) favorable += 1;
    }
    const n = analytics.length;
    return { type, avgSlippageBps: n > 0 ? sum / n : 0, favorableRate: n > 0 ? favorable / n : 0 };
  });

  return {
    totals: aggregate(analytics),
    byVenue: compareVenues(analytics),
    byGrade: GRADES.map((grade) => ({ grade, count: gradeCounts.get(grade) ?? 0 })).filter(
      (b) => b.count > 0,
    ),
    benchmarkAverages,
  };
}
