/**
 * Reference catalogs for the TCA domain — the supported benchmarks and the metric dictionary. These
 * are inert documentation objects (prose descriptions, never executable formulas) that drive the UI
 * catalogs and glossary. The real calculations live in the sibling calculation modules.
 */
import type { BenchmarkDescriptor, TcaMetricDescriptor } from './types';

/** The eight supported comparison benchmarks. */
export const BENCHMARK_CATALOG: readonly BenchmarkDescriptor[] = [
  {
    type: 'ARRIVAL',
    label: 'Arrival price',
    category: 'PRE_TRADE',
    description:
      'The market price at the moment the order arrived at the desk or venue — the reference for implementation cost.',
  },
  {
    type: 'DECISION',
    label: 'Decision price',
    category: 'PRE_TRADE',
    description:
      'The market price at the investment decision, before any market exposure — the anchor for implementation shortfall.',
  },
  {
    type: 'VWAP',
    label: 'Volume-weighted average price',
    category: 'INTRA_TRADE',
    description:
      'The volume-weighted average traded price over the execution interval — a participation-quality benchmark.',
  },
  {
    type: 'TWAP',
    label: 'Time-weighted average price',
    category: 'INTRA_TRADE',
    description:
      'The time-weighted average price over the execution interval — a schedule-quality benchmark.',
  },
  {
    type: 'CLOSE',
    label: 'Close price',
    category: 'POST_TRADE',
    description:
      'The interval closing price — a mark-to-close reference used by close-benchmarked mandates.',
  },
  {
    type: 'OPEN',
    label: 'Open price',
    category: 'PRE_TRADE',
    description: 'The interval opening price — an open-auction reference.',
  },
  {
    type: 'MID',
    label: 'Mid quote',
    category: 'INTRA_TRADE',
    description: 'The mid of the bid/ask at execution — the reference for the effective spread.',
  },
  {
    type: 'LAST',
    label: 'Last trade price',
    category: 'POST_TRADE',
    description: 'The final trade price of the interval — a post-trade reversion reference.',
  },
];

/** The TCA metric dictionary — the definitions surfaced in the UI glossary. */
export const TCA_METRIC_CATALOG: readonly TcaMetricDescriptor[] = [
  {
    key: 'averageExecutionPrice',
    label: 'Average execution price',
    unit: 'PRICE',
    direction: 'LOWER_IS_BETTER',
    category: 'PRICE',
    description: 'The simple arithmetic mean of fill prices, weighting every fill equally.',
  },
  {
    key: 'weightedAverageExecutionPrice',
    label: 'Weighted average execution price',
    unit: 'PRICE',
    direction: 'LOWER_IS_BETTER',
    category: 'PRICE',
    description: 'The quantity-weighted mean of fill prices — the realised price of the execution.',
  },
  {
    key: 'slippageBps',
    label: 'Slippage',
    unit: 'BPS',
    direction: 'LOWER_IS_BETTER',
    category: 'SLIPPAGE',
    description:
      'The signed cost of the execution price versus a benchmark, positive when unfavorable.',
  },
  {
    key: 'implementationShortfall',
    label: 'Implementation shortfall',
    unit: 'BPS',
    direction: 'LOWER_IS_BETTER',
    category: 'COST',
    description:
      'The gap between a paper portfolio struck at the decision price and the executed portfolio, including costs and unfilled opportunity.',
  },
  {
    key: 'effectiveSpreadBps',
    label: 'Effective spread',
    unit: 'BPS',
    direction: 'LOWER_IS_BETTER',
    category: 'SPREAD',
    description:
      'Twice the signed distance between the execution price and the mid quote at execution — the round-trip cost of demanding liquidity.',
  },
  {
    key: 'realizedSpreadBps',
    label: 'Realized spread',
    unit: 'BPS',
    direction: 'LOWER_IS_BETTER',
    category: 'SPREAD',
    description:
      'The portion of the effective spread that persists a short interval after the trade — the liquidity-provision component.',
  },
  {
    key: 'marketImpactBps',
    label: 'Market impact',
    unit: 'BPS',
    direction: 'LOWER_IS_BETTER',
    category: 'IMPACT',
    description:
      'The price move caused by the execution against arrival, split into a permanent and a temporary component.',
  },
  {
    key: 'commissionBps',
    label: 'Commission',
    unit: 'BPS',
    direction: 'LOWER_IS_BETTER',
    category: 'COST',
    description: 'The explicit commission expressed in basis points of traded notional.',
  },
  {
    key: 'participationRate',
    label: 'Participation rate',
    unit: 'RATIO',
    direction: 'LOWER_IS_BETTER',
    category: 'PARTICIPATION',
    description:
      'The executed quantity as a fraction of interval market volume — a proxy for execution aggressiveness.',
  },
  {
    key: 'executionEfficiency',
    label: 'Execution efficiency',
    unit: 'RATIO',
    direction: 'HIGHER_IS_BETTER',
    category: 'QUALITY',
    description:
      'Where the realised price fell within the interval benchmark price range, from worst (0) to best (1).',
  },
  {
    key: 'qualityScore',
    label: 'Execution quality score',
    unit: 'SCORE',
    direction: 'HIGHER_IS_BETTER',
    category: 'QUALITY',
    description:
      'A 0–100 weighted blend of the slippage, impact, commission, efficiency and participation sub-scores.',
  },
];
