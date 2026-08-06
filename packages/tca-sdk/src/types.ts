/**
 * Core types for the Transaction Cost Analysis (TCA) SDK — the inputs to real, deterministic
 * post-trade cost calculations and the canonical TCA domain models. All calculations are pure and
 * deterministic (no randomness, no wall-clock, no market-data feed): they operate on the fills and
 * benchmark prices supplied at analysis time. NO broker/exchange SDK, NO FIX, NO connectivity.
 *
 * Sign convention: a **cost** is positive when unfavorable. For a BUY, paying above the benchmark is
 * a cost; for a SELL, selling below the benchmark is a cost. `sideMultiplier` encodes this.
 */

export type Side = 'BUY' | 'SELL';
export type ExecutionMode = 'SIMULATED' | 'PAPER' | 'LIVE';

/** The eight supported comparison benchmarks. */
export type BenchmarkType =
  | 'ARRIVAL'
  | 'DECISION'
  | 'VWAP'
  | 'TWAP'
  | 'CLOSE'
  | 'OPEN'
  | 'MID'
  | 'LAST';

/** +1 for a BUY, -1 for a SELL (cost sign convention). */
export function sideMultiplier(side: Side): number {
  return side === 'BUY' ? 1 : -1;
}

/** A single fill (partial or full execution). */
export interface Fill {
  readonly quantity: number;
  readonly price: number;
  readonly at: string;
  readonly venue: string;
}

/** The benchmark prices for an execution interval. */
export interface BenchmarkPrices {
  /** Price at order arrival at the desk/venue. */
  readonly arrival: number;
  /** Price at the investment decision (pre-trade). */
  readonly decision: number;
  /** Interval volume-weighted average price. */
  readonly vwap: number;
  /** Interval time-weighted average price. */
  readonly twap: number;
  readonly open: number;
  readonly close: number;
  /** Mid quote at execution. */
  readonly mid: number;
  /** Last trade / final price of the interval. */
  readonly last: number;
}

/** One execution to be analyzed (an order and its fills, with benchmarks and costs). */
export interface ExecutionInput {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Side;
  readonly orderQuantity: number;
  readonly fills: readonly Fill[];
  readonly benchmarks: BenchmarkPrices;
  /** Total commission in currency. */
  readonly commission: number;
  /** Quoted spread in basis points (for spread cost). */
  readonly spreadBps: number;
  /** Interval market volume (for participation rate). */
  readonly marketVolume: number;
  /** Mid quote a short interval AFTER execution (for realized spread / permanent impact). */
  readonly midAfter?: number;
  readonly venue: string;
  readonly mode: ExecutionMode;
  readonly executedAt: string;
}

/* ------------------------------ result models ------------------------------ */

/** The cost breakdown (basis points + currency). */
export interface CostBreakdown {
  readonly slippageBps: number;
  readonly spreadBps: number;
  readonly marketImpactBps: number;
  readonly commissionBps: number;
  readonly totalBps: number;
  readonly slippageCurrency: number;
  readonly spreadCurrency: number;
  readonly marketImpactCurrency: number;
  readonly commissionCurrency: number;
  readonly totalCurrency: number;
}

/** Comparison against a single benchmark. */
export interface ExecutionBenchmark {
  readonly type: BenchmarkType;
  readonly price: number;
  readonly slippageBps: number;
  readonly slippageCurrency: number;
  /** Whether execution beat the benchmark (favorable). */
  readonly favorable: boolean;
}

/** The slippage report across the primary benchmarks. */
export interface SlippageReport {
  readonly vsArrivalBps: number;
  readonly vsDecisionBps: number;
  readonly vsVwapBps: number;
  readonly vsTwapBps: number;
  readonly vsMidBps: number;
  readonly vsCloseBps: number;
}

/** The commission report. */
export interface CommissionReport {
  readonly commission: number;
  readonly commissionBps: number;
  readonly perShare: number;
}

