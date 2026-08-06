/**
 * Cost reports — deterministic, grouped cost summaries over a set of analyzed executions. Pure: no IO.
 * A report groups executions by venue / symbol / side / mode and reports the notional-weighted cost
 * for each group plus a portfolio total. The real per-execution cost calculations live in
 * `@platform/tca-sdk`; this module only rolls them up for the Cost Reports view.
 */
import { aggregate, type AggregateAnalytics, type ExecutionAnalytics } from '@platform/tca-sdk';

export type ReportGroupBy = 'VENUE' | 'SYMBOL' | 'SIDE' | 'MODE';

export interface CostReportRow {
  readonly key: string;
  readonly executions: number;
  readonly totalNotional: number;
  readonly totalCostCurrency: number;
  readonly totalCommissionCurrency: number;
  readonly avgSlippageBps: number;
  readonly avgSpreadBps: number;
  readonly avgMarketImpactBps: number;
  readonly avgCommissionBps: number;
  readonly avgTotalCostBps: number;
  readonly avgImplementationShortfallBps: number;
  readonly avgScore: number;
}

export interface CostReport {
  readonly groupBy: ReportGroupBy;
  readonly generatedAt: string;
  readonly totals: AggregateAnalytics;
  readonly rows: readonly CostReportRow[];
}

function groupKey(analytics: ExecutionAnalytics, groupBy: ReportGroupBy): string {
  switch (groupBy) {
    case 'VENUE':
      return analytics.venue;
    case 'SYMBOL':
      return analytics.symbol;
    case 'SIDE':
      return analytics.side;
    case 'MODE':
      return analytics.mode;
    default: {
      const exhaustive: never = groupBy;
      return exhaustive;
    }
  }
}

function rowFrom(key: string, group: readonly ExecutionAnalytics[]): CostReportRow {
  const agg = aggregate(group);
  return {
    key,
    executions: agg.executions,
    totalNotional: agg.totalNotional,
    totalCostCurrency: agg.totalCostCurrency,
    totalCommissionCurrency: agg.totalCommissionCurrency,
    avgSlippageBps: agg.avgSlippageBps,
    avgSpreadBps: agg.avgSpreadBps,
    avgMarketImpactBps: agg.avgMarketImpactBps,
    avgCommissionBps: agg.avgCommissionBps,
    avgTotalCostBps: agg.avgTotalCostBps,
    avgImplementationShortfallBps: agg.avgImplementationShortfallBps,
    avgScore: agg.avgScore,
  };
}

/** Build a grouped cost report (rows sorted by total cost bps descending — worst first). */
export function buildCostReport(
  analytics: readonly ExecutionAnalytics[],
  groupBy: ReportGroupBy,
  generatedAt: string,
): CostReport {
  const groups = new Map<string, ExecutionAnalytics[]>();
  for (const a of analytics) {
    const key = groupKey(a, groupBy);
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }
  const rows = Array.from(groups.entries())
    .map(([key, group]) => rowFrom(key, group))
    .sort((a, b) => b.avgTotalCostBps - a.avgTotalCostBps);
  return { groupBy, generatedAt, totals: aggregate(analytics), rows };
}
