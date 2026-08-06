/**
 * The Performance Analytics Engine canonical METRIC CATALOG — the definitions of the
 * standard performance metrics (their key, label, category, unit, prose meaning and a
 * prose formula *description*) plus their catalog version. This is VOCABULARY ONLY: it
 * defines what a metric *is* and *means*, never how it is computed. There are NO formulas,
 * NO calculations and NO statistical algorithms here — metric VALUES are computed by the
 * external analytics runtime and supplied as inert data (see `PerformanceMetric` in
 * contracts). The `formulaDescription` field is human-readable prose, never executable code.
 */

/** Metric categories used to group the catalog. */
export type MetricCategory =
  | 'RETURN'
  | 'RISK'
  | 'RISK_ADJUSTED'
  | 'DRAWDOWN'
  | 'TRADE'
  | 'EXPOSURE'
  | 'BENCHMARK_RELATIVE';

export interface MetricCategoryDescriptor {
  readonly category: MetricCategory;
  readonly label: string;
  readonly description: string;
}

export const METRIC_CATEGORIES: readonly MetricCategoryDescriptor[] = [
  { category: 'RETURN', label: 'Return', description: 'Absolute and annualized return metrics.' },
  { category: 'RISK', label: 'Risk', description: 'Dispersion / volatility metrics.' },
  {
    category: 'RISK_ADJUSTED',
    label: 'Risk-adjusted',
    description: 'Return-per-unit-of-risk metrics.',
  },
  { category: 'DRAWDOWN', label: 'Drawdown', description: 'Peak-to-trough decline metrics.' },
  { category: 'TRADE', label: 'Trade', description: 'Trade-level statistics.' },
  { category: 'EXPOSURE', label: 'Exposure', description: 'Market-exposure metrics.' },
  {
    category: 'BENCHMARK_RELATIVE',
    label: 'Benchmark-relative',
    description: 'Metrics relative to a benchmark.',
  },
];

export function describeCategory(category: MetricCategory): MetricCategoryDescriptor | undefined {
  return METRIC_CATEGORIES.find((entry) => entry.category === category);
}

export type MetricKey =
  | 'total_return'
  | 'annual_return'
  | 'cagr'
  | 'volatility'
  | 'sharpe_ratio'
  | 'sortino_ratio'
  | 'calmar_ratio'
  | 'max_drawdown'
  | 'average_drawdown'
  | 'recovery_time'
  | 'win_rate'
  | 'profit_factor'
  | 'expectancy'
  | 'average_trade'
  | 'turnover'
  | 'exposure'
  | 'alpha'
  | 'beta'
  | 'information_ratio'
  | 'tracking_error';

export interface MetricDefinition {
  readonly key: MetricKey;
  readonly label: string;
  readonly category: MetricCategory;
  readonly unit: string;
  /** Human-readable meaning of the metric (never a formula). */
  readonly description: string;
  /** Human-readable description of how it is defined — prose, NOT executable code. */
  readonly formulaDescription: string;
  /** Whether a higher value is generally better (for display only, not a decision). */
  readonly higherIsBetter: boolean;
  /** The catalog version this definition belongs to (metric versioning). */
  readonly version: string;
}

