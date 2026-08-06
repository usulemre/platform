/**
 * The Portfolio Construction Engine metric CATALOG — descriptors of known portfolio
 * characteristics (their key, label, unit and meaning) for the Portfolio Comparison
 * capability. This is VOCABULARY ONLY: it defines what a characteristic *is*, never
 * how it is computed. No metric is calculated here; per-portfolio metric VALUES are
 * supplied as inert data (see `PortfolioMetric` in contracts).
 */
export type MetricKey =
  | 'holdings'
  | 'gross_exposure'
  | 'net_exposure'
  | 'largest_weight'
  | 'concentration'
  | 'turnover'
  | 'active_share'
  | 'tracking_error';

export interface MetricDescriptor {
  readonly key: MetricKey;
  readonly label: string;
  readonly unit: string;
  readonly description: string;
  /** Whether a higher value is generally preferred (for display only, not a decision). */
  readonly higherIsBetter: boolean;
}

export const METRIC_CATALOG: readonly MetricDescriptor[] = [
  {
    key: 'holdings',
    label: 'Holdings',
    unit: 'count',
    description: 'Number of positions in the portfolio.',
    higherIsBetter: true,
  },
  {
    key: 'gross_exposure',
    label: 'Gross exposure',
    unit: '%',
    description: 'Sum of absolute position weights.',
    higherIsBetter: false,
  },
  {
    key: 'net_exposure',
    label: 'Net exposure',
    unit: '%',
    description: 'Sum of signed position weights.',
    higherIsBetter: false,
  },
  {
    key: 'largest_weight',
    label: 'Largest weight',
    unit: '%',
    description: 'Largest single-position weight.',
    higherIsBetter: false,
  },
  {
    key: 'concentration',
    label: 'Concentration',
    unit: 'index',
    description: 'Weight concentration (reported, not computed here).',
    higherIsBetter: false,
  },
  {
    key: 'turnover',
    label: 'Turnover',
    unit: 'x',
    description: 'Expected rebalance turnover.',
    higherIsBetter: false,
  },
  {
    key: 'active_share',
    label: 'Active share',
    unit: '%',
    description: 'Share of the portfolio that differs from its benchmark.',
    higherIsBetter: true,
  },
  {
    key: 'tracking_error',
    label: 'Tracking error',
    unit: '%',
    description: 'Expected tracking error vs benchmark.',
    higherIsBetter: false,
  },
];

export function describeMetric(key: MetricKey): MetricDescriptor | undefined {
  return METRIC_CATALOG.find((metric) => metric.key === key);
}
