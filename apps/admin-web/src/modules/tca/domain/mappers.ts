/**
 * TCA mappers — convert the REAL analytics objects from `@platform/tca-sdk` (and the service-level
 * roll-ups) into pre-formatted view models. Pure functions; all formatting flows through `./format`.
 * No calculation happens here — the numbers are produced by the SDK.
 */
import {
  BENCHMARK_CATALOG,
  gradeFor,
  type BenchmarkType,
  type ExecutionAnalytics,
  type ExecutionInput,
} from '@platform/tca-sdk';
import {
  costTone,
  favorableTone,
  fmtBps,
  fmtCurrency,
  fmtNotional,
  fmtNumber,
  fmtPct,
  fmtPrice,
  fmtScore,
  gradeTone,
  modeTone,
  scoreTone,
  shortTime,
  sideTone,
} from './format';
import type {
  BenchmarkAverageVm,
  BenchmarkRowVm,
  CommissionRowVm,
  CostBreakdownVm,
  ExecutionDetailVm,
  ExecutionRowVm,
  ImpactRowVm,
  MetricDefinitionVm,
  ReplayVm,
  ScorecardVm,
  SlippageRowVm,
  SummaryVm,
  TimelineRowVm,
  VenueRowVm,
} from './view-model';

const BENCH_LABEL = new Map(BENCHMARK_CATALOG.map((b) => [b.type, b] as const));

function gradeChip(grade: string) {
  return { label: grade, tone: gradeTone(grade) };
}

export function toExecutionRow(a: ExecutionAnalytics): ExecutionRowVm {
  return {
    id: a.id,
    orderId: a.orderId,
    symbol: a.symbol,
    side: { label: a.side, tone: sideTone(a.side) },
    venue: a.venue,
    mode: { label: a.mode, tone: modeTone(a.mode) },
    quantity: fmtNumber(a.executedQuantity),
    notional: fmtNotional(a.notional),
    waep: fmtPrice(a.weightedAverageExecutionPrice),
    slippageBps: fmtBps(a.slippage.vsArrivalBps),
    totalCostBps: fmtBps(a.cost.totalBps),
    totalCostTone: costTone(a.cost.totalBps),
    score: fmtScore(a.quality.score),
    grade: gradeChip(a.quality.grade),
    executedAtLabel: shortTime(a.executedAt),
  };
}

export function toBenchmarkRows(a: ExecutionAnalytics): readonly BenchmarkRowVm[] {
  return a.benchmarks.map((b) => {
    const descriptor = BENCH_LABEL.get(b.type);
    return {
      type: b.type,
      label: descriptor?.label ?? b.type,
      category: descriptor?.category ?? '',
      price: fmtPrice(b.price),
      slippageBps: fmtBps(b.slippageBps),
      slippageTone: costTone(b.slippageBps),
      slippageCurrency: fmtCurrency(b.slippageCurrency),
      favorable: b.favorable
        ? { label: 'Beat', tone: favorableTone(true) }
        : { label: 'Missed', tone: favorableTone(false) },
    };
  });
}

export function toCostBreakdown(a: ExecutionAnalytics): CostBreakdownVm {
  return {
    totalBps: fmtBps(a.cost.totalBps),
    totalTone: costTone(a.cost.totalBps),
    totalCurrency: fmtCurrency(a.cost.totalCurrency),
    components: a.attribution.components.map((c) => ({
      label: c.label,
      bps: fmtBps(c.bps),
      currency: fmtCurrency(c.currency),
      share: fmtPct(c.share),
      sharePct: Math.round(c.share * 100),
      tone: costTone(c.bps),
    })),
  };
}

export function toSlippageRow(a: ExecutionAnalytics): SlippageRowVm {
  return {
    id: a.id,
    symbol: a.symbol,
    side: { label: a.side, tone: sideTone(a.side) },
    venue: a.venue,
    vsArrival: fmtBps(a.slippage.vsArrivalBps),
    vsArrivalTone: costTone(a.slippage.vsArrivalBps),
    vsVwap: fmtBps(a.slippage.vsVwapBps),
    vsTwap: fmtBps(a.slippage.vsTwapBps),
    vsDecision: fmtBps(a.slippage.vsDecisionBps),
    vsMid: fmtBps(a.slippage.vsMidBps),
    vsClose: fmtBps(a.slippage.vsCloseBps),
  };
}

export function toCommissionRow(a: ExecutionAnalytics): CommissionRowVm {
  return {
    id: a.id,
    symbol: a.symbol,
    venue: a.venue,
    commission: fmtCurrency(a.commission.commission),
    commissionBps: fmtBps(a.commission.commissionBps),
    perShare: fmtCurrency(a.commission.perShare, 4),
    notional: fmtNotional(a.notional),
  };
}