/** The market-impact report. */
export interface MarketImpactReport {
  readonly totalBps: number;
  readonly temporaryBps: number;
  readonly permanentBps: number;
}

/** The execution quality summary. */
export interface ExecutionQuality {
  readonly score: number;
  readonly grade: string;
  readonly efficiency: number;
  readonly slippageBps: number;
  readonly marketImpactBps: number;
  readonly commissionBps: number;
  readonly participationRate: number;
}

/** The execution score (composite + components). */
export interface ExecutionScore {
  readonly score: number;
  readonly grade: string;
  readonly components: readonly {
    readonly label: string;
    readonly score: number;
    readonly weight: number;
  }[];
}

/** One attribution component (share of total cost). */
export interface AttributionComponent {
  readonly label: string;
  readonly bps: number;
  readonly currency: number;
  readonly share: number;
}

/** The execution attribution — decomposition of total cost. */
export interface ExecutionAttribution {
  readonly totalBps: number;
  readonly components: readonly AttributionComponent[];
}

/** The transaction cost currency summary. */
export interface TransactionCost {
  readonly notional: number;
  readonly totalCurrency: number;
  readonly totalBps: number;
}

/** The complete TCA analytics for one execution. */
export interface ExecutionAnalytics {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Side;
  readonly mode: ExecutionMode;
  readonly venue: string;
  readonly executedAt: string;
  readonly orderQuantity: number;
  readonly executedQuantity: number;
  readonly averageExecutionPrice: number;
  readonly weightedAverageExecutionPrice: number;
  readonly notional: number;
  readonly participationRate: number;
  readonly effectiveSpreadBps: number;
  readonly realizedSpreadBps: number;
  readonly implementationShortfallBps: number;
  readonly implementationShortfallCurrency: number;
  readonly executionEfficiency: number;
  readonly benchmarks: readonly ExecutionBenchmark[];
  readonly cost: CostBreakdown;
  readonly quality: ExecutionQuality;
  readonly slippage: SlippageReport;
  readonly commission: CommissionReport;
  readonly impact: MarketImpactReport;
  readonly attribution: ExecutionAttribution;
}

/** The per-venue comparison aggregate. */
export interface VenueComparison {
  readonly venueId: string;
  readonly executions: number;
  readonly totalNotional: number;
  readonly avgSlippageBps: number;
  readonly avgMarketImpactBps: number;
  readonly avgCommissionBps: number;
  readonly avgTotalCostBps: number;
  readonly avgScore: number;
}

/** A portfolio-level rollup across many analyzed executions (notional-weighted). */
export interface AggregateAnalytics {
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
  readonly avgParticipationRate: number;
  readonly favorableRate: number;
}

/* ------------------------------ catalogs ------------------------------ */

/** Whether a metric is better when it is higher or lower. */
export type MetricDirection = 'LOWER_IS_BETTER' | 'HIGHER_IS_BETTER';
export type MetricUnit = 'BPS' | 'CURRENCY' | 'PERCENT' | 'RATIO' | 'SCORE' | 'PRICE' | 'SHARES';

/** A descriptor for one supported benchmark (documentation for the UI catalog). */
export interface BenchmarkDescriptor {
  readonly type: BenchmarkType;
  readonly label: string;
  readonly category: 'PRE_TRADE' | 'INTRA_TRADE' | 'POST_TRADE';
  /** Prose description of what the benchmark measures — never a code formula. */
  readonly description: string;
}

/** A descriptor for one TCA metric (documentation for the UI catalog). */
export interface TcaMetricDescriptor {
  readonly key: string;
  readonly label: string;
  readonly unit: MetricUnit;
  readonly direction: MetricDirection;
  readonly category:
    | 'PRICE'
    | 'SLIPPAGE'
    | 'SPREAD'
    | 'IMPACT'
    | 'COST'
    | 'QUALITY'
    | 'PARTICIPATION';
  /** Prose description of how the metric is defined — never executable code. */
  readonly description: string;
}