/** The canonical metric catalog (v1). Definitions only — nothing is computed here. */
export const METRIC_CATALOG: readonly MetricDefinition[] = [
  {
    key: 'total_return',
    label: 'Total return',
    category: 'RETURN',
    unit: '%',
    description: 'Cumulative net return over the evaluation window.',
    formulaDescription:
      'End-to-start value change, expressed as a percentage; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'annual_return',
    label: 'Annual return',
    category: 'RETURN',
    unit: '%',
    description: 'Return annualized over the window.',
    formulaDescription: 'Return scaled to a one-year horizon; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'cagr',
    label: 'CAGR',
    category: 'RETURN',
    unit: '%',
    description: 'Compound annual growth rate.',
    formulaDescription: 'Geometric mean annual growth of value; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'volatility',
    label: 'Volatility',
    category: 'RISK',
    unit: '%',
    description: 'Annualized dispersion of returns.',
    formulaDescription:
      'Annualized standard deviation of periodic returns; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'sharpe_ratio',
    label: 'Sharpe ratio',
    category: 'RISK_ADJUSTED',
    unit: 'ratio',
    description: 'Excess return per unit of total risk.',
    formulaDescription:
      'Excess return divided by volatility; computed by the analytics runtime (deflation decided elsewhere).',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'sortino_ratio',
    label: 'Sortino ratio',
    category: 'RISK_ADJUSTED',
    unit: 'ratio',
    description: 'Excess return per unit of downside risk.',
    formulaDescription:
      'Excess return divided by downside deviation; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'calmar_ratio',
    label: 'Calmar ratio',
    category: 'RISK_ADJUSTED',
    unit: 'ratio',
    description: 'Annual return per unit of maximum drawdown.',
    formulaDescription:
      'Annualized return divided by maximum drawdown; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'max_drawdown',
    label: 'Maximum drawdown',
    category: 'DRAWDOWN',
    unit: '%',
    description: 'Largest peak-to-trough decline.',
    formulaDescription:
      'Largest observed drop from a running peak; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'average_drawdown',
    label: 'Average drawdown',
    category: 'DRAWDOWN',
    unit: '%',
    description: 'Mean of drawdown episodes.',
    formulaDescription:
      'Average of drawdown magnitudes over the window; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'recovery_time',
    label: 'Recovery time',
    category: 'DRAWDOWN',
    unit: 'days',
    description: 'Time to recover from the maximum drawdown.',
    formulaDescription:
      'Duration from trough back to prior peak; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'win_rate',
    label: 'Win rate',
    category: 'TRADE',
    unit: '%',
    description: 'Share of profitable trades.',
    formulaDescription:
      'Winning trades divided by total trades; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'profit_factor',
    label: 'Profit factor',
    category: 'TRADE',
    unit: 'ratio',
    description: 'Gross profit relative to gross loss.',
    formulaDescription:
      'Sum of profits divided by absolute sum of losses; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'expectancy',
    label: 'Expectancy',
    category: 'TRADE',
    unit: 'ccy',
    description: 'Expected profit per trade.',
    formulaDescription:
      'Probability-weighted average trade outcome; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'average_trade',
    label: 'Average trade',
    category: 'TRADE',
    unit: 'ccy',
    description: 'Mean profit/loss per trade.',
    formulaDescription: 'Total PnL divided by number of trades; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'turnover',
    label: 'Turnover',
    category: 'TRADE',
    unit: 'x',
    description: 'Portfolio turnover.',
    formulaDescription:
      'Traded notional relative to portfolio value; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'exposure',
    label: 'Exposure',
    category: 'EXPOSURE',
    unit: '%',
    description: 'Average market exposure.',
    formulaDescription:
      'Average deployed capital relative to total; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'alpha',
    label: 'Alpha',
    category: 'BENCHMARK_RELATIVE',
    unit: '%',
    description: 'Return beyond the benchmark-explained return.',
    formulaDescription:
      'Intercept of returns regressed on the benchmark; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'beta',
    label: 'Beta',
    category: 'BENCHMARK_RELATIVE',
    unit: 'ratio',
    description: 'Sensitivity to the benchmark.',
    formulaDescription:
      'Slope of returns regressed on the benchmark; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
  {
    key: 'information_ratio',
    label: 'Information ratio',
    category: 'RISK_ADJUSTED',
    unit: 'ratio',
    description: 'Active return per unit of tracking error.',
    formulaDescription:
      'Active return divided by tracking error; computed by the analytics runtime.',
    higherIsBetter: true,
    version: '1.0.0',
  },
  {
    key: 'tracking_error',
    label: 'Tracking error',
    category: 'BENCHMARK_RELATIVE',
    unit: '%',
    description: 'Dispersion of active returns.',
    formulaDescription:
      'Standard deviation of return differences vs the benchmark; computed by the analytics runtime.',
    higherIsBetter: false,
    version: '1.0.0',
  },
];

export function describeMetric(key: MetricKey): MetricDefinition | undefined {
  return METRIC_CATALOG.find((metric) => metric.key === key);
}

/** Metric definitions within a category. */
export function metricsInCategory(category: MetricCategory): readonly MetricDefinition[] {
  return METRIC_CATALOG.filter((metric) => metric.category === category);
}