export function toImpactRow(a: ExecutionAnalytics): ImpactRowVm {
  return {
    id: a.id,
    symbol: a.symbol,
    side: { label: a.side, tone: sideTone(a.side) },
    venue: a.venue,
    totalBps: fmtBps(a.impact.totalBps),
    totalTone: costTone(a.impact.totalBps),
    permanentBps: fmtBps(a.impact.permanentBps),
    temporaryBps: fmtBps(a.impact.temporaryBps),
    effectiveSpreadBps: fmtBps(a.effectiveSpreadBps),
    realizedSpreadBps: fmtBps(a.realizedSpreadBps),
  };
}

export function toTimelineRow(a: ExecutionAnalytics): TimelineRowVm {
  return {
    id: a.id,
    symbol: a.symbol,
    side: { label: a.side, tone: sideTone(a.side) },
    venue: a.venue,
    mode: { label: a.mode, tone: modeTone(a.mode) },
    executedAtLabel: shortTime(a.executedAt),
    totalCostBps: fmtBps(a.cost.totalBps),
    totalCostTone: costTone(a.cost.totalBps),
    grade: gradeChip(a.quality.grade),
  };
}

/** Execution "cost replay" — walk the fills, accumulating the running weighted price vs arrival. */
export function toReplay(a: ExecutionAnalytics, input: ExecutionInput): ReplayVm {
  const arrival = input.benchmarks.arrival;
  const sideSign = a.side === 'BUY' ? 1 : -1;
  let cumQty = 0;
  let cumNotional = 0;
  const steps = input.fills.map((fill, i) => {
    cumQty += fill.quantity;
    cumNotional += fill.price * fill.quantity;
    const runningWaep = cumNotional / cumQty;
    const vsArrival = arrival !== 0 ? sideSign * ((runningWaep - arrival) / arrival) * 10000 : 0;
    return {
      index: i + 1,
      label: `Fill ${i + 1}`,
      quantity: fmtNumber(fill.quantity),
      price: fmtPrice(fill.price),
      runningWaep: fmtPrice(runningWaep),
      vsArrivalBps: fmtBps(vsArrival),
      vsArrivalTone: costTone(vsArrival),
      venue: fill.venue,
      atLabel: shortTime(fill.at),
    };
  });
  return {
    id: a.id,
    symbol: a.symbol,
    side: { label: a.side, tone: sideTone(a.side) },
    arrivalPrice: fmtPrice(arrival),
    finalWaep: fmtPrice(a.weightedAverageExecutionPrice),
    consistent:
      Math.abs(a.weightedAverageExecutionPrice - (steps.length ? cumNotional / cumQty : NaN)) <
      1e-6,
    steps,
  };
}

export function toDetail(a: ExecutionAnalytics): ExecutionDetailVm {
  return {
    id: a.id,
    orderId: a.orderId,
    symbol: a.symbol,
    side: { label: a.side, tone: sideTone(a.side) },
    mode: { label: a.mode, tone: modeTone(a.mode) },
    venue: a.venue,
    executedAtLabel: shortTime(a.executedAt),
    kpis: [
      { label: 'Total cost', value: fmtBps(a.cost.totalBps), tone: costTone(a.cost.totalBps) },
      {
        label: 'Slippage vs arrival',
        value: fmtBps(a.slippage.vsArrivalBps),
        tone: costTone(a.slippage.vsArrivalBps),
      },
      {
        label: 'Impl. shortfall',
        value: fmtBps(a.implementationShortfallBps),
        tone: costTone(a.implementationShortfallBps),
      },
      {
        label: 'Quality',
        value: `${fmtScore(a.quality.score)} (${a.quality.grade})`,
        tone: scoreTone(a.quality.score),
      },
    ],
    meta: [
      { label: 'Order', value: a.orderId },
      { label: 'Order qty', value: fmtNumber(a.orderQuantity) },
      { label: 'Executed qty', value: fmtNumber(a.executedQuantity) },
      { label: 'Avg price', value: fmtPrice(a.averageExecutionPrice) },
      { label: 'Weighted avg price', value: fmtPrice(a.weightedAverageExecutionPrice) },
      { label: 'Notional', value: fmtNotional(a.notional) },
      { label: 'Participation', value: fmtPct(a.participationRate) },
      { label: 'Efficiency', value: fmtPct(a.executionEfficiency) },
      { label: 'Commission', value: fmtCurrency(a.commission.commission) },
      { label: 'Impl. shortfall', value: fmtCurrency(a.implementationShortfallCurrency) },
    ],
    benchmarks: toBenchmarkRows(a),
    cost: toCostBreakdown(a),
    attribution: toCostBreakdown(a),
    impact: toImpactRow(a),
    slippage: toSlippageRow(a),
  };
}

