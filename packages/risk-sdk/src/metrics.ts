/**
 * The Risk Engine metric CATALOG — descriptors of known risk-governance indicators
 * (their key, label, unit and meaning) for the exposure summary and comparison
 * capabilities. This is VOCABULARY ONLY: it defines what an indicator *is*, never how
 * it is computed. No metric is calculated here — NO VaR, NO CVaR, NO expected
 * shortfall, NO stress testing. Per-assessment indicator VALUES are supplied as inert
 * data (see `RiskMetric` / `RiskExposure` in contracts).
 */
export type MetricKey =
  | 'gross_exposure'
  | 'net_exposure'
  | 'leverage'
  | 'concentration'
  | 'largest_position'
  | 'limit_utilization'
  | 'open_exceptions'
  | 'active_overrides';

export interface MetricDescriptor {
  readonly key: MetricKey;
  readonly label: string;
  readonly unit: string;
  readonly description: string;
  /** Whether a higher value is generally worse for risk (for display only, not a decision). */
  readonly higherIsWorse: boolean;
}

export const METRIC_CATALOG: readonly MetricDescriptor[] = [
  {
    key: 'gross_exposure',
    label: 'Gross exposure',
    unit: '%',
    description: 'Reported sum of absolute position weights.',
    higherIsWorse: true,
  },
  {
    key: 'net_exposure',
    label: 'Net exposure',
    unit: '%',
    description: 'Reported sum of signed position weights.',
    higherIsWorse: true,
  },
  {
    key: 'leverage',
    label: 'Leverage',
    unit: 'x',
    description: 'Reported gross leverage.',
    higherIsWorse: true,
  },
  {
    key: 'concentration',
    label: 'Concentration',
    unit: 'index',
    description: 'Reported weight concentration (not computed here).',
    higherIsWorse: true,
  },
  {
    key: 'largest_position',
    label: 'Largest position',
    unit: '%',
    description: 'Reported largest single-position weight.',
    higherIsWorse: true,
  },
  {
    key: 'limit_utilization',
    label: 'Limit utilization',
    unit: '%',
    description: 'Reported utilization of the binding limit.',
    higherIsWorse: true,
  },
  {
    key: 'open_exceptions',
    label: 'Open exceptions',
    unit: 'count',
    description: 'Number of open risk exceptions.',
    higherIsWorse: true,
  },
  {
    key: 'active_overrides',
    label: 'Active overrides',
    unit: 'count',
    description: 'Number of active human overrides.',
    higherIsWorse: true,
  },
];

export function describeMetric(key: MetricKey): MetricDescriptor | undefined {
  return METRIC_CATALOG.find((metric) => metric.key === key);
}
