/**
 * The Execution Simulator metric CATALOG — descriptors of known execution-quality
 * indicators (their key, label, unit and meaning) for the metrics and comparison
 * capabilities. This is VOCABULARY ONLY: it defines what an indicator *is*, never how
 * it is computed. No metric is calculated here; per-session indicator VALUES are
 * supplied as inert data (see `ExecutionMetric` in contracts). Slippage/latency are
 * SIMULATED figures reported by the simulator, never derived from a real venue.
 */
export type MetricKey =
  | 'order_count'
  | 'fill_count'
  | 'fill_rate'
  | 'avg_slippage'
  | 'sim_latency'
  | 'reject_rate'
  | 'turnover'
  | 'participation';

export interface MetricDescriptor {
  readonly key: MetricKey;
  readonly label: string;
  readonly unit: string;
  readonly description: string;
  /** Whether a higher value is generally better (for display only, not a decision). */
  readonly higherIsBetter: boolean;
}

export const METRIC_CATALOG: readonly MetricDescriptor[] = [
  {
    key: 'order_count',
    label: 'Orders',
    unit: 'count',
    description: 'Number of simulated orders.',
    higherIsBetter: true,
  },
  {
    key: 'fill_count',
    label: 'Fills',
    unit: 'count',
    description: 'Number of simulated fills.',
    higherIsBetter: true,
  },
  {
    key: 'fill_rate',
    label: 'Fill rate',
    unit: '%',
    description: 'Share of order quantity simulated as filled.',
    higherIsBetter: true,
  },
  {
    key: 'avg_slippage',
    label: 'Avg slippage',
    unit: 'bps',
    description: 'Simulated average slippage (reported, not computed here).',
    higherIsBetter: false,
  },
  {
    key: 'sim_latency',
    label: 'Sim latency',
    unit: 'ms',
    description: 'Simulated decision-to-fill latency.',
    higherIsBetter: false,
  },
  {
    key: 'reject_rate',
    label: 'Reject rate',
    unit: '%',
    description: 'Share of orders simulated as rejected.',
    higherIsBetter: false,
  },
  {
    key: 'turnover',
    label: 'Turnover',
    unit: 'x',
    description: 'Simulated portfolio turnover.',
    higherIsBetter: false,
  },
  {
    key: 'participation',
    label: 'Participation',
    unit: '%',
    description: 'Simulated participation rate of volume.',
    higherIsBetter: false,
  },
];

export function describeMetric(key: MetricKey): MetricDescriptor | undefined {
  return METRIC_CATALOG.find((metric) => metric.key === key);
}