/* ------------------------------ aggregates ------------------------------- */

interface AggregateLike {
  readonly executions: number;
  readonly totalNotional: number;
  readonly totalCostCurrency: number;
  readonly avgSlippageBps: number;
  readonly avgTotalCostBps: number;
  readonly avgScore: number;
  readonly favorableRate: number;
  readonly avgCommissionBps?: number;
  readonly avgMarketImpactBps?: number;
  readonly avgImplementationShortfallBps?: number;
}

export function toSummary(agg: AggregateLike): SummaryVm {
  return {
    executions: agg.executions,
    totalNotional: fmtNotional(agg.totalNotional),
    totalCostCurrency: fmtCurrency(agg.totalCostCurrency),
    avgTotalCostBps: fmtBps(agg.avgTotalCostBps),
    avgSlippageBps: fmtBps(agg.avgSlippageBps),
    avgScore: fmtScore(agg.avgScore),
    avgScoreTone: scoreTone(agg.avgScore),
    favorableRate: fmtPct(agg.favorableRate),
    kpis: [
      { label: 'Executions', value: fmtNumber(agg.executions) },
      { label: 'Notional', value: fmtNotional(agg.totalNotional) },
      {
        label: 'Total cost',
        value: fmtCurrency(agg.totalCostCurrency),
        tone: costTone(agg.avgTotalCostBps),
      },
      {
        label: 'Avg cost',
        value: fmtBps(agg.avgTotalCostBps),
        tone: costTone(agg.avgTotalCostBps),
      },
      {
        label: 'Avg slippage',
        value: fmtBps(agg.avgSlippageBps),
        tone: costTone(agg.avgSlippageBps),
      },
      { label: 'Avg quality', value: fmtScore(agg.avgScore), tone: scoreTone(agg.avgScore) },
    ],
  };
}

export function toVenueRow(v: {
  readonly venueId: string;
  readonly executions: number;
  readonly totalNotional: number;
  readonly avgSlippageBps: number;
  readonly avgMarketImpactBps: number;
  readonly avgCommissionBps: number;
  readonly avgTotalCostBps: number;
  readonly avgScore: number;
}): VenueRowVm {
  return {
    venueId: v.venueId,
    executions: v.executions,
    totalNotional: fmtNotional(v.totalNotional),
    avgSlippageBps: fmtBps(v.avgSlippageBps),
    avgMarketImpactBps: fmtBps(v.avgMarketImpactBps),
    avgCommissionBps: fmtBps(v.avgCommissionBps),
    avgTotalCostBps: fmtBps(v.avgTotalCostBps),
    avgTotalCostTone: costTone(v.avgTotalCostBps),
    avgScore: fmtScore(v.avgScore),
    grade: gradeChip(gradeFor(v.avgScore)),
  };
}

export function toScorecard(c: {
  readonly key: string;
  readonly executions: number;
  readonly avgScore: number;
  readonly grade: string;
  readonly bestScore: number;
  readonly worstScore: number;
  readonly avgTotalCostBps: number;
  readonly avgSlippageBps: number;
  readonly favorableRate: number;
  readonly gradeDistribution: readonly { readonly grade: string; readonly count: number }[];
}): ScorecardVm {
  return {
    key: c.key,
    executions: c.executions,
    avgScore: fmtScore(c.avgScore),
    grade: gradeChip(c.grade),
    bestScore: fmtScore(c.bestScore),
    worstScore: fmtScore(c.worstScore),
    avgTotalCostBps: fmtBps(c.avgTotalCostBps),
    avgSlippageBps: fmtBps(c.avgSlippageBps),
    favorableRate: fmtPct(c.favorableRate),
    gradeDistribution: c.gradeDistribution.map((g) => ({
      grade: g.grade,
      count: g.count,
      tone: gradeTone(g.grade),
    })),
  };
}

export function toBenchmarkAverage(b: {
  readonly type: BenchmarkType;
  readonly avgSlippageBps: number;
  readonly favorableRate: number;
}): BenchmarkAverageVm {
  const descriptor = BENCH_LABEL.get(b.type);
  return {
    type: b.type,
    label: descriptor?.label ?? b.type,
    avgSlippageBps: fmtBps(b.avgSlippageBps),
    slippageTone: costTone(b.avgSlippageBps),
    favorableRate: fmtPct(b.favorableRate),
    favorablePct: Math.round(b.favorableRate * 100),
  };
}

export function toMetricDefinition(m: {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly direction: string;
  readonly category: string;
  readonly description: string;
}): MetricDefinitionVm {
  return {
    key: m.key,
    label: m.label,
    unit: m.unit,
    direction: m.direction,
    category: m.category,
    description: m.description,
  };
}
