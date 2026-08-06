/**
 * The Live Trading Platform metric CATALOG — descriptors of known production-trading
 * indicators (their key, label, unit and meaning) for the trading-metrics and comparison
 * capabilities. This is VOCABULARY ONLY: it defines what an indicator *is*, never how it
 * is computed. No metric is calculated here; per-deployment indicator VALUES are supplied
 * as inert data (see `TradingMetric` in contracts). PnL figures are REPORTED by upstream
 * systems, never derived here.
 */
export type MetricKey =
  | 'realized_pnl'
  | 'unrealized_pnl'
  | 'gross_exposure'
  | 'net_exposure'
  | 'open_orders'
  | 'open_positions'
  | 'fill_rate'
  | 'uptime'
  | 'error_rate'
  | 'order_latency';

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
    key: 'realized_pnl',
    label: 'Realized PnL',
    unit: 'ccy',
    description: 'Reported realized profit and loss.',
    higherIsBetter: true,
  },
  {
    key: 'unrealized_pnl',
    label: 'Unrealized PnL',
    unit: 'ccy',
    description: 'Reported mark-to-market profit and loss.',
    higherIsBetter: true,
  },
  {
    key: 'gross_exposure',
    label: 'Gross exposure',
    unit: 'ccy',
    description: 'Reported gross notional exposure.',
    higherIsBetter: false,
  },
  {
    key: 'net_exposure',
    label: 'Net exposure',
    unit: 'ccy',
    description: 'Reported net notional exposure.',
    higherIsBetter: false,
  },
  {
    key: 'open_orders',
    label: 'Open orders',
    unit: 'count',
    description: 'Number of open production orders.',
    higherIsBetter: false,
  },
  {
    key: 'open_positions',
    label: 'Open positions',
    unit: 'count',
    description: 'Number of open positions.',
    higherIsBetter: false,
  },
  {
    key: 'fill_rate',
    label: 'Fill rate',
    unit: '%',
    description: 'Reported share of order quantity filled.',
    higherIsBetter: true,
  },
  {
    key: 'uptime',
    label: 'Uptime',
    unit: '%',
    description: 'Reported deployment uptime.',
    higherIsBetter: true,
  },
  {
    key: 'error_rate',
    label: 'Error rate',
    unit: '%',
    description: 'Reported order error/reject rate.',
    higherIsBetter: false,
  },
  {
    key: 'order_latency',
    label: 'Order latency',
    unit: 'ms',
    description: 'Reported order round-trip latency.',
    higherIsBetter: false,
  },
];

export function describeMetric(key: MetricKey): MetricDescriptor | undefined {
  return METRIC_CATALOG.find((metric) => metric.key === key);
}
