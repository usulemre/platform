/**
 * TCA application service — the ONLY layer the UI/hooks call. It reads raw post-trade executions from
 * the repository, runs the REAL `@platform/tca-sdk` calculations (analysis, aggregation, per-venue
 * comparison, benchmark catalog) and the local roll-ups (cost reports, scorecards, metrics), and maps
 * everything to view models. No infrastructure, no exchange/broker SDK, no connectivity, no
 * persistence. Analysis is post-trade and deterministic.
 */
import {
  BENCHMARK_TYPES,
  TCA_METRIC_CATALOG,
  aggregate,
  analyzeExecution,
  compareVenues,
  gradeFor,
  type BenchmarkType,
  type ExecutionAnalytics,
} from '@platform/tca-sdk';
import { costTone, fmtBps, fmtCurrency, fmtPct } from '../domain/format';
import type { ExecutionQuery } from '../domain/query';
import {
  toBenchmarkAverage,
  toBenchmarkRows,
  toCommissionRow,
  toDetail,
  toExecutionRow,
  toImpactRow,
  toMetricDefinition,
  toReplay,
  toScorecard,
  toSlippageRow,
  toSummary,
  toTimelineRow,
  toVenueRow,
} from '../domain/mappers';
import type {
  BenchmarkRowVm,
  CommissionRowVm,
  CostBreakdownVm,
  ExecutionDetailVm,
  ExecutionRowVm,
  ImpactRowVm,
  MetricDefinitionVm,
  MetricsVm,
  ReplayVm,
  ReportRowVm,
  ReportVm,
  ScorecardVm,
  SlippageRowVm,
  SummaryVm,
  TimelineRowVm,
  VenueRowVm,
} from '../domain/view-model';
import type { TcaRepository } from '../data/repository';

export type ReportGroupBy = 'VENUE' | 'SYMBOL' | 'SIDE' | 'MODE';
export type ScorecardDimension = 'VENUE' | 'SYMBOL' | 'MODE';

export interface ExecutionRef {
  readonly id: string;
  readonly symbol: string;
  readonly side: string;
  readonly venue: string;
}

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;
const AT = '2026-08-05T12:00:00.000Z';

function groupKey(a: ExecutionAnalytics, groupBy: ReportGroupBy | ScorecardDimension): string {
  switch (groupBy) {
    case 'VENUE':
      return a.venue;
    case 'SYMBOL':
      return a.symbol;
    case 'SIDE':
      return a.side;
    case 'MODE':
      return a.mode;
    default:
      return a.venue;
  }
}

function group(
  analytics: readonly ExecutionAnalytics[],
  by: ReportGroupBy | ScorecardDimension,
): Map<string, ExecutionAnalytics[]> {
  const map = new Map<string, ExecutionAnalytics[]>();
  for (const a of analytics) {
    const key = groupKey(a, by);
    const list = map.get(key) ?? [];
    list.push(a);
    map.set(key, list);
  }
  return map;
}

export class TcaViewService {
  constructor(private readonly repository: TcaRepository) {}

  private async analyzedAll(): Promise<readonly ExecutionAnalytics[]> {
    return (await this.repository.listAll()).map(analyzeExecution);
  }

  async listExecutions(query: ExecutionQuery = {}): Promise<ExecutionRowVm[]> {
    return (await this.repository.listExecutions(query)).map((e) =>
      toExecutionRow(analyzeExecution(e)),
    );
  }

  async listRefs(): Promise<ExecutionRef[]> {
    return (await this.repository.listAll()).map((e) => ({
      id: e.id,
      symbol: e.symbol,
      side: e.side,
      venue: e.venue,
    }));
  }

  async getDetail(id: string): Promise<ExecutionDetailVm | null> {
    const execution = await this.repository.getExecution(id);
    return execution ? toDetail(analyzeExecution(execution)) : null;
  }

  async getReplay(id: string): Promise<ReplayVm | null> {
    const execution = await this.repository.getExecution(id);
    return execution ? toReplay(analyzeExecution(execution), execution) : null;
  }

  async getBenchmarks(id: string): Promise<readonly BenchmarkRowVm[]> {
    const execution = await this.repository.getExecution(id);
    return execution ? toBenchmarkRows(analyzeExecution(execution)) : [];
  }

  async getSummary(): Promise<SummaryVm> {
    return toSummary(aggregate(await this.analyzedAll()));
  }

  async slippageRows(query: ExecutionQuery = {}): Promise<SlippageRowVm[]> {
    return (await this.repository.listExecutions(query)).map((e) =>
      toSlippageRow(analyzeExecution(e)),
    );
  }

  async commissionRows(): Promise<CommissionRowVm[]> {
    return (await this.analyzedAll()).map(toCommissionRow);
  }

  async impactRows(): Promise<ImpactRowVm[]> {
    return (await this.analyzedAll()).map(toImpactRow);
  }

  async timeline(): Promise<TimelineRowVm[]> {
    return (await this.analyzedAll())
      .map(toTimelineRow)
      .sort((a, b) => b.executedAtLabel.localeCompare(a.executedAtLabel));
  }

  async venueComparison(): Promise<VenueRowVm[]> {
    return compareVenues(await this.analyzedAll()).map(toVenueRow);
  }

