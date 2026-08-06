/**
 * Execution scorecards — deterministic quality scorecards over a set of analyzed executions, grouped
 * by venue / symbol / mode. Each scorecard reports the notional-weighted quality score and grade,
 * best/worst outcomes, cost drivers and a grade distribution. Pure: no IO. Scoring rules live in
 * `@platform/tca-sdk`.
 */
import { aggregate, gradeFor, type ExecutionAnalytics } from '@platform/tca-sdk';

export type ScorecardDimension = 'VENUE' | 'SYMBOL' | 'MODE';

export interface GradeBucket {
  readonly grade: string;
  readonly count: number;
}

export interface ExecutionScorecard {
  readonly key: string;
  readonly executions: number;
  readonly avgScore: number;
  readonly grade: string;
  readonly bestScore: number;
  readonly worstScore: number;
  readonly avgTotalCostBps: number;
  readonly avgSlippageBps: number;
  readonly favorableRate: number;
  readonly gradeDistribution: readonly GradeBucket[];
}

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

function dimensionKey(analytics: ExecutionAnalytics, dimension: ScorecardDimension): string {
  switch (dimension) {
    case 'VENUE':
      return analytics.venue;
    case 'SYMBOL':
      return analytics.symbol;
    case 'MODE':
      return analytics.mode;
    default: {
      const exhaustive: never = dimension;
      return exhaustive;
    }
  }
}

function scorecardFor(key: string, group: readonly ExecutionAnalytics[]): ExecutionScorecard {
  const agg = aggregate(group);
  const counts = new Map<string, number>();
  let best = -Infinity;
  let worst = Infinity;
  for (const a of group) {
    const g = a.quality.grade;
    counts.set(g, (counts.get(g) ?? 0) + 1);
    if (a.quality.score > best) best = a.quality.score;
    if (a.quality.score < worst) worst = a.quality.score;
  }
  return {
    key,
    executions: group.length,
    avgScore: agg.avgScore,
    grade: gradeFor(agg.avgScore),
    bestScore: Number.isFinite(best) ? best : 0,
    worstScore: Number.isFinite(worst) ? worst : 0,
    avgTotalCostBps: agg.avgTotalCostBps,
    avgSlippageBps: agg.avgSlippageBps,
    favorableRate: agg.favorableRate,
    gradeDistribution: GRADES.map((grade) => ({ grade, count: counts.get(grade) ?? 0 })).filter(
      (b) => b.count > 0,
    ),
  };
}

/** Build execution scorecards for a dimension (sorted by average score descending — best first). */
export function buildScorecards(
  analytics: readonly ExecutionAnalytics[],
  dimension: ScorecardDimension,
): readonly ExecutionScorecard[] {
  const groups = new Map<string, ExecutionAnalytics[]>();
  for (const a of analytics) {
    const key = dimensionKey(a, dimension);
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }
  return Array.from(groups.entries())
    .map(([key, group]) => scorecardFor(key, group))
    .sort((a, b) => b.avgScore - a.avgScore);
}
