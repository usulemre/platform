/**
 * The Backtesting Engine metric CATALOG — descriptors of known evaluation metrics
 * (their key, label, unit and meaning) for the Metric Catalog capability. This is
 * VOCABULARY ONLY: it defines what a metric *is*, never how it is computed. No
 * metric is calculated here; per-backtest metric VALUES are supplied as inert data
 * (see `BacktestMetric` in contracts).
 */
export type MetricKey =
  | 'total_return'
  | 'annualized_return'
  | 'sharpe'
  | 'sortino'
  | 'max_drawdown'
  | 'volatility'
  | 'hit_rate'
  | 'turnover';

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
    key: 'total_return',
    label: 'Total return',
    unit: '%',
    description: 'Cumulative net-of-cost return over the window.',
    higherIsBetter: true,
  },
  {
    key: 'annualized_return',
    label: 'Annualized return',
    unit: '%',
    description: 'Annualized net-of-cost return.',
    higherIsBetter: true,
  },
  {
    key: 'sharpe',
    label: 'Sharpe',
    unit: 'ratio',
    description: 'Risk-adjusted return (reported, deflation decided elsewhere).',
    higherIsBetter: true,
  },
  {
    key: 'sortino',
    label: 'Sortino',
    unit: 'ratio',
    description: 'Downside-risk-adjusted return.',
    higherIsBetter: true,
  },
  {
    key: 'max_drawdown',
    label: 'Max drawdown',
    unit: '%',
    description: 'Largest peak-to-trough decline.',
    higherIsBetter: false,
  },
  {
    key: 'volatility',
    label: 'Volatility',
    unit: '%',
    description: 'Annualized volatility.',
    higherIsBetter: false,
  },
  {
    key: 'hit_rate',
    label: 'Hit rate',
    unit: '%',
    description: 'Share of profitable periods.',
    higherIsBetter: true,
  },
  {
    key: 'turnover',
    label: 'Turnover',
    unit: 'x',
    description: 'Average portfolio turnover.',
    higherIsBetter: false,
  },
];

export function describeMetric(key: MetricKey): MetricDescriptor | undefined {
  return METRIC_CATALOG.find((metric) => metric.key === key);
}