  async metrics(): Promise<MetricsVm> {
    const analytics = await this.analyzedAll();
    const gradeCounts = new Map<string, number>();
    for (const a of analytics)
      gradeCounts.set(a.quality.grade, (gradeCounts.get(a.quality.grade) ?? 0) + 1);
    const benchmarkAverages = BENCHMARK_TYPES.map((type: BenchmarkType) => {
      let sum = 0;
      let favorable = 0;
      for (const a of analytics) {
        const row = a.benchmarks.find((b) => b.type === type);
        if (!row) continue;
        sum += row.slippageBps;
        if (row.favorable) favorable += 1;
      }
      const n = analytics.length;
      return toBenchmarkAverage({
        type,
        avgSlippageBps: n > 0 ? sum / n : 0,
        favorableRate: n > 0 ? favorable / n : 0,
      });
    });
    return {
      totals: toSummary(aggregate(analytics)),
      byVenue: compareVenues(analytics).map(toVenueRow),
      byGrade: GRADES.map((grade) => ({
        grade,
        count: gradeCounts.get(grade) ?? 0,
        tone: costTone(0),
      }))
        .filter((g) => g.count > 0)
        .map((g) => ({
          ...g,
          tone:
            g.grade === 'A' || g.grade === 'B'
              ? 'positive'
              : g.grade === 'F'
                ? 'danger'
                : 'warning',
        })),
      benchmarkAverages,
    };
  }

  async costReport(groupBy: ReportGroupBy): Promise<ReportVm> {
    const analytics = await this.analyzedAll();
    const groups = group(analytics, groupBy);
    const rows: ReportRowVm[] = Array.from(groups.entries())
      .map(([key, list]) => {
        const agg = aggregate(list);
        return {
          key,
          executions: agg.executions,
          totalNotional: this.notional(agg.totalNotional),
          totalCostCurrency: fmtCurrency(agg.totalCostCurrency),
          avgSlippageBps: fmtBps(agg.avgSlippageBps),
          avgSpreadBps: fmtBps(agg.avgSpreadBps),
          avgMarketImpactBps: fmtBps(agg.avgMarketImpactBps),
          avgCommissionBps: fmtBps(agg.avgCommissionBps),
          avgTotalCostBps: fmtBps(agg.avgTotalCostBps),
          avgTotalCostTone: costTone(agg.avgTotalCostBps),
          avgImplementationShortfallBps: fmtBps(agg.avgImplementationShortfallBps),
          avgScore: agg.avgScore.toFixed(1),
        };
      })
      .sort((a, b) => parseFloat(b.avgTotalCostBps) - parseFloat(a.avgTotalCostBps));
    return {
      groupBy,
      generatedAtLabel: AT.slice(0, 16).replace('T', ' '),
      totals: toSummary(aggregate(analytics)),
      rows,
    };
  }

  async scorecards(dimension: ScorecardDimension): Promise<ScorecardVm[]> {
    const analytics = await this.analyzedAll();
    const groups = group(analytics, dimension);
    return Array.from(groups.entries())
      .map(([key, list]) => {
        const agg = aggregate(list);
        const counts = new Map<string, number>();
        let best = -Infinity;
        let worst = Infinity;
        for (const a of list) {
          counts.set(a.quality.grade, (counts.get(a.quality.grade) ?? 0) + 1);
          best = Math.max(best, a.quality.score);
          worst = Math.min(worst, a.quality.score);
        }
        return toScorecard({
          key,
          executions: list.length,
          avgScore: agg.avgScore,
          grade: gradeFor(agg.avgScore),
          bestScore: Number.isFinite(best) ? best : 0,
          worstScore: Number.isFinite(worst) ? worst : 0,
          avgTotalCostBps: agg.avgTotalCostBps,
          avgSlippageBps: agg.avgSlippageBps,
          favorableRate: agg.favorableRate,
          gradeDistribution: GRADES.map((grade) => ({
            grade,
            count: counts.get(grade) ?? 0,
          })).filter((b) => b.count > 0),
        });
      })
      .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
  }

  /** Aggregate cost attribution across all executions (the Cost Attribution surface). */
  async attributionSummary(): Promise<CostBreakdownVm> {
    const agg = aggregate(await this.analyzedAll());
    const parts = [
      {
        label: 'Timing slippage',
        bps: agg.avgSlippageBps - agg.avgSpreadBps - agg.avgMarketImpactBps,
      },
      { label: 'Spread', bps: agg.avgSpreadBps },
      { label: 'Market impact', bps: agg.avgMarketImpactBps },
      { label: 'Commission', bps: agg.avgCommissionBps },
    ];
    const denom = parts.reduce((n, p) => n + Math.abs(p.bps), 0);
    return {
      totalBps: fmtBps(agg.avgTotalCostBps),
      totalTone: costTone(agg.avgTotalCostBps),
      totalCurrency: fmtCurrency(agg.totalCostCurrency),
      components: parts.map((p) => ({
        label: p.label,
        bps: fmtBps(p.bps),
        currency: fmtCurrency((p.bps / 10000) * agg.totalNotional),
        share: fmtPct(denom > 0 ? Math.abs(p.bps) / denom : 0),
        sharePct: denom > 0 ? Math.round((Math.abs(p.bps) / denom) * 100) : 0,
        tone: costTone(p.bps),
      })),
    };
  }

  listMetricDefinitions(): MetricDefinitionVm[] {
    return TCA_METRIC_CATALOG.map(toMetricDefinition);
  }

  private notional(value: number): string {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
}
