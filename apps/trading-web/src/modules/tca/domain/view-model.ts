/**
 * TCA view models — UI-facing, pre-formatted shapes produced by the mappers so components carry no
 * calculation logic. Inert presentation data only; every number originates from the REAL
 * `@platform/tca-sdk` calculations. No exchange/broker/FIX.
 */
import type { Tone } from './format';

export interface Chip {
  readonly label: string;
  readonly tone: Tone;
}

export interface ExecutionRowVm {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Chip;
  readonly venue: string;
  readonly mode: Chip;
  readonly quantity: string;
  readonly notional: string;
  readonly waep: string;
  readonly slippageBps: string;
  readonly totalCostBps: string;
  readonly totalCostTone: Tone;
  readonly score: string;
  readonly grade: Chip;
  readonly executedAtLabel: string;
}

export interface KpiVm {
  readonly label: string;
  readonly value: string;
  readonly tone?: Tone;
  readonly hint?: string;
}

export interface SummaryVm {
  readonly executions: number;
  readonly totalNotional: string;
  readonly totalCostCurrency: string;
  readonly avgTotalCostBps: string;
  readonly avgSlippageBps: string;
  readonly avgScore: string;
  readonly avgScoreTone: Tone;
  readonly favorableRate: string;
  readonly kpis: readonly KpiVm[];
}

export interface BenchmarkRowVm {
  readonly type: string;
  readonly label: string;
  readonly category: string;
  readonly price: string;
  readonly slippageBps: string;
  readonly slippageTone: Tone;
  readonly slippageCurrency: string;
  readonly favorable: Chip;
}

export interface CostComponentVm {
  readonly label: string;
  readonly bps: string;
  readonly currency: string;
  readonly share: string;
  readonly sharePct: number;
  readonly tone: Tone;
}

export interface CostBreakdownVm {
  readonly totalBps: string;
  readonly totalTone: Tone;
  readonly totalCurrency: string;
  readonly components: readonly CostComponentVm[];
}

export interface SlippageRowVm {
  readonly id: string;
  readonly symbol: string;
  readonly side: Chip;
  readonly venue: string;
  readonly vsArrival: string;
  readonly vsArrivalTone: Tone;
  readonly vsVwap: string;
  readonly vsTwap: string;
  readonly vsDecision: string;
  readonly vsMid: string;
  readonly vsClose: string;
}

export interface CommissionRowVm {
  readonly id: string;
  readonly symbol: string;
  readonly venue: string;
  readonly commission: string;
  readonly commissionBps: string;
  readonly perShare: string;
  readonly notional: string;
}

export interface ImpactRowVm {
  readonly id: string;
  readonly symbol: string;
  readonly side: Chip;
  readonly venue: string;
  readonly totalBps: string;
  readonly totalTone: Tone;
  readonly permanentBps: string;
  readonly temporaryBps: string;
  readonly effectiveSpreadBps: string;
  readonly realizedSpreadBps: string;
}

export interface VenueRowVm {
  readonly venueId: string;
  readonly executions: number;
  readonly totalNotional: string;
  readonly avgSlippageBps: string;
  readonly avgMarketImpactBps: string;
  readonly avgCommissionBps: string;
  readonly avgTotalCostBps: string;
  readonly avgTotalCostTone: Tone;
  readonly avgScore: string;
  readonly grade: Chip;
}

export interface ScorecardVm {
  readonly key: string;
  readonly executions: number;
  readonly avgScore: string;
  readonly grade: Chip;
  readonly bestScore: string;
  readonly worstScore: string;
  readonly avgTotalCostBps: string;
  readonly avgSlippageBps: string;
  readonly favorableRate: string;
  readonly gradeDistribution: readonly {
    readonly grade: string;
    readonly count: number;
    readonly tone: Tone;
  }[];
}

export interface ReportRowVm {
  readonly key: string;
  readonly executions: number;
  readonly totalNotional: string;
  readonly totalCostCurrency: string;
  readonly avgSlippageBps: string;
  readonly avgSpreadBps: string;
  readonly avgMarketImpactBps: string;
  readonly avgCommissionBps: string;
  readonly avgTotalCostBps: string;
  readonly avgTotalCostTone: Tone;
  readonly avgImplementationShortfallBps: string;
  readonly avgScore: string;
}

export interface ReportVm {
  readonly groupBy: string;
  readonly generatedAtLabel: string;
  readonly totals: SummaryVm;
  readonly rows: readonly ReportRowVm[];
}

export interface BenchmarkAverageVm {
  readonly type: string;
  readonly label: string;
  readonly avgSlippageBps: string;
  readonly slippageTone: Tone;
  readonly favorableRate: string;
  readonly favorablePct: number;
}

export interface MetricsVm {
  readonly totals: SummaryVm;
  readonly byVenue: readonly VenueRowVm[];
  readonly byGrade: readonly {
    readonly grade: string;
    readonly count: number;
    readonly tone: Tone;
  }[];
  readonly benchmarkAverages: readonly BenchmarkAverageVm[];
}

export interface TimelineRowVm {
  readonly id: string;
  readonly symbol: string;
  readonly side: Chip;
  readonly venue: string;
  readonly mode: Chip;
  readonly executedAtLabel: string;
  readonly totalCostBps: string;
  readonly totalCostTone: Tone;
  readonly grade: Chip;
}

export interface ReplayStepVm {
  readonly index: number;
  readonly label: string;
  readonly quantity: string;
  readonly price: string;
  readonly runningWaep: string;
  readonly vsArrivalBps: string;
  readonly vsArrivalTone: Tone;
  readonly venue: string;
  readonly atLabel: string;
}

export interface ReplayVm {
  readonly id: string;
  readonly symbol: string;
  readonly side: Chip;
  readonly arrivalPrice: string;
  readonly finalWaep: string;
  readonly consistent: boolean;
  readonly steps: readonly ReplayStepVm[];
}

export interface MetaRowVm {
  readonly label: string;
  readonly value: string;
}

export interface ExecutionDetailVm {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Chip;
  readonly mode: Chip;
  readonly venue: string;
  readonly executedAtLabel: string;
  readonly kpis: readonly KpiVm[];
  readonly meta: readonly MetaRowVm[];
  readonly benchmarks: readonly BenchmarkRowVm[];
  readonly cost: CostBreakdownVm;
  readonly attribution: CostBreakdownVm;
  readonly impact: ImpactRowVm;
  readonly slippage: SlippageRowVm;
}

export interface MetricDefinitionVm {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly direction: string;
  readonly category: string;
  readonly description: string;
}
